import { Shield } from "lucide-react";

const DataPermanenceBanner = () => (
  <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground leading-relaxed">
      Your home's records belong to your home, not just your account. Everything you document here stays with the property permanently — even if you sell, move, or take a break from the app.
    </p>
  </div>
);

export default DataPermanenceBanner;
