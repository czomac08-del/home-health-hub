import { Link } from "react-router-dom";
import { openCookiePreferences } from "@/lib/privacy";

const LegalFooter = () => (
  <footer className="border-t border-border mt-8 py-4 px-6">
    <div className="max-w-5xl mx-auto space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
          <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          <Link to="/privacy-rights" className="hover:text-muted-foreground transition-colors">Your Privacy Rights</Link>
          <Link to="/privacy#do-not-sell" className="hover:text-muted-foreground transition-colors">Do Not Sell My Information</Link>
          <button onClick={openCookiePreferences} className="hover:text-muted-foreground transition-colors">Cookie Preferences</button>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 border border-border rounded px-1.5 py-0.5"
            aria-label="Equal Housing Opportunity"
            title="Equal Housing Opportunity"
          >
            Equal Housing Opportunity
          </span>
          <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} ComingHomeIQ LLC. All rights reserved.</p>
        </div>
      </div>
      <div className="space-y-1 text-center sm:text-left">
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          ComingHomeIQ is not a licensed real estate broker, inspector, attorney, or financial advisor.
        </p>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          <span className="font-semibold text-muted-foreground/80">Not a Consumer Reporting Agency.</span>{" "}
          Data may not be used for FCRA-regulated purposes (credit, insurance, employment, or tenant screening).
        </p>
      </div>
    </div>
  </footer>
);

export default LegalFooter;
