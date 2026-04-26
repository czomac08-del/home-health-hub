import { Award, Receipt, Camera, AlertCircle } from "lucide-react";

export type VerificationLevel =
  | "permit_verified"
  | "receipt_verified"
  | "photo_timestamp"
  | "owner_claimed";

const META: Record<VerificationLevel, { label: string; bg: string; text: string; Icon: typeof Award }> = {
  permit_verified:  { label: "Permit Verified",   bg: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300",   text: "Gold",   Icon: Award },
  receipt_verified: { label: "Receipt Verified",  bg: "bg-health-green/15 border-health-green/40 text-health-green",              text: "Green",  Icon: Receipt },
  photo_timestamp:  { label: "Photo Timestamp",   bg: "bg-primary/15 border-primary/40 text-primary",                              text: "Blue",   Icon: Camera },
  owner_claimed:    { label: "Owner Claimed — Unverified", bg: "bg-amber-400/10 border-amber-400/40 text-amber-700 dark:text-amber-300", text: "Yellow", Icon: AlertCircle },
};

interface Props {
  level: VerificationLevel;
  className?: string;
  compact?: boolean;
}

const VerificationBadge = ({ level, className = "", compact = false }: Props) => {
  const m = META[level];
  const Icon = m.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${className}`}
      title={m.label}
    >
      <Icon className="h-3 w-3" />
      {!compact && <span>{m.label}</span>}
    </span>
  );
};

export default VerificationBadge;