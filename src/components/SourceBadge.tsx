import { cn } from "@/lib/utils";

export type SourceTier = "free" | "paid" | "user" | "ai";

interface SourceBadgeProps {
  tier: SourceTier;
  source: string;
  date?: string;
  confidence?: number;
  className?: string;
}

const STYLE: Record<SourceTier, { dot: string; bg: string; label: (s: string) => string }> = {
  free: { dot: "bg-health-green", bg: "bg-health-green/10 text-foreground", label: (s) => `Free Source · ${s}` },
  paid: { dot: "bg-blue-500", bg: "bg-blue-500/10 text-foreground", label: (s) => `Paid Data · ${s}` },
  user: { dot: "bg-amber-500", bg: "bg-amber-500/10 text-foreground", label: () => "User Submitted" },
  ai: { dot: "bg-muted-foreground", bg: "bg-muted text-foreground", label: () => "AI Extracted" },
};

const SourceBadge = ({ tier, source, date, confidence, className }: SourceBadgeProps) => {
  const s = STYLE[tier];
  const suffix =
    tier === "ai" && confidence != null ? ` · ${Math.round(confidence)}%` :
    date ? ` · ${date}` : "";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", s.bg, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label(source)}{suffix}
    </span>
  );
};

export default SourceBadge;