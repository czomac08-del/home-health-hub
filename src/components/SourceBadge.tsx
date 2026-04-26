import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Building2, Sparkles, User, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataSource, FieldSource } from "@/lib/dataTrust";
import { SOURCE_LABEL } from "@/lib/dataTrust";

interface SourceBadgeProps {
  source: DataSource;
  fieldSource?: FieldSource | null;
  hasOpenDispute?: boolean;
  className?: string;
}

const STYLES: Record<DataSource, { icon: typeof ShieldCheck; cls: string }> = {
  inspector_verified: {
    icon: ShieldCheck,
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  county_record: {
    icon: Building2,
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  ai_extracted: {
    icon: Sparkles,
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  owner_submitted: {
    icon: User,
    cls: "bg-muted text-muted-foreground border-border",
  },
};

export function SourceBadge({ source, fieldSource, hasOpenDispute, className }: SourceBadgeProps) {
  const { icon: Icon, cls } = STYLES[source];
  const disputed = hasOpenDispute ?? fieldSource?.has_open_dispute ?? false;

  const tooltip =
    source === "inspector_verified" && fieldSource?.inspector_name
      ? `${SOURCE_LABEL[source]} — ${fieldSource.inspector_name}${
          fieldSource.inspector_company ? `, ${fieldSource.inspector_company}` : ""
        }${fieldSource.inspection_date ? ` • ${fieldSource.inspection_date}` : ""}`
      : SOURCE_LABEL[source];

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("inline-flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("gap-1 text-[10px] py-0 px-1.5 h-5", cls)}>
              <Icon className="h-3 w-3" />
              {SOURCE_LABEL[source]}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
        {disputed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1 text-[10px] py-0 px-1.5 h-5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
              >
                <Flag className="h-3 w-3" />
                Disputed
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              Owner has noted a concern about this finding — see dispute details.
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}