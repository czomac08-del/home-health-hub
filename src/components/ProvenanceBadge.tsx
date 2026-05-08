import { Landmark, FileText, User, Bot, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ArchiveSourceTag } from "@/lib/archiveProvenance";

interface Props {
  tag: ArchiveSourceTag;
  className?: string;
}

const META: Record<ArchiveSourceTag, { label: string; cls: string; Icon: typeof Landmark; tip: string }> = {
  GOVERNMENT_API: {
    label: "Verified",
    cls: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    Icon: Landmark,
    tip: "Pulled from a live government data source. Confirmed for this property.",
  },
  DOCUMENT_EXTRACTED: {
    label: "From Document",
    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Icon: FileText,
    tip: "Extracted from a document the user uploaded.",
  },
  OWNER_PROVIDED: {
    label: "Owner Provided",
    cls: "bg-primary/15 text-primary border-primary/30",
    Icon: User,
    tip: "Submitted by the property owner. Not independently verified.",
  },
  AI_INFERRED: {
    label: "AI Estimate",
    cls: "bg-muted text-muted-foreground border-border",
    Icon: Bot,
    tip: "AI estimate based on regional patterns. Not a confirmed record for this property.",
  },
  PROFESSIONAL_SUBMITTED: {
    label: "Professional",
    cls: "bg-secondary/30 text-navy-light border-secondary/40",
    Icon: HardHat,
    tip: "Submitted by a verified professional (Inspector, Contractor, Realtor, or Investor).",
  },
};

const ProvenanceBadge = ({ tag, className }: Props) => {
  const m = META[tag];
  const Icon = m.Icon;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold cursor-default",
              m.cls,
              className,
            )}
          >
            <Icon className="h-3 w-3" />
            {m.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">{m.tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProvenanceBadge;