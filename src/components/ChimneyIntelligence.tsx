import { useMemo } from "react";
import { Flame, AlertTriangle, CheckCircle2, ExternalLink, Shield, Bird } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { parseStateFromAddress } from "@/lib/parseAddress";

interface Props {
  specs: Record<string, string | boolean | string[]>;
  homeYearBuilt?: string | null;
}

// Counties / states with elevated wildfire risk where ember-resistant
// spark arrestor caps are commonly required or recommended.
const WILDFIRE_RISK_STATES = new Set([
  "CA", "OR", "WA", "ID", "MT", "NV", "UT", "AZ", "NM", "CO", "WY",
]);

const monthsSince = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
};

export const ChimneyIntelligence = ({ specs, homeYearBuilt }: Props) => {
  const { activeProperty } = useAuth();
  const state = useMemo(() => parseStateFromAddress(activeProperty?.address ?? null), [activeProperty]);
  const wildfireZone = state ? WILDFIRE_RISK_STATES.has(state) : false;

  const lastInspection = specs.lastInspectionDate as string | undefined;
  const lastSweep = specs.lastSweepingDate as string | undefined;
  const liner = specs.linerType as string | undefined;
  const cap = specs.capPresent as string | undefined;
  const crown = specs.crownCondition as string | undefined;

  const hasAnyData = !!(lastInspection || lastSweep || liner || cap || specs.chimneyType);

  if (!hasAnyData) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 mb-4 flex items-start gap-3">
        <Flame className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">No chimney data on file</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your inspection and cleaning records below to start tracking chimney health.
          </p>
        </div>
      </div>
    );
  }

  // Scoring on inspection date
  const inspMonths = monthsSince(lastInspection);
  let badge: { color: string; bg: string; border: string; label: string; msg: string };
  if (inspMonths !== null && inspMonths <= 12) {
    badge = { color: "text-health-green", bg: "bg-health-green/10", border: "border-health-green/30", label: "Up to date", msg: `Last inspected ${inspMonths} month${inspMonths === 1 ? "" : "s"} ago.` };
  } else if (inspMonths !== null && inspMonths <= 24) {
    badge = { color: "text-health-amber", bg: "bg-health-amber/10", border: "border-health-amber/30", label: "Due soon", msg: `Last inspected ${inspMonths} months ago — schedule before fireplace season.` };
  } else {
    badge = { color: "text-health-red", bg: "bg-health-red/10", border: "border-health-red/30", label: "Inspection overdue", msg: inspMonths === null ? "No inspection on file. NFPA 211 recommends annual inspection for all fireplaces." : `Last inspected ${inspMonths} months ago. NFPA 211 recommends annual inspection.` };
  }

  // Action prompts
  const prompts: { icon: typeof AlertTriangle; tone: "warn" | "info"; text: string }[] = [];

  const yearBuiltNum = parseInt((homeYearBuilt || "").replace(/\D/g, ""), 10);
  const homeAge = isNaN(yearBuiltNum) ? null : new Date().getFullYear() - yearBuiltNum;
  if ((liner === "Clay tile" || liner === "None / Unknown" || !liner) && homeAge !== null && homeAge > 30) {
    prompts.push({
      icon: AlertTriangle,
      tone: "warn",
      text: "Liner is unknown or clay tile in a home over 30 years old — NFPA 211 requires a Level II inspection before selling or after any chimney fire.",
    });
  }
  if (cap === "No" || cap === "Unknown") {
    prompts.push({
      icon: Bird,
      tone: "warn",
      text: "No chimney cap on file — water intrusion and animal entry risk. Caps prevent rain, debris, and birds from entering the flue.",
    });
  }
  if (!lastSweep) {
    prompts.push({
      icon: AlertTriangle,
      tone: "info",
      text: "No cleaning date on file. Schedule a sweep before fireplace season (October).",
    });
  }
  if (crown === "Cracked" || crown === "Missing") {
    prompts.push({
      icon: AlertTriangle,
      tone: "warn",
      text: `Crown condition reported as "${crown}". A damaged crown allows water into the chimney structure — repair before next freeze cycle.`,
    });
  }
  if (wildfireZone) {
    prompts.push({
      icon: Flame,
      tone: "warn",
      text: `Your county is in a wildfire-risk zone (${state}). Many high-risk counties require or recommend ember-resistant spark arrestor caps. Verify your cap meets local fire-code requirements.`,
    });
  }

  return (
    <div className="space-y-3 mb-4">
      <div className={`rounded-xl border ${badge.border} ${badge.bg} p-4 flex items-start gap-3`}>
        {inspMonths !== null && inspMonths <= 12 ? (
          <CheckCircle2 className={`h-5 w-5 ${badge.color} shrink-0 mt-0.5`} />
        ) : (
          <AlertTriangle className={`h-5 w-5 ${badge.color} shrink-0 mt-0.5`} />
        )}
        <div className="flex-1">
          <p className={`text-sm font-semibold ${badge.color}`}>{badge.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{badge.msg}</p>
          <a
            href="https://www.csia.org/find-a-csia-certified-sweep"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Find a CSIA-certified sweep <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {prompts.map((p, i) => {
        const Icon = p.icon;
        const tone = p.tone === "warn"
          ? "border-health-amber/30 bg-health-amber/5 text-health-amber"
          : "border-border bg-card text-muted-foreground";
        return (
          <div key={i} className={`rounded-xl border ${tone} p-3 flex items-start gap-2`}>
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">{p.text}</p>
          </div>
        );
      })}

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground">
          <span className="font-semibold">Insurance tip:</span> Most homeowners insurance policies require chimneys to be maintained and inspected. An undocumented chimney fire or carbon monoxide event can void your claim. Keeping your inspection records here protects you.
        </p>
      </div>
    </div>
  );
};

export default ChimneyIntelligence;