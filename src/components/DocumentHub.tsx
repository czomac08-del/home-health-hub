import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Image as ImageIcon, FileType2, Upload, ChevronRight } from "lucide-react";
import { usePropertyDocuments, CATEGORY_LABEL, type UnifiedDocument } from "@/hooks/usePropertyDocuments";
import UploadDocumentModal from "./UploadDocumentModal";

interface Props {
  propertyId: string | undefined;
  /** When set, only show this many docs (dashboard view). */
  limit?: number;
  /** When true, render compact dashboard variant. */
  compact?: boolean;
}

const fileIcon = (t: UnifiedDocument["fileType"]) => {
  if (t === "image") return ImageIcon;
  if (t === "pdf") return FileText;
  return FileType2;
};

function reviewRoute(doc: UnifiedDocument): string {
  if (doc.category === "inspection" && doc.source_table === "property_records") {
    return `/inspection-review/${doc.id}/viewer`;
  }
  if (doc.category === "insurance") return "/insurance";
  if (doc.category === "warranty" || doc.category === "manual") return "/warranties";
  if (doc.category === "permit") return "/property";
  return "/documents";
}

export default function DocumentHub({ propertyId, limit, compact }: Props) {
  const navigate = useNavigate();
  const { docs, loading } = usePropertyDocuments(propertyId);
  const [uploadOpen, setUploadOpen] = useState(false);

  const visible = useMemo(() => (limit ? docs.slice(0, limit) : docs), [docs, limit]);

  if (loading && docs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-14 bg-muted rounded-lg" />
          <div className="h-14 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "" : ""}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-heading font-bold text-foreground">My Documents</h3>
          {docs.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {docs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">No documents yet</p>
          <p className="text-xs text-muted-foreground mb-3">
            Upload your inspection report, warranties, or receipts to get started.
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Upload className="h-3.5 w-3.5" /> Upload a Document
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((doc) => {
            const Icon = fileIcon(doc.fileType);
            return (
              <div
                key={`${doc.source_table}-${doc.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {CATEGORY_LABEL[doc.category]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                  {doc.url && (
                    <button
                      onClick={() => window.open(doc.url!, "_blank")}
                      className="text-[11px] font-medium text-foreground bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-md"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => navigate(reviewRoute(doc))}
                    className="text-[11px] font-medium text-primary-foreground bg-primary hover:opacity-90 px-2.5 py-1 rounded-md"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}

          {limit && docs.length > limit && (
            <button
              onClick={() => navigate("/documents")}
              className="w-full flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
            >
              View All Documents <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <UploadDocumentModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}