import { ExternalLink, Building2, Landmark, Zap, Scale } from "lucide-react";
import type { Resource } from "@/data/droughtResources";

const BADGE_STYLES: Record<Resource["badge"], { cls: string; icon: typeof Building2 }> = {
  "Federal Program": { cls: "bg-primary/15 text-primary border-primary/30", icon: Landmark },
  "State Program": { cls: "bg-accent/15 text-accent-foreground border-border", icon: Building2 },
  "Utility Program": { cls: "bg-secondary text-foreground border-border", icon: Zap },
  "Legal Right": { cls: "bg-muted text-foreground border-border", icon: Scale },
};

const COST_STYLES: Record<Resource["cost"], string> = {
  "$0": "bg-primary/10 text-primary",
  "Low-cost": "bg-secondary text-muted-foreground",
  "Rebate / Tax Credit": "bg-secondary text-muted-foreground",
  "Loan": "bg-secondary text-muted-foreground",
  "Grant": "bg-primary/10 text-primary",
};

interface Props {
  resource: Resource;
}

const ResourceCard = ({ resource }: Props) => {
  const badge = BADGE_STYLES[resource.badge];
  const Icon = badge.icon;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-heading font-bold text-base leading-snug text-foreground">
          {resource.title}
        </h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
        >
          <Icon className="h-3 w-3" />
          {resource.badge}
        </span>
      </header>

      <p className="text-sm text-muted-foreground leading-relaxed">{resource.what}</p>

      <div className="flex flex-wrap gap-2 mt-1">
        {resource.qualifies.map((q) => (
          <span key={q} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {q}
          </span>
        ))}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${COST_STYLES[resource.cost]}`}>
          {resource.cost}
        </span>
      </div>

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Apply or learn more
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
};

export default ResourceCard;
