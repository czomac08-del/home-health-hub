import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, AlertTriangle, BookOpen, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";
import type { DocumentItem } from "@/components/ManualFinder";
import { DocumentCard } from "@/components/ManualFinder";

const DOC_TABS = ["All", "Manuals", "Warranties", "Service", "Permits", "Receipts"] as const;
type DocTab = typeof DOC_TABS[number];
const tabToType: Record<DocTab, string | null> = {
  All: null, Manuals: "manual", Warranties: "warranty", Service: "service", Permits: "permit", Receipts: "receipt",
};

// Sample data — in production this comes from DB
const sampleDocs: DocumentItem[] = [
  { id: "1", name: "HVAC Owner's Manual — Carrier 24ACC636", type: "manual", dateAdded: "2024-03-15", fileSize: "4.2 MB", source: "AI Found", systemName: "HVAC" },
  { id: "2", name: "Water Heater Warranty", type: "warranty", dateAdded: "2024-01-20", fileSize: "1.1 MB", source: "User Uploaded", systemName: "Water Heater" },
  { id: "3", name: "Electrical Inspection Report", type: "service", dateAdded: "2023-11-22", fileSize: "2.8 MB", source: "Contractor Added", systemName: "Electrical" },
  { id: "4", name: "Roof Replacement Receipt", type: "receipt", dateAdded: "2022-06-03", fileSize: "0.5 MB", source: "User Uploaded", systemName: "Roof" },
];

const missingSystems = [
  { name: "Plumbing", hasManual: false },
  { name: "Roof", hasManual: false },
  { name: "Septic / Sewer", hasManual: false },
];

const DocumentVaultScreen = () => {
  const [activeTab, setActiveTab] = useState<DocTab>("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let docs = sampleDocs;
    const typeFilter = tabToType[activeTab];
    if (typeFilter) docs = docs.filter(d => d.type === typeFilter);
    if (search) docs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.systemName?.toLowerCase().includes(search.toLowerCase()));
    return docs;
  }, [activeTab, search]);

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Document Vault</h1>
          <p className="text-xs text-muted-foreground">{sampleDocs.length} documents across all systems</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {DOC_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-secondary text-muted-foreground border border-border hover:border-primary/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {filtered.map(doc => (
            <div key={doc.id} className="relative">
              <DocumentCard doc={doc} onView={() => { if (doc.url) window.open(doc.url, "_blank"); }} />
              {doc.systemName && (
                <span className="absolute top-2 right-2 text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{doc.systemName}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missing documents */}
      {activeTab === "All" && missingSystems.length > 0 && (
        <div className="rounded-xl border border-[hsl(var(--health-amber))]/30 bg-[hsl(var(--health-amber))]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--health-amber))]" />
            <h3 className="text-sm font-semibold text-[hsl(var(--health-amber))]">Missing Documents</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">These systems have no manual on file yet.</p>
          <div className="space-y-2">
            {missingSystems.map(sys => (
              <div key={sys.name} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm text-foreground">{sys.name}</span>
                <button className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Sparkles className="h-3 w-3" /> Find Manual
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVaultScreen;
