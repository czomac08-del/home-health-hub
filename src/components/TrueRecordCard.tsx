import { Landmark, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import ConfidenceBadge from "./ConfidenceBadge";

interface VerificationSource {
  source_type: string;
  source_name: string;
  result: string;
  verified_at: string;
}

interface TrueRecordCardProps {
  title: string;
  subtitle?: string;
  confidenceScore: number;
  sources?: VerificationSource[];
  isArchived?: boolean;
  existedFrom?: string;
  existedUntil?: string;
  removalReason?: string;
}

const SOURCE_ICONS: Record<string, string> = {
  government: "🏛️",
  satellite: "🛰️",
  community: "👥",
  document: "📄",
  expert: "👷",
  previous_owner: "🏠",
  homeowner: "💬",
  ai_inference: "🤖",
};

const TrueRecordCard = ({
  title,
  subtitle,
  confidenceScore,
  sources = [],
  isArchived = false,
  existedFrom,
  existedUntil,
  removalReason,
}: TrueRecordCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isTrueRecord = confidenceScore >= 95;

  const borderClass = isArchived
    ? "border-dashed border-muted-foreground/30"
    : isTrueRecord
    ? "border-amber-500/40"
    : "border-border";

  return (
    <div className={`rounded-xl border ${borderClass} bg-card p-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isTrueRecord && <Landmark className="h-4 w-4 text-amber-400 shrink-0" />}
            {isArchived && <span className="text-xs text-muted-foreground">📦 Archived</span>}
            <span className={`text-sm font-semibold ${isArchived ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {title}
            </span>
            <ConfidenceBadge score={confidenceScore} />
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {isArchived && existedFrom && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Existed {existedFrom}–{existedUntil || "unknown"}{removalReason ? ` · ${removalReason}` : ""}
            </p>
          )}
        </div>
        {sources.length > 0 && (
          expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && sources.length > 0 && (
        <div className="mt-3 ml-1 space-y-1.5 border-t border-border pt-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Verification Sources ({sources.length})
          </p>
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span>{SOURCE_ICONS[s.source_type] || "📋"}</span>
              <span className={s.result === "confirmed" ? "text-teal-400" : s.result === "conflict" ? "text-amber-400" : "text-muted-foreground"}>
                {s.result === "confirmed" ? "✅" : s.result === "conflict" ? "⚠️" : "⏳"} {s.source_name}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(s.verified_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {isArchived && (
        <div className="mt-3 rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground/70">🏛️ Permanently Archived</p>
          <p className="mt-1">This structure no longer exists. This record is permanently preserved in the ComingHomeIQ True Record archive.</p>
        </div>
      )}
    </div>
  );
};

export default TrueRecordCard;
