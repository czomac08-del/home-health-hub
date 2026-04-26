import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import UploadDocumentModal from "./UploadDocumentModal";

interface Props {
  title: string;
  description: string;
  defaultDocType?: string;
  defaultSystemType?: string;
  className?: string;
}

/**
 * Small contextual prompt card. Use on system pages, dashboard empty states, etc.
 */
export default function UploadPromptCard({
  title,
  description,
  defaultDocType,
  defaultSystemType,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-full text-left rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex items-start gap-3 ${className}`}
      >
        <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="text-primary text-xs font-semibold flex items-center gap-1 shrink-0 mt-1">
          <Upload className="h-3.5 w-3.5" />
          Upload
        </div>
      </button>
      <UploadDocumentModal
        open={open}
        onOpenChange={setOpen}
        defaultDocType={defaultDocType}
        defaultSystemType={defaultSystemType}
      />
    </>
  );
}
