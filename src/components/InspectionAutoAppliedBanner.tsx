import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Toast-style dashboard banner that shows up after an inspection report is
 * uploaded and IQ has auto-applied its data to the user's systems.
 */
export default function InspectionAutoAppliedBanner() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const onApplied = (e: Event) => {
      const detail = (e as CustomEvent).detail as { count?: number } | undefined;
      if (detail?.count) setCount(detail.count);
    };
    window.addEventListener("inspection-auto-applied", onApplied);
    return () => window.removeEventListener("inspection-auto-applied", onApplied);
  }, []);

  if (!count) return null;

  return (
    <div className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 flex items-center gap-3">
      <Sparkles className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-foreground">
          IQ updated {count} system{count !== 1 ? "s" : ""} from your inspection report
        </p>
        <Link to="/systems" className="text-xs text-primary underline">
          Tap to review
        </Link>
      </div>
      <button onClick={() => setCount(null)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}