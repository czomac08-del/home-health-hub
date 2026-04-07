import { Shield } from "lucide-react";
import type { PrivacySettings } from "./PhotoPrivacySettings";

interface Props {
  settings?: PrivacySettings;
}

const PrivacyBadge = ({ settings }: Props) => {
  // Determine overall privacy status
  const allPrivate = !settings || Object.values(settings || {}).every((v) => v === "private");
  const anyProfessional = settings && Object.values(settings).some((v) => v === "professional");

  let label: string;
  let colorClass: string;

  if (allPrivate) {
    label = "Private";
    colorClass = "text-health-green bg-health-green/15 border-health-green/30";
  } else if (anyProfessional) {
    label = "Shared";
    colorClass = "text-amber-400 bg-amber-400/15 border-amber-400/30";
  } else {
    label = "Shared";
    colorClass = "text-primary bg-primary/15 border-primary/30";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${colorClass}`}>
      <Shield className="h-3 w-3" />
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  );
};

export default PrivacyBadge;
