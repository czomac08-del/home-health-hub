import { Shield, FileText, MessageSquare, Bot, Landmark } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const TIERS = [
  { min: 95, label: "True Record", icon: Landmark, className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { min: 80, label: "Verified", icon: Shield, className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { min: 60, label: "Documented", icon: FileText, className: "bg-primary/20 text-primary border-primary/30" },
  { min: 40, label: "Reported", icon: MessageSquare, className: "bg-muted text-muted-foreground border-border" },
  { min: 0, label: "Estimated", icon: Bot, className: "bg-muted text-muted-foreground border-border" },
] as const;

const getTier = (score: number) => TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1];

const ConfidenceBadge = ({ score, showLabel = true, size = "sm" }: ConfidenceBadgeProps) => {
  const tier = getTier(score);
  const Icon = tier.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tier.className}`}>
      <Icon className={iconSize} />
      {showLabel && <span>{tier.label}</span>}
      <span className="opacity-70">{score}</span>
    </span>
  );
};

export default ConfidenceBadge;
export { getTier, TIERS };
