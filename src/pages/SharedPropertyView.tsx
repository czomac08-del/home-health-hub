import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Home, FileText, Shield, AlertTriangle, Loader2, ExternalLink,
  Download, Eye, Info, ClipboardList, Wrench, ScrollText, FileCheck,
} from "lucide-react";

interface ShareStatus {
  status: "active" | "expired" | "revoked" | "invalid";
  share_id: string | null;
  property_id: string | null;
  owner_first_name: string | null;
  owner_full_name: string | null;
  property_address: string | null;
  property_year_built: string | null;
  property_health_score: number | null;
  expires_at: string | null;
  message: string | null;
}

interface DocItem {
  id: string;
  category: string;
  title: string;
  date: string | null;
  signedUrl: string | null;
  fileName: string | null;
}

interface SystemRow {
  system_name: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  last_service: string | null;
  health_score: number | null;
}

const CATEGORIES = [
  { key: "Inspection Reports", icon: ClipboardList },
  { key: "Warranties", icon: Shield },
  { key: "Permits", icon: ScrollText },
  { key: "Disclosures", icon: FileCheck },
  { key: "System Records", icon: Wrench },
];

const SharedPropertyView = () => {
  const { token } = useParams();
  const [status, setStatus] = useState<ShareStatus | null>(null);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: statusRows } = await supabase.rpc("get_share_status", { _token: token } as any);
        const s = (statusRows as any[])?.[0];
        if (!s || s.status === "invalid") {
          setStatus({ status: "invalid" } as ShareStatus);
          setLoading(false);
          return;
        }
        setStatus(s as ShareStatus);

        if (s.status === "active") {
          const { data: docData } = await supabase.functions.invoke("share-documents", {
            body: { token },
          });
          if (docData) {
            setDocuments(docData.documents || []);
            setSystems(docData.systems || []);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status || status.status === "invalid") {
    return <ErrorState title="Share unavailable" message="This link is invalid or no longer exists." />;
  }
  if (status.status === "revoked") {
    return <ErrorState title="Link removed" message="This link has been removed by the owner." />;
  }
  if (status.status === "expired") {
    return (
      <ErrorState
        title="Link expired"
        message={`This link has expired. Contact ${status.owner_first_name || "the homeowner"} for an updated link.`}
      />
    );
  }

  const docsByCategory: Record<string, DocItem[]> = {};
  for (const cat of CATEGORIES) docsByCategory[cat.key] = [];
  for (const d of documents) {
    if (!docsByCategory[d.category]) docsByCategory[d.category] = [];
    docsByCategory[d.category].push(d);
  }

  const totalDocs = documents.length;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Soft conversion banner — single, subtle, top of page */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 py-2.5 text-[11px] text-muted-foreground flex items-center justify-between gap-3">
          <span>
            You're viewing a ComingHomeIQ property record. Realtors use ComingHomeIQ to manage disclosures and request documents from any homeowner.
          </span>
          <a
            href="https://cominghomeiq.com/realtor"
            target="_blank"
            rel="noreferrer"
            className="text-primary font-semibold whitespace-nowrap hover:underline"
          >
            Learn more
          </a>
        </div>
      </div>

      {/* Brand header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold">
            Coming Home<span className="text-primary">IQ</span>
          </span>
          {status.expires_at && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              Expires {new Date(status.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Hero card */}
        <div className="rounded-2xl border border-primary/30 bg-card p-5 mb-6">
          <div className="flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase rounded-full px-3 py-1 w-fit mb-3">
            <Shield className="h-3 w-3" /> ComingHomeIQ Verified
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Shared by {status.owner_first_name || "Homeowner"}
          </p>
          <h1 className="text-xl font-bold text-foreground mb-1">
            {status.property_address || "Property"}
          </h1>
          {status.property_year_built && (
            <p className="text-xs text-muted-foreground">Built {status.property_year_built}</p>
          )}
          {status.message && (
            <p className="text-xs text-muted-foreground italic mt-3 border-t border-border pt-3">
              "{status.message}"
            </p>
          )}

          {/* Home IQ score with explanation */}
          {status.property_health_score != null && (
            <div className="mt-4 rounded-xl bg-secondary/40 p-4 flex items-center gap-4">
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-full border-4 border-primary bg-background">
                <span className="text-xl font-bold text-foreground leading-none">
                  {status.property_health_score}
                </span>
                <span className="text-[8px] text-muted-foreground">/ 100</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Home IQ Score</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  A 0–100 measure of how well-documented and maintained this home is — based on inspection
                  history, system records, warranties, and verified data.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>{totalDocs} document{totalDocs === 1 ? "" : "s"} included</span>
            {systems.length > 0 && (
              <>
                <span>·</span>
                <Wrench className="h-3.5 w-3.5" />
                <span>{systems.length} system{systems.length === 1 ? "" : "s"} on record</span>
              </>
            )}
          </div>
        </div>

        {/* Document categories */}
        {CATEGORIES.map(({ key, icon: Icon }) => {
          const items = docsByCategory[key] || [];
          if (items.length === 0) return null;
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-4 mb-4">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" /> {key} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((d) => (
                  <DocRow key={d.id} doc={d} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Systems summary */}
        {systems.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-primary" /> Systems ({systems.length})
            </h2>
            <div className="space-y-1">
              {systems.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                  <span className="text-foreground truncate">
                    {s.system_name}
                    {s.brand ? ` · ${s.brand}` : ""}
                  </span>
                  <span className="text-muted-foreground shrink-0 ml-2">
                    {s.health_score != null ? `${s.health_score}%` : ""}
                    {s.last_service || s.install_date ? ` · ${new Date(s.last_service || s.install_date!).toLocaleDateString()}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalDocs === 0 && systems.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No documents have been added to this share yet.
          </div>
        )}

        {/* Soft informational link — not a CTA */}
        <div className="mt-8 text-center">
          <a
            href="https://cominghomeiq.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Info className="h-3 w-3" /> What is ComingHomeIQ?
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>
    </div>
  );
};

const DocRow = ({ doc }: { doc: DocItem }) => {
  const handleDownload = () => {
    if (!doc.signedUrl) return;
    const a = document.createElement("a");
    a.href = doc.signedUrl;
    a.download = doc.fileName || "";
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
        {doc.date && (
          <p className="text-[10px] text-muted-foreground">
            {new Date(doc.date).toLocaleDateString()}
          </p>
        )}
      </div>
      {doc.signedUrl ? (
        <>
          <a
            href={doc.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold text-foreground hover:border-primary/50"
          >
            <Eye className="h-3 w-3" /> View
          </a>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-3 w-3" /> Download
          </button>
        </>
      ) : (
        <span className="text-[10px] text-muted-foreground">No file attached</span>
      )}
    </div>
  );
};

const ErrorState = ({ title, message }: { title: string; message: string }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-background">
    <div className="text-center max-w-md">
      <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <a
        href="https://cominghomeiq.com"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-primary font-semibold inline-flex items-center gap-1"
      >
        What is ComingHomeIQ? <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
);

export default SharedPropertyView;