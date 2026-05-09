import { useState } from "react";
import { Upload } from "lucide-react";
import ProUploadModal from "./ProUploadModal";
import type { ProRole } from "@/lib/proDocumentSchemas";

interface Props {
  role: ProRole;
  /** Optional default doc-type id (e.g. "contractor.estimate"). */
  defaultDocType?: string;
  /** Optional label override (default: "Upload Document"). */
  label?: string;
  /** Render as a compact inline button instead of full-width. */
  compact?: boolean;
  className?: string;
}

export default function ProUploadButton({ role, defaultDocType, label, compact, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          (compact
            ? "inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors"
            : "w-full rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 flex items-center gap-2 transition-colors")
        }
      >
        <Upload className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className={compact ? "" : "text-xs font-semibold text-foreground flex-1 text-left"}>
          {label || "Upload Document"}
        </span>
      </button>
      <ProUploadModal open={open} onOpenChange={setOpen} role={role} defaultDocType={defaultDocType} />
    </>
  );
}