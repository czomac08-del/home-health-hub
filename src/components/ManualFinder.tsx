import { useState, useEffect } from "react";
import {
  FileText, Download, ExternalLink, Search, Loader2, AlertTriangle,
  CheckCircle2, BookOpen, Share2, X, Sparkles, ChevronLeft, ChevronRight,
  Bookmark, Upload, Clock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ──────────── Types ──────────── */
export interface ManualSearchResult {
  found: boolean;
  manualTitle?: string;
  manualUrl?: string;
  source?: string;
  fileSize?: string;
  publicationDate?: string;
  manufacturerSupportUrl?: string;
  manufacturerSupportEmail?: string;
}

export interface WarrantyInfo {
  warrantyLength?: string;
  coverageDetails?: string;
  registrationRequired?: boolean;
  registrationDeadline?: string;
  manufacturerClaimsContact?: string;
  extendedWarrantyAvailable?: boolean;
}

export interface RecallInfo {
  recallFound: boolean;
  recallDescription?: string;
  riskLevel?: string;
  remedy?: string;
  recallDate?: string;
  cpscUrl?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: "manual" | "warranty" | "service" | "permit" | "receipt" | "other";
  dateAdded: string;
  fileSize?: string;
  source: "AI Found" | "User Uploaded" | "Contractor Added";
  url?: string;
  systemName?: string;
  storagePath?: string;
}

/* ──────────── Manual Search Trigger ──────────── */
interface ManualSearchProps {
  brand: string;
  model: string;
  onResult: (result: ManualSearchResult) => void;
}

export function useManualSearch({ brand, model, onResult }: ManualSearchProps) {
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ManualSearchResult | null>(null);

  const search = async () => {
    if (!brand && !model) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("manual-finder", {
        body: { brand, model, action: "find_manual" },
      });
      if (error) throw error;
      const r = data.result as ManualSearchResult;
      setResult(r);
      onResult(r);
    } catch (err) {
      console.error("Manual search failed:", err);
      setResult({ found: false });
    } finally {
      setSearching(false);
    }
  };

  return { searching, result, search };
}

/* ──────────── Manual Search Indicator (inline) ──────────── */
export function ManualSearchIndicator({ searching }: { searching: boolean }) {
  if (!searching) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Searching for manual...</span>
    </div>
  );
}

/* ──────────── Manual Found Banner ──────────── */
export function ManualFoundBanner({ result, onView, onDownload }: {
  result: ManualSearchResult;
  onView: () => void;
  onDownload: () => void;
}) {
  if (!result) return null;

  if (result.found) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Manual Found</span>
        </div>
        <div className="space-y-1 mb-3">
          {result.manualTitle && <p className="text-sm text-foreground font-medium">{result.manualTitle}</p>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {result.source && <span>Source: {result.source}</span>}
            {result.fileSize && <span>{result.fileSize}</span>}
            {result.publicationDate && <span>{result.publicationDate}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {result.manualUrl && (
            <button onClick={onView} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground">
              <BookOpen className="h-3.5 w-3.5" /> View Manual
            </button>
          )}
          <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs font-semibold text-primary">
            <Download className="h-3.5 w-3.5" /> Save to Passport
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--health-amber))]/30 bg-[hsl(var(--health-amber))]/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-[hsl(var(--health-amber))]" />
        <span className="text-sm font-semibold text-[hsl(var(--health-amber))]">Manual Not Found</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">We couldn't find a manual online for this product.</p>
      <div className="flex flex-col gap-2">
        <button className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Upload className="h-3.5 w-3.5" /> Upload Manual
        </button>
        {result.manufacturerSupportUrl && (
          <a href={result.manufacturerSupportUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <ExternalLink className="h-3.5 w-3.5" /> Visit Manufacturer Support
          </a>
        )}
        <button className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Clock className="h-3.5 w-3.5" /> Check Back Later
        </button>
      </div>
    </div>
  );
}

/* ──────────── Warranty Status Badge ──────────── */
export function WarrantyStatusBadge({ warrantyExp }: { warrantyExp?: string }) {
  if (!warrantyExp) return null;

  const exp = new Date(warrantyExp);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let color = "bg-primary/10 text-primary border-primary/30";
  let label = `Active — expires ${exp.toLocaleDateString()}`;

  if (daysLeft < 0) {
    color = "bg-destructive/10 text-destructive border-destructive/30";
    label = `Expired ${exp.toLocaleDateString()}`;
  } else if (daysLeft <= 90) {
    color = "bg-[hsl(var(--health-amber))]/10 text-[hsl(var(--health-amber))] border-[hsl(var(--health-amber))]/30";
    label = `Expiring soon — ${daysLeft} days left`;
  }

  return (
    <div className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium", color)}>
      <Shield className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/* ──────────── Warranty Info Card ──────────── */
export function WarrantyInfoCard({ info }: { info: WarrantyInfo }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" /> Warranty Information
        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[8px] font-bold text-primary uppercase">
          <Sparkles className="h-2 w-2" /> AI
        </span>
      </h4>
      <div className="space-y-2 text-xs">
        {info.warrantyLength && (
          <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span className="text-foreground">{info.warrantyLength}</span></div>
        )}
        {info.coverageDetails && (
          <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span className="text-foreground text-right max-w-[60%]">{info.coverageDetails}</span></div>
        )}
        {info.registrationRequired !== undefined && (
          <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span className={info.registrationRequired ? "text-[hsl(var(--health-amber))]" : "text-muted-foreground"}>{info.registrationRequired ? "Required" : "Not required"}</span></div>
        )}
        {info.registrationDeadline && (
          <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="text-foreground">{info.registrationDeadline}</span></div>
        )}
        {info.manufacturerClaimsContact && (
          <div className="flex justify-between"><span className="text-muted-foreground">Claims</span><span className="text-primary">{info.manufacturerClaimsContact}</span></div>
        )}
      </div>
    </div>
  );
}

/* ──────────── Recall Alert Banner ──────────── */
export function RecallAlertBanner({ info }: { info: RecallInfo }) {
  if (!info.recallFound) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary/60">
        <CheckCircle2 className="h-3 w-3" />
        <span>No recalls found</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-bold text-destructive uppercase">Recall Alert</span>
        {info.riskLevel && (
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase",
            info.riskLevel === "high" ? "bg-destructive/20 text-destructive border-destructive/40" : "bg-[hsl(var(--health-amber))]/20 text-[hsl(var(--health-amber))] border-[hsl(var(--health-amber))]/40"
          )}>{info.riskLevel} risk</span>
        )}
      </div>
      {info.recallDescription && <p className="text-sm text-foreground mb-2">{info.recallDescription}</p>}
      {info.remedy && <p className="text-xs text-muted-foreground mb-2"><strong>Remedy:</strong> {info.remedy}</p>}
      {info.cpscUrl && (
        <a href={info.cpscUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
          <ExternalLink className="h-3 w-3" /> View Official Recall
        </a>
      )}
    </div>
  );
}

/* ──────────── Document Card (for vault) ──────────── */
const typeColors: Record<string, string> = {
  manual: "bg-primary/15 text-primary border-primary/30",
  warranty: "bg-[hsl(var(--health-green))]/15 text-[hsl(var(--health-green))] border-[hsl(var(--health-green))]/30",
  service: "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))] border-[hsl(var(--health-amber))]/30",
  permit: "bg-secondary text-muted-foreground border-border",
  receipt: "bg-secondary text-muted-foreground border-border",
  other: "bg-secondary text-muted-foreground border-border",
};

const typeLabels: Record<string, string> = {
  manual: "Owner Manual",
  warranty: "Warranty",
  service: "Service Record",
  permit: "Permit",
  receipt: "Receipt",
  other: "Document",
};

export function DocumentCard({ doc, onView }: { doc: DocumentItem; onView: () => void }) {
  return (
    <button onClick={onView} className="w-full rounded-xl border border-border bg-card p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-semibold", typeColors[doc.type] || typeColors.other)}>
            {typeLabels[doc.type] || "Document"}
          </span>
          <span className="text-[10px] text-muted-foreground">{doc.dateAdded}</span>
          {doc.fileSize && <span className="text-[10px] text-muted-foreground">{doc.fileSize}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn("text-[8px] px-1 py-0.5 rounded border font-medium",
          doc.source === "AI Found" ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"
        )}>{doc.source}</span>
      </div>
    </button>
  );
}

/* ──────────── System Document Vault ──────────── */
export function SystemDocumentVault({ documents, onUpload }: {
  documents: DocumentItem[];
  onUpload: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Manuals & Documents
        </h3>
        <button onClick={onUpload} className="text-xs text-primary font-medium flex items-center gap-1">
          <Upload className="h-3 w-3" /> Upload
        </button>
      </div>
      {documents.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No documents yet</p>
          <button onClick={onUpload} className="mt-2 text-xs text-primary font-medium">Add a document</button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onView={() => {
              if (doc.url) window.open(doc.url, "_blank");
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────── Manual Share Button ──────────── */
export function ManualShareButton({ docName }: { docName: string }) {
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    setSharing(true);
    // Generate a temporary share link (simulated — real implementation would create a signed URL)
    setTimeout(() => {
      const fakeUrl = `${window.location.origin}/shared-doc/${Date.now().toString(36)}`;
      setShareUrl(fakeUrl);
      setSharing(false);
      toast.success("Share link created — expires in 7 days");
    }, 800);
  };

  return (
    <div>
      <button onClick={handleShare} disabled={sharing}
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors disabled:opacity-50">
        {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
        Share Manual
      </button>
      {shareUrl && (
        <div className="mt-2 p-2 rounded-lg bg-secondary border border-border">
          <p className="text-[10px] text-muted-foreground mb-1">Link expires in 7 days. Only this manual is shared.</p>
          <div className="flex items-center gap-2">
            <input value={shareUrl} readOnly className="flex-1 text-[10px] bg-transparent text-foreground border-none focus:outline-none" />
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied!"); }}
              className="text-[9px] text-primary font-medium">Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}
