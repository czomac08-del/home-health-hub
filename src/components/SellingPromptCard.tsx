import { Home, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const STORAGE_KEY = "selling_prompt_dismissed_until";
const SESSION_KEY = "selling_prompt_shown";

export default function SellingPromptCard({ iqScore }: { iqScore: number | null | undefined }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof iqScore !== "number" || iqScore <= 60) return;
    try {
      const until = localStorage.getItem(STORAGE_KEY);
      if (until && Number(until) > Date.now()) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setShow(true);
    } catch { /* no-op */ }
  }, [iqScore]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch { /* no-op */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-5 mb-6 relative">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Home className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-sm font-semibold text-foreground mb-1">🏡 Ready to sell someday?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Your ComingHomeIQ record is your best negotiating tool. Start your seller profile anytime — it takes 5 minutes and buyers love it.
          </p>
          <button
            onClick={() => navigate("/handover")}
            className="text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors px-3 py-1.5 rounded-lg"
          >
            Prepare to Sell →
          </button>
        </div>
      </div>
    </div>
  );
}