import { Search } from "lucide-react";

interface HonestNotFoundProps {
  recordType: string;
  sourcesSearched: string[];
  whyMissing: string;
  whatItMeans: string;
  nextSteps: string[];
  editorialNote?: string;
}

const HonestNotFound = ({
  recordType,
  sourcesSearched,
  whyMissing,
  whatItMeans,
  nextSteps,
  editorialNote,
}: HonestNotFoundProps) => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
    <div className="flex items-start gap-3">
      <Search className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm font-semibold text-foreground">
        We searched for <span className="text-primary">{recordType}</span> for your property.
      </p>
    </div>

    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">What we searched</p>
      <ul className="space-y-1">
        {sourcesSearched.map((s, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
            {s}
          </li>
        ))}
      </ul>
    </div>

    <div className="rounded-lg bg-secondary/30 p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why this might be</p>
      <p className="text-xs text-foreground/80">{whyMissing}</p>
    </div>

    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">What this means for you</p>
      <p className="text-xs text-foreground/80">{whatItMeans}</p>
    </div>

    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">What you can do next</p>
      <ol className="space-y-1.5">
        {nextSteps.map((step, i) => (
          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </div>

    {editorialNote && (
      <div className="rounded-lg border-l-3 border-primary bg-primary/5 p-3 mt-2">
        <p className="text-[10px] font-semibold text-primary mb-1">🏠 ComingHomeIQ Note</p>
        <p className="text-xs text-foreground/80">{editorialNote}</p>
      </div>
    )}
  </div>
);

export default HonestNotFound;
