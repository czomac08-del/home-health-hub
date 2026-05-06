import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const emailSchema = z.string().trim().email().max(255);

const SUBMITTED_KEY = "chiq_email_signup_submitted";

export const hasSubmittedEmail = () =>
  typeof window !== "undefined" && localStorage.getItem(SUBMITTED_KEY) === "1";

interface EmailSignupFormProps {
  source?: string;
  variant?: "default" | "compact";
  onSuccess?: () => void;
}

const EmailSignupForm = ({ source = "homepage", variant = "default", onSuccess }: EmailSignupFormProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { error: insertErr } = await supabase
      .from("email_signups")
      .insert({ email: parsed.data, source });
    if (insertErr && !/duplicate|unique/i.test(insertErr.message)) {
      setError("Something went wrong. Please try again.");
      setStatus("error");
      return;
    }
    try { localStorage.setItem(SUBMITTED_KEY, "1"); } catch {}
    setStatus("success");
    onSuccess?.();
  };

  if (status === "success") {
    return (
      <p className={variant === "compact" ? "text-sm text-foreground" : "text-base text-foreground font-heading font-bold"}>
        You're on the list. First Pulse arrives the 1st of next month.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
      <Input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 h-11 bg-background"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-heading font-extrabold text-sm hover:-translate-y-[2px] transition-all duration-200 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Me the Pulse"}
      </button>
      {error && (
        <p className="text-xs text-destructive sm:absolute sm:mt-12">{error}</p>
      )}
    </form>
  );
};

export default EmailSignupForm;