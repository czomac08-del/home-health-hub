import { Checkbox } from "@/components/ui/checkbox";
import { Globe } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CivicConsentCheckbox = ({ checked, onChange }: Props) => (
  <div className="flex items-start gap-3 rounded-lg bg-[hsl(var(--brain-blue))]/5 border border-[hsl(var(--brain-blue))]/20 p-3">
    <Checkbox
      id="civic-consent"
      checked={checked}
      onCheckedChange={(v) => onChange(!!v)}
      className="mt-0.5"
    />
    <label htmlFor="civic-consent" className="cursor-pointer">
      <div className="flex items-center gap-1.5 mb-1">
        <Globe className="h-3.5 w-3.5 text-[hsl(var(--brain-blue))]" />
        <span className="text-xs font-semibold text-foreground">Help modernize public records</span>
        <span className="text-[9px] bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-1.5 py-0.5 rounded-full font-medium">recommended</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Allow ComingHomeIQ to share this document and its extracted data with county and state agencies
        to help update public property records. Your name is never shared — only the document content
        and property address. You can withdraw consent at any time in Settings.
      </p>
    </label>
  </div>
);

export default CivicConsentCheckbox;
