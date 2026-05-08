import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  FileText,
  Image as ImageIcon,
  FileType2,
  ArrowLeft,
  Upload,
  ChevronRight,
  Sparkles,
  Trash2,
  Wand2,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePropertyDocuments,
  CATEGORY_LABEL,
  type UnifiedDocument,
  type DocCategory,
} from "@/hooks/usePropertyDocuments";
import UploadDocumentModal from "@/components/UploadDocumentModal";
import AddToProfileModal from "@/components/AddToProfileModal";
import WarrantyReviewModal from "@/components/WarrantyReviewModal";

const FILTERS: { value: "all" | DocCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inspection", label: "Inspections" },
  { value: "warranty", label: "Warranties" },
  { value: "receipt", label: "Receipts" },
  { value: "permit", label: "Permits" },
  { value: "insurance", label: "Insurance" },
  { value: "manual", label: "Manuals" },
  { value: "other", label: "Other" },
];

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

const DocumentVaultScreen = () => {
  const navigate = useNavigate();
  const { activeProperty, user } = useAuth();
  const [searchParams] = useSearchParams();
  const { docs, loading, reload } = usePropertyDocuments(activeProperty?.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | DocCategory>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "type">("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importDocId, setImportDocId] = useState<string | null>(null);
  const [warrantyReviewDocId, setWarrantyReviewDocId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UnifiedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Locally-hidden ids — let us remove the card immediately on success without
  // waiting for the next reload.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  // Documents shown in this screen always belong to the active property, which
  // useAuth already scopes to the logged-in user. Treat all as owned.
  const canDelete = !!user;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      // Remove the storage object first when we know the path.
      if (pendingDelete.storagePath && pendingDelete.bucket) {
        const { error: storageErr } = await supabase
          .storage
          .from(pendingDelete.bucket)
          .remove([pendingDelete.storagePath]);
        // Storage errors are non-fatal — the row delete is the source of truth.
        if (storageErr) console.warn("Storage remove failed:", storageErr);
      }
      const { error: rowErr } = await supabase
        .from(pendingDelete.source_table as any)
        .delete()
        .eq("id", pendingDelete.id);
      if (rowErr) throw rowErr;

      const cardKey = `${pendingDelete.source_table}-${pendingDelete.id}`;
      setHiddenIds((s) => {
        const next = new Set(s);
        next.add(cardKey);
        return next;
      });
      toast.success("Document deleted");
      setPendingDelete(null);
      // Background refresh so counts/categories stay in sync.
      void reload();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete document. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Auto-open import modal from notification deep link
  useEffect(() => {
    const id = searchParams.get("import");
    if (id) setImportDocId(id);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = docs.filter((d) => !hiddenIds.has(`${d.source_table}-${d.id}`));
    if (filter !== "all") list = list.filter((d) => d.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.inspectorName || "").toLowerCase().includes(q) ||
          CATEGORY_LABEL[d.category].toLowerCase().includes(q) ||
          new Date(d.uploadedAt).toLocaleDateString().toLowerCase().includes(q),
      );
    }
    if (sort === "oldest") {
      list = [...list].sort((a, b) => +new Date(a.uploadedAt) - +new Date(b.uploadedAt));
    } else if (sort === "type") {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [docs, filter, search, sort]);

  // Group by category for the unfiltered "all" view
  const grouped = useMemo(() => {
    const map: Record<DocCategory, UnifiedDocument[]> = {
      inspection: [],
      warranty: [],
      receipt: [],
      permit: [],
      insurance: [],
      manual: [],
      other: [],
    };
    filtered.forEach((d) => map[d.category].push(d));
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen pb-32 max-w-lg lg:max-w-5xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Documents</h1>
            <p className="text-xs text-muted-foreground">
              {docs.length} document{docs.length !== 1 ? "s" : ""}
              {activeProperty ? ` · ${activeProperty.address}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-[0_4px_14px_hsl(var(--orange)/0.35)]"
        >
          <Upload className="h-4 w-4" /> Upload a Document
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, inspector, date, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Filter chips + sort */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground border border-border hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="text-xs rounded-full border border-border bg-card px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Sort"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="type">By type</option>
        </select>
      </div>

      {loading && docs.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            {docs.length === 0 ? "No documents yet" : "No documents match your filters"}
          </p>
          {docs.length === 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                Upload your inspection report, warranties, or receipts to get started.
              </p>
              <button
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <Upload className="h-3.5 w-3.5" /> Upload a Document
              </button>
            </>
          )}
        </div>
      ) : filter === "all" && !search.trim() ? (
        <div className="space-y-6">
          {(Object.keys(grouped) as DocCategory[]).map((cat) =>
            grouped[cat].length > 0 ? (
              <section key={cat}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {CATEGORY_LABEL[cat]}s
                </h2>
                <div className="space-y-2">
                  {grouped[cat].map((doc) => (
                    <DocCard
                      key={`${doc.source_table}-${doc.id}`}
                      doc={doc}
                      onAddToProfile={(id) => setImportDocId(id)}
                      onReviewWarranty={(id) => setWarrantyReviewDocId(id)}
                      onDelete={canDelete ? (d) => setPendingDelete(d) : undefined}
                        onReanalyzed={reload}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocCard
              key={`${doc.source_table}-${doc.id}`}
              doc={doc}
              onAddToProfile={(id) => setImportDocId(id)}
              onReviewWarranty={(id) => setWarrantyReviewDocId(id)}
              onDelete={canDelete ? (d) => setPendingDelete(d) : undefined}
              onReanalyzed={reload}
            />
          ))}
        </div>
      )}

      <UploadDocumentModal
        open={uploadOpen}
        onOpenChange={(v) => {
          setUploadOpen(v);
          if (!v) reload();
        }}
      />
      {importDocId && (
        <AddToProfileModal
          open={!!importDocId}
          onOpenChange={(v) => {
            if (!v) {
              setImportDocId(null);
              // Refresh so the card flips to "Added to Profile" immediately.
              void reload();
            }
          }}
          recordId={importDocId}
        />
      )}
      <WarrantyReviewModal
        open={!!warrantyReviewDocId}
        onOpenChange={(v) => { if (!v) setWarrantyReviewDocId(null); }}
        recordId={warrantyReviewDocId}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => { if (!v && !deleting) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                "{pendingDelete?.title}"
              </span>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); void handleConfirmDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function DocCard({
  doc,
  onAddToProfile,
  onReviewWarranty,
  onDelete,
  onReanalyzed,
}: {
  doc: UnifiedDocument;
  onAddToProfile: (id: string) => void;
  onReviewWarranty?: (id: string) => void;
  onDelete?: (d: UnifiedDocument) => void;
  onReanalyzed?: () => void;
}) {
  const navigate = useNavigate();
  const Icon = fileIcon(doc.fileType);
  const alreadyAdded = !!doc.addedToProfile;
  const canImport =
    doc.source_table === "property_records" && doc.hasExtractedData && !alreadyAdded;
  const canReanalyze =
    doc.source_table === "property_records" &&
    !!doc.storagePath &&
    doc.extractionFailed === true;
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleReanalyze = async () => {
    if (!doc.storagePath) return;
    setReanalyzing(true);
    try {
      const { data: urlData, error: urlErr } = await supabase
        .storage
        .from(doc.bucket)
        .createSignedUrl(doc.storagePath, 60 * 30);
      if (urlErr || !urlData?.signedUrl) throw urlErr || new Error("Could not get file URL");

      const systemType = doc.systemType || (doc.recordType === "inspection_report" ? "inspection" : undefined);
      const { data: ext, error: extErr } = await supabase.functions.invoke("extract-document-data", {
        body: { documentUrl: urlData.signedUrl, systemType, source: "homeowner" },
      });
      if (extErr) throw extErr;

      const extracted = ext?.extracted || {};
      const inspectionReport = ext?.inspectionReport || null;
      const hasAnything =
        Object.keys(extracted).length > 0 ||
        (inspectionReport && Array.isArray(inspectionReport.findings) && inspectionReport.findings.length > 0);

      if (!hasAnything) {
        toast.error("AI analysis ran but couldn't extract details. Try the manual entry option below.");
        return;
      }

      const merged = inspectionReport ? { ...extracted, inspection_report: inspectionReport } : extracted;
      const { error: updErr } = await supabase
        .from("property_records")
        .update({ ai_extracted_data: merged, ai_verified: false })
        .eq("id", doc.id);
      if (updErr) throw updErr;

      toast.success("AI re-analysis complete");
      onReanalyzed?.();
    } catch (e) {
      console.error(e);
      toast.error("Re-analysis failed. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="relative rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors">
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${doc.title}`}
          onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
          className="absolute top-2 right-2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </span>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {CATEGORY_LABEL[doc.category]}
            </span>
            {doc.inspectorName && (
              <span className="text-[10px] text-muted-foreground truncate">· {doc.inspectorName}</span>
            )}
            {doc.findingsCount != null && doc.findingsCount > 0 && (
              <span className="text-[10px] font-medium text-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                {doc.findingsCount} finding{doc.findingsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2 ml-13 pl-0">
        {doc.url && (
          <button
            onClick={() => window.open(doc.url!, "_blank")}
            className="text-[11px] font-medium text-foreground bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-md"
          >
            View
          </button>
        )}
        <button
          onClick={() => {
            if (
              doc.category === "warranty" &&
              doc.source_table === "property_records" &&
              onReviewWarranty
            ) {
              onReviewWarranty(doc.id);
              return;
            }
            navigate(reviewRoute(doc));
          }}
          className="text-[11px] font-medium text-primary-foreground bg-primary hover:opacity-90 px-2.5 py-1 rounded-md"
        >
          Review {doc.category === "inspection" ? "Findings" : ""}
        </button>
        {canImport && (
          <button
            onClick={() => {
              // Warranty docs use the dedicated warranty review/sync modal
              // so the data lands in the `warranties` table, not just system_details.
              if (
                doc.category === "warranty" &&
                doc.source_table === "property_records" &&
                onReviewWarranty
              ) {
                onReviewWarranty(doc.id);
                return;
              }
              onAddToProfile(doc.id);
            }}
            className="text-[11px] font-medium text-primary border border-primary/40 hover:bg-primary/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" /> Add to Profile
          </button>
        )}
        {doc.source_table === "property_records" && doc.hasExtractedData && alreadyAdded && (
          <span
            aria-label="Already added to profile"
            className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md inline-flex items-center gap-1 cursor-default select-none"
          >
            <Check className="h-3 w-3" /> Added to Profile
          </span>
        )}
        {canReanalyze && (
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="text-[11px] font-medium text-primary border border-primary/40 hover:bg-primary/10 px-2.5 py-1 rounded-md inline-flex items-center gap-1 disabled:opacity-60"
          >
            {reanalyzing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Re-analyzing…
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3" /> Re-run AI Analysis
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentVaultScreen;