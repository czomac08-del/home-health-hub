import { useState } from "react";
import { Upload } from "lucide-react";
import UploadDocumentModal from "./UploadDocumentModal";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  defaultDocType?: string;
  defaultSystemType?: string;
}

/**
 * Floating action button — visible on every property page.
 * Hides when no active property is selected.
 */
export default function UploadDocumentFab({ defaultDocType, defaultSystemType }: Props) {
  const [open, setOpen] = useState(false);
  const { activeProperty } = useAuth();
  if (!activeProperty) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 lg:bottom-20 lg:right-8 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-heading font-extrabold text-sm shadow-[0_8px_24px_hsl(var(--orange)/0.45)] hover:-translate-y-[2px] transition-all flex items-center gap-2"
        aria-label="Upload a document"
      >
        <Upload className="h-5 w-5" />
        <span className="hidden sm:inline">Upload Document</span>
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
