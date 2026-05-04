import { Info } from "lucide-react";

export type ComplianceVariant =
  | "fcra"
  | "real-estate"
  | "inspection"
  | "legal"
  | "financial"
  | "ai-generated"
  | "fair-housing"
  | "contractor-referral";

const COPY: Record<ComplianceVariant, { label: string; body: string }> = {
  fcra: {
    label: "Not an FCRA report",
    body:
      "ComingHomeIQ is not a Consumer Reporting Agency under the FCRA (15 U.S.C. § 1681). This data may not be used for credit, insurance, employment, or tenant screening decisions.",
  },
  "real-estate": {
    label: "Not real estate advice",
    body:
      "ComingHomeIQ is not a licensed real estate broker, agent, or appraiser. Property values and market data are informational only. Consult a licensed real estate professional in your state.",
  },
  inspection: {
    label: "Not a home inspection",
    body:
      "ComingHomeIQ is not a licensed home inspection service. Inspection data shown is sourced from third-party reports. Always hire a licensed home inspector for a professional inspection.",
  },
  legal: {
    label: "Not legal advice",
    body:
      "Nothing here constitutes legal advice. State laws vary and change. Consult a licensed attorney in your state for advice specific to your situation.",
  },
  financial: {
    label: "Not financial advice",
    body:
      "ComingHomeIQ does not provide financial, investment, or tax advice. All financial estimates are illustrative only. Consult a licensed financial advisor or CPA before making decisions.",
  },
  "ai-generated": {
    label: "AI-generated",
    body:
      "This content was generated with AI assistance and may contain errors. Verify important information through independent sources before relying on it.",
  },
  "fair-housing": {
    label: "Fair Housing notice",
    body:
      "Neighborhood data is provided for informational purposes only. ComingHomeIQ is committed to Fair Housing principles and does not facilitate discrimination based on race, color, national origin, religion, sex, familial status, disability, or any other protected characteristic.",
  },
  "contractor-referral": {
    label: "Contractor referral notice",
    body:
      "ComingHomeIQ may have a business relationship with some service providers listed. We do not accept payment for placement or referrals. Always independently verify contractor credentials, licensing, and insurance.",
  },
};

interface Props {
  variant: ComplianceVariant;
  className?: string;
  /** Compact one-line variant. Defaults to multi-line padded card. */
  inline?: boolean;
}

const ComplianceDisclaimer = ({ variant, className = "", inline = false }: Props) => {
  const { label, body } = COPY[variant];
  if (inline) {
    return (
      <p className={`text-[10px] text-muted-foreground/70 leading-relaxed ${className}`}>
        <span className="font-semibold text-muted-foreground">{label}:</span> {body}
      </p>
    );
  }
  return (
    <div
      className={`rounded-xl border border-border/60 bg-secondary/30 p-3 flex gap-2 ${className}`}
      role="note"
    >
      <Info className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" aria-hidden />
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-foreground/80">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
};

export default ComplianceDisclaimer;