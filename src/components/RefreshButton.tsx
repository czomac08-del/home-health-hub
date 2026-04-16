import { RefreshCw, CheckCircle2, AlertCircle, Clock, DollarSign } from "lucide-react";
import { useDataRefresh, type RefreshScope, type SourceResult } from "@/hooks/useDataRefresh";
import { useState } from "react";
import PurchaseRefreshModal from "./PurchaseRefreshModal";

interface RefreshButtonProps {
  scope?: RefreshScope;
  variant?: "card" | "compact" | "empty-state";
  className?: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTimeUntil = (date: Date) => {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const SourceResultRow = ({ result }: { result: SourceResult }) => {
  const iconClass = "h-3.5 w-3.5 shrink-0";
  return (
    <div className="flex items-start gap-2 py-1.5">
      {result.status === "new_data" && <AlertCircle className={`${iconClass} text-primary`} />}
      {result.status === "no_changes" && <CheckCircle2 className={`${iconClass} text-muted-foreground`} />}
      {result.status === "unavailable" && <Clock className={`${iconClass} text-muted-foreground/50`} />}
      <div className="min-w-0">
        <span className={`text-xs font-medium ${result.status === "new_data" ? "text-primary" : "text-muted-foreground"}`}>
          {result.source}
        </span>
        {result.summary && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">{result.summary}</p>
        )}
      </div>
    </div>
  );
};

const RefreshButton = ({ scope = "full", variant = "compact", className = "" }: RefreshButtonProps) => {
  const { isRefreshing, lastRefresh, lastResult, cooldownEnd, canRefresh, refresh, sources } = useDataRefresh(scope);
  const [showResults, setShowResults] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleClick = async () => {
    if (!canRefresh) return;
    setShowResults(true);
    await refresh();
  };

  // Empty state variant — larger, discovery-focused
  if (variant === "empty-state") {
    return (
      <div className={`space-y-3 ${className}`}>
        <button
          onClick={handleClick}
          disabled={!canRefresh || isRefreshing}
          className="w-full rounded-xl border border-primary/30 bg-primary/5 py-3.5 px-4 font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Searching..." : "Search for Records"}
        </button>
        {lastRefresh && (
          <p className="text-[11px] text-muted-foreground text-center">
            Last checked: {formatDate(lastRefresh)}
          </p>
        )}
        {!canRefresh && cooldownEnd && (
          <p className="text-[11px] text-muted-foreground text-center">
            Next refresh available in {formatTimeUntil(cooldownEnd)}
          </p>
        )}
        {showResults && lastResult && (
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            {lastResult.sources.map((s) => (
              <SourceResultRow key={s.source} result={s} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Card variant — prominent, for dashboard
  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Check for New Records</h3>
            {lastRefresh ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last checked: {formatDate(lastRefresh)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                {sources.length} data sources ready
              </p>
            )}
          </div>
          <button
            onClick={handleClick}
            disabled={!canRefresh || isRefreshing}
            className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {!canRefresh && cooldownEnd && cooldownEnd > new Date() && (
          <p className="text-[11px] text-muted-foreground">
            You checked for updates recently. Next refresh available in {formatTimeUntil(cooldownEnd)}.
          </p>
        )}

        {lastResult && lastResult.updatesFound > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs font-medium text-primary mb-2">
              Updates Found — Tap to Review
            </p>
            {lastResult.sources
              .filter((s) => s.status === "new_data")
              .map((s) => (
                <SourceResultRow key={s.source} result={s} />
              ))}
          </div>
        )}

        {showResults && lastResult && lastResult.updatesFound === 0 && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Up to Date — {formatDate(lastResult.timestamp)}
            </p>
            {lastResult.sources.map((s) => (
              <SourceResultRow key={s.source} result={s} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Compact variant — for system pages
  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={!canRefresh || isRefreshing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing
          ? "Checking..."
          : lastRefresh
            ? `Last checked: ${formatDate(lastRefresh)}`
            : "Check for New Records"}
      </button>

      {!canRefresh && cooldownEnd && cooldownEnd > new Date() && (
        <p className="text-[10px] text-muted-foreground">
          Next refresh in {formatTimeUntil(cooldownEnd)}
        </p>
      )}

      {showResults && lastResult && (
        <div className="rounded-lg border border-border bg-card p-2.5 space-y-1">
          {lastResult.sources.map((s) => (
            <SourceResultRow key={s.source} result={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RefreshButton;
