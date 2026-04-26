import { useState } from "react";
import { Printer, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PrintFilter } from "./PrintFindingsReport";

interface Props {
  filter: PrintFilter;
  onFilterChange: (f: PrintFilter) => void;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost" | "secondary";
  className?: string;
}

/**
 * "Print / Save PDF" trigger with a filter dropdown. Calls window.print() —
 * the print stylesheet (in index.css) hides everything except #print-findings-root.
 */
export default function PrintFindingsButton({
  filter,
  onFilterChange,
  size = "sm",
  variant = "outline",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    // Defer slightly so the DropdownMenu can close before print dialog opens.
    setTimeout(() => window.print(), 50);
  };

  const filterLabel =
    filter === "diy" ? "DIY only" : filter === "major" ? "Major only" : "All findings";

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <Button size={size} variant={variant} className="h-8" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
        <span>Print / Save PDF</span>
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant={variant} className="h-8 px-2" aria-label="Print filter">
            <span className="text-[11px] hidden sm:inline">{filterLabel}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Print which findings?</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={filter}
            onValueChange={(v) => onFilterChange(v as PrintFilter)}
          >
            <DropdownMenuRadioItem value="all">Print All Findings</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="diy">Print DIY Items Only</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="major">
              Print Major Repairs (Level 1 + 2)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}