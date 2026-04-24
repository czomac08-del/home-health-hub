import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-04-30.basil" });

// Phase 1 referral economics — mirrors src/components/ProPartnerWidget.tsx and
// ShareAndSaveWidget. We only flip `converted_to_paid` here; reward dollars are
// computed from those flags in the UI. No money is moved automatically yet.
const RETENTION_MS = 1000 * 60 * 60 * 24 * 90; // ~3 months

// Phase 2 reward economics — pending approval queue, no auto-Stripe action.
// Homeowner: 1 free month on referee's first paid invoice.
// Contractor: $50 account credit once referee is retained for 3 months.
const HOMEOWNER_REWARD = {
  reward_type: "free_month",
  reward_amount_cents: null as number | null,
  reward_description: "1 free month of Pro",
};
const CONTRACTOR_RETENTION_REWARD = {
  reward_type: "account_credit",
  reward_amount_cents: 5000,
  reward_description: "$50 account credit (3-month retention)",
};

// deno-lint-ignore no-explicit-any
async function queueRewardIfNeeded(
  supabase: any,
  ref: { id: string; referrer_user_id: string; referred_user_id: string; referrer_type: string },
  trigger: "first_paid" | "retention_3mo",
) {
  const isContractor = ref.referrer_type === "contractor";
  // Homeowner program rewards on first paid; contractor program rewards on retention.
  if (trigger === "first_paid" && isContractor) return;
  if (trigger === "retention_3mo" && !isContractor) return;

  const reward = isContractor ? CONTRACTOR_RETENTION_REWARD : HOMEOWNER_REWARD;

  await supabase.from("referral_rewards").upsert(
    {
      referral_id: ref.id,
      referrer_user_id: ref.referrer_user_id,
      referred_user_id: ref.referred_user_id,
      referrer_type: ref.referrer_type,
      trigger_event: trigger,
      status: "pending",
      ...reward,
    },
    { onConflict: "referral_id,trigger_event", ignoreDuplicates: true },
  );
}

// deno-lint-ignore no-explicit-any
async function markReferralConverted(supabase: any, referredUserId: string) {
  // Find the (at most one) referral row for this user that hasn't converted yet.
  const { data: ref } = await supabase
    .from("referrals")
    .select("id, signup_date, converted_to_paid, retained_3_months, referrer_user_id, referred_user_id, referrer_type")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (!ref) return;

  const updates: Record<string, unknown> = {};
  const justConverted = !ref.converted_to_paid;
  let justRetained = false;
  if (!ref.converted_to_paid) {
    updates.converted_to_paid = true;
    updates.conversion_date = new Date().toISOString();
  }
  // Retention check: if signup is older than 90 days and they're paying, mark retained.
  if (
    !ref.retained_3_months &&
    ref.signup_date &&
    Date.now() - new Date(ref.signup_date).getTime() >= RETENTION_MS
  ) {
    updates.retained_3_months = true;
    justRetained = true;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("referrals").update(updates).eq("id", ref.id);
  }

  if (justConverted) await queueRewardIfNeeded(supabase, ref, "first_paid");
  if (justRetained) await queueRewardIfNeeded(supabase, ref, "retention_3mo");
}

// deno-lint-ignore no-explicit-any
async function findUserIdForCustomer(supabase: any, customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.text();
    let event: Stripe.Event;

    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (sig && webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id || "homeowner_pro";
        const billingPeriod = session.metadata?.billing_period || "monthly";

        if (!userId) break;

        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            plan_id: planId,
            billing_period: billingPeriod,
            status: sub.status,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          }, { onConflict: "user_id" });
        }

        // One-time payments also count as "converted to paid" for referral attribution.
        if (session.mode === "payment" && session.payment_status === "paid") {
          await markReferralConverted(supabase, userId);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });

        // Re-evaluate retention on every subscription update for active subs.
        if (sub.status === "active" || sub.status === "trialing") {
          await markReferralConverted(supabase, userId);
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        // The most reliable "they actually paid money" signal. Works for the
        // first subscription invoice AND every renewal (which is how we detect
        // 3-month retention).
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.amount_paid <= 0) break; // skip $0 trial invoices

        // Prefer metadata.user_id (set on checkout), fall back to a customer lookup.
        let userId =
          (invoice.subscription_details?.metadata?.user_id as string | undefined) ||
          (invoice.metadata?.user_id as string | undefined) ||
          null;

        if (!userId) {
          userId = await findUserIdForCustomer(supabase, invoice.customer as string | null);
        }
        if (!userId) break;

        await markReferralConverted(supabase, userId);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
});
