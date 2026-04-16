import { FileText, ExternalLink } from "lucide-react";

interface DisclosureFlagProps {
  state: string;
  triggerCategory: string;
  userEnteredData: string;
  requirementText: string;
  legalCitation?: string;
  onFindAttorney?: () => void;
  onDismiss?: () => void;
}

const DisclosureFlag = ({ state, triggerCategory, userEnteredData, requirementText, legalCitation, onFindAttorney, onDismiss }: DisclosureFlagProps) => (
  <div className="rounded-xl border border-[#1B3A8C]/30 bg-[#1B3A8C]/5 p-4 space-y-3">
    <div className="flex items-start gap-3">
      <FileText className="h-5 w-5 text-[#4A7ADB] shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-foreground">📋 Worth Knowing — {state} Disclosure Requirement</p>
        <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">
          You've noted <span className="font-medium">{userEnteredData}</span>. {legalCitation && <>Under <span className="font-medium">{legalCitation}</span>, </>}sellers in {state} are required to {requirementText.toLowerCase()} to buyers before sale.
        </p>
      </div>
    </div>

    <p className="text-xs text-muted-foreground leading-relaxed">
      This applies when you sell your home. It does not require any action from you right now. ComingHomeIQ has logged this in your disclosure awareness record so you won't forget it when the time comes.
    </p>

    <div className="flex flex-wrap gap-2 pt-1">
      {onFindAttorney && (
        <button onClick={onFindAttorney} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A8C]/10 px-3 py-2 text-xs font-medium text-[#4A7ADB] hover:bg-[#1B3A8C]/20 transition-colors">
          Find a Real Estate Attorney <ExternalLink className="h-3 w-3" />
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
          Dismiss
        </button>
      )}
    </div>

    <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
      This is informational only, not legal advice. A real estate attorney in your state can explain your specific obligations.
    </p>
  </div>
);

export default DisclosureFlag;
