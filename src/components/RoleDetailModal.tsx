import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, ClipboardList, Wrench, TrendingUp, Check, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Centralized placeholder for real platform statistics.
 * Update these values in ONE place when real data is available —
 * every modal that references `platformStats.*` will update automatically.
 */
export const platformStats = {
  totalReports: "—",          // e.g. "12,400"
  avgTimeToSetup: "—",        // e.g. "under 5 minutes"
  statesActive: "50",
  govDataSources: "9+",
  systemCategories: "16",
  avgValueLift: "—",          // e.g. "$5,000–$10,000"
  fasterSale: "up to 3%",     // industry placeholder, replace with our own once tracked
};

export type RoleKey = "homeowner" | "realtor" | "inspector" | "contractor" | "investor";

type RoleContent = {
  title: string;
  icon: LucideIcon;
  tagline: string;
  bullets: string[];
  stat?: string;
  comingSoon?: string;
};

const ROLE_CONTENT: Record<RoleKey, RoleContent> = {
  homeowner: {
    title: "Homeowners",
    icon: Home,
    tagline: "Your home is likely your biggest asset. Here's what we help you protect.",
    bullets: [
      "See everything your county, FEMA, NOAA, and EPA have on file about your property — flood zone, disaster history, environmental flags, permit records — in one place",
      "Track every major home system (roof, HVAC, electrical, plumbing, well, septic, chimney, appliances) with dates, condition notes, and maintenance history you enter over time",
      "Upload inspection reports, warranties, and manuals — our AI reads them and fills in your home's profile automatically",
      "Get alerts when your county releases new permit data, when a disaster event occurs near your address, or when a home system is overdue for service",
      `Access the Home Defense Hub — if your county is in drought, facing grid instability, or under a flood warning, we surface the real government programs and legal rights available to you, at no extra cost`,
      "When you sell, transfer your complete home history to the buyer — homes with documented histories sell faster and for more money",
    ],
    stat: `${platformStats.govDataSources} live government data sources connected across ${platformStats.statesActive} states`,
    comingSoon: "Neighborhood comparison scores and automated home value impact estimates",
  },
  realtor: {
    title: "Realtors",
    icon: Briefcase,
    tagline: "Win more listings. Close faster. Stand out on every deal.",
    bullets: [
      "Walk into every listing appointment with a pre-populated ComingHomeIQ property report — flood zone, disaster history, permit records, and risk scores already pulled",
      "Generate a professional Buyer Report in one click — a shareable, branded document that answers every disclosure question before it's asked",
      "Offer sellers a free Home IQ profile as part of your listing package — documented systems history is a proven differentiator that can increase sale price",
      "Use verified data to support your CMAs and reduce back-and-forth on inspection negotiations",
      "Professional subscription includes multi-property access, bulk report generation, and your name/contact on every report you generate",
    ],
    stat: `Homes with complete maintenance records sell ${platformStats.fasterSale} faster on average — we'll update this with our own platform data as it grows`,
  },
  inspector: {
    title: "Home Inspectors",
    icon: ClipboardList,
    tagline: "Arrive prepared. Deliver more. Build your reputation.",
    bullets: [
      "Access pre-populated property data before you ever step on site — known system ages, permit history, prior inspection flags, and FEMA/EPA records already pulled for the address",
      "Spend less time on data entry during the inspection and more time on what only you can do: physically assess the property",
      "Upload your completed inspection report and our AI extracts key findings, dates, and system conditions — automatically updating the homeowner's profile",
      "Earn a Verified Inspector badge on every data point you contribute — your findings are marked as professionally verified, building trust with homeowners and buyers",
      "Per-inspection pricing means no subscription commitment. Pay only for the reports you generate.",
    ],
    comingSoon: "Inspector referral profile visible to homeowners in your service area",
  },
  contractor: {
    title: "Pro Contractors",
    icon: Wrench,
    tagline: "Show up knowing everything. Quote confidently. Win more jobs.",
    bullets: [
      "Before any service call, pull the full system history for the property — installation dates, prior service records, model numbers, known issues, and warranty status",
      "No more guessing the age of a water heater or HVAC unit — if it's been documented, you'll see it",
      "Log your completed work directly to the homeowner's profile — creates a verified service record that protects you if questions arise later",
      "Homeowners who use ComingHomeIQ are more maintenance-aware, more likely to act on recommendations, and more likely to call back",
    ],
    comingSoon: "Contractor profile listing for homeowners searching for trusted local pros by trade and service area",
  },
  investor: {
    title: "Real Estate Investors",
    icon: TrendingUp,
    tagline: "Track every property. Know your numbers. Move faster.",
    bullets: [
      "Manage multiple properties under one account with a Portfolio dashboard — each property gets its own full ComingHomeIQ profile",
      "Pull risk data, permit history, disaster records, and system condition at a glance before making an offer — due diligence in minutes, not days",
      "Track renovation budgets, contractor work logs, and system upgrades per property",
      "Generate a ComingHomeIQ report for any property you're selling — a documented history is a marketable asset that supports your asking price",
      "Portfolio Plan pricing scales with your number of properties — no per-feature upcharges",
    ],
    comingSoon: "ROI calculator that factors property risk scores and system age into estimated maintenance cost projections",
  },
};

interface RoleDetailModalProps {
  roleKey: RoleKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStarted: (roleKey: RoleKey) => void;
}

const RoleDetailModal = ({ roleKey, open, onOpenChange, onGetStarted }: RoleDetailModalProps) => {
  if (!roleKey) return null;
  const content = ROLE_CONTENT[roleKey];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 sm:max-h-[85vh] gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-heading font-black text-foreground">
                {content.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{content.tagline}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-3">
          {content.bullets.map((b, i) => (
            <div key={i} className="flex gap-3">
              <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
              <p className="text-sm text-foreground leading-relaxed">{b}</p>
            </div>
          ))}

          {content.stat && (
            <div className="mt-4 rounded-xl bg-muted/50 border border-border p-4">
              <p className="text-xs uppercase tracking-wider font-heading font-bold text-muted-foreground mb-1">
                By the numbers
              </p>
              <p className="text-sm text-foreground">{content.stat}</p>
            </div>
          )}

          {content.comingSoon && (
            <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wider font-heading font-bold text-primary mb-1">
                  Coming soon
                </p>
                <p className="text-sm text-foreground">{content.comingSoon}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-2 border-t border-border bg-card sticky bottom-0">
          <Button
            onClick={() => onGetStarted(roleKey)}
            className="w-full h-12 text-base font-heading font-bold"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDetailModal;