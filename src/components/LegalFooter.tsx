import { Link } from "react-router-dom";

const LegalFooter = () => (
  <footer className="border-t border-border mt-8 py-4 px-6">
    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
        <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
        <span className="cursor-help" title="ComingHomeIQ is not a law firm, licensed inspector, or government agency. Information provided is for educational and record-keeping purposes only.">Legal Disclaimer</span>
      </div>
      <p className="text-[10px] text-muted-foreground/60">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
    </div>
  </footer>
);

export default LegalFooter;
