import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCookieConsent, setCookieConsent } from "@/lib/privacy";

const CookieConsentBanner = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getCookieConsent()) setVisible(true);
    const opener = () => setVisible(true);
    window.addEventListener("cookie-consent:open", opener);
    return () => window.removeEventListener("cookie-consent:open", opener);
  }, []);

  const choose = (value: "all" | "necessary") => {
    setCookieConsent(value, user?.id ?? null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 backdrop-blur-sm shadow-lg"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Cookie className="h-5 w-5 text-primary shrink-0 hidden sm:block" />
        <p className="text-xs text-foreground flex-1">
          We use cookies to improve your experience and analyze platform usage.{" "}
          <strong>We do not sell your data.</strong>{" "}
          <Link to="/privacy" className="underline text-primary hover:opacity-80">
            Learn more about our privacy policy
          </Link>
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => choose("necessary")}
            className="flex-1 sm:flex-none"
          >
            Necessary Only
          </Button>
          <Button size="sm" onClick={() => choose("all")} className="flex-1 sm:flex-none">
            Accept All
          </Button>
          <button
            aria-label="Close"
            onClick={() => setVisible(false)}
            className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;