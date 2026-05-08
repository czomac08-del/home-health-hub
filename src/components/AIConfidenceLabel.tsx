import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIConfidenceLevel = "verified" | "unverified" | "not_found";

interface Props {
  level: AIConfidenceLevel;
  className?: string;
}

const STYLE: Record<AIConfidenceLevel, { label: string; bg: string; Icon: typeof CheckCircle2 }> = {
  verified:   { label: "VERIFIED",   bg: "bg-health-green/15 text-health-green border-health-green/30", Icon: CheckCircle2 },
  unverified: { label: "UNVERIFIED", bg: "bg-warning/15 text-warning border-warning/30",                 Icon: AlertTriangle },
  not_found:  { label: "NOT FOUND",  bg: "bg-danger/15 text-danger border-danger/30",                    Icon: XCircle },
};

const AIConfidenceLabel = ({ level, className }: Props) => {
  const s = STYLE[level];
  const Icon = s.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
        s.bg,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
};

export default AIConfidenceLabel;