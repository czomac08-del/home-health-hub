import { Link } from "react-router-dom";
import { openCookiePreferences } from "@/lib/privacy";

const LegalFooter = () => (
  <footer className="border-t border-border mt-8 py-4 px-6">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
        <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
        <Link to="/privacy-rights" className="hover:text-muted-foreground transition-colors">Your Privacy Rights</Link>
        <Link to="/privacy#do-not-sell" className="hover:text-muted-foreground transition-colors">Do Not Sell My Information</Link>
        <button onClick={openCookiePreferences} className="hover:text-muted-foreground transition-colors">Cookie Preferences</button>
      </div>
      <p className="text-[10px] text-muted-foreground/60">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
    </div>
  </footer>
);

export default LegalFooter;
