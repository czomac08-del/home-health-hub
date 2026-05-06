import { useEffect, useState } from "react";
import { X } from "lucide-react";
import EmailSignupForm, { hasSubmittedEmail } from "./EmailSignupForm";

const SESSION_DISMISS_KEY = "chiq_email_slidein_dismissed";

const EmailSignupSlideIn = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasSubmittedEmail()) return;
    if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") return;

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.6) {
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, "1"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4 relative">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-2 right-2 sm:static sm:order-last p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-heading font-bold text-foreground">Get your free monthly Home Health Pulse</p>
          <p className="text-xs text-muted-foreground">One email per month. Personalized to your address. No spam.</p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[360px]">
          <EmailSignupForm source="slide-in" variant="compact" onSuccess={() => setTimeout(() => setVisible(false), 3000)} />
        </div>
      </div>
    </div>
  );
};

export default EmailSignupSlideIn;