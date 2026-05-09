import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, ArrowLeft, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import RefreshButton from "@/components/RefreshButton";
import WarrantyAIChat from "@/components/WarrantyAIChat";
import WarrantyReviewModal from "@/components/WarrantyReviewModal";

interface WarrantyRow {
  id: string;
  warranty_type: string;
  provider_name: string | null;
  coverage_start: string | null;
  coverage_end: string | null;
  system_detail_id: string | null;
  is_transferable: boolean | null;
  document_path: string | null;
  source_record_id?: string | null;
}

interface SystemRow {
  id: string;
  system_name: string;
  brand: string | null;
}

function getStatus(endDate: string | null) {
  // No expiry on file → assume Active. Most warranties without an extracted end
  // date are still in coverage; we mark Expired only when we know it has passed.
  if (!endDate) return { label: "Active", color: "text-emerald-500", days: -1 };
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return { label: "Expired", color: "text-destructive", days: diff };
  if (diff <= 90) return { label: "Expiring Soon", color: "text-[hsl(var(--health-amber))]", days: diff };
  return { label: "Active", color: "text-emerald-500", days: diff };
}

type FilterType = "all" | "appliances" | "systems" | "expiring" | "expired";

const WarrantyDashboard = () => {
  const navigate = useNavigate();
  const { user, activeProperty } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyRow[]>([]);
  const [systems, setSystems] = useState<Record<string, SystemRow>>({});
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<WarrantyRow | null>(null);
  const [detailDoc, setDetailDoc] = useState<{ fileName?: string | null; storagePath?: string | null; bucket?: string | null; url?: string | null } | null>(null);

  useEffect(() => {
    if (!user || !activeProperty) return;
    (async () => {
      const [{ data: wData }, { data: sData }] = await Promise.all([
        supabase.from("warranties").select("*").eq("user_id", user.id).eq("property_id", activeProperty.id),
        supabase.from("system_details").select("id, system_name, brand").eq("user_id", user.id).eq("property_id", activeProperty.id),
      ]);
      setWarranties((wData as WarrantyRow[]) || []);
      // Deduplicate: one row per source_record_id, then per document_path
      const seen = new Set<string>();
      const deduped = ((wData as WarrantyRow[]) || []).filter((w) => {
        const key = w.source_record_id || w.document_path || w.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setWarranties(deduped);
      const map: Record<string, SystemRow> = {};
      (sData || []).forEach((s: SystemRow) => { map[s.id] = s; });
      setSystems(map);
      setLoading(false);
    })();
  }, [user, activeProperty]);

  const coreNames = ["hvac", "plumbing", "electrical", "roof", "water heater", "septic", "sewer"];
  const filtered = warranties.filter(w => {
    const s = getStatus(w.coverage_end);
    const sysName = w.system_detail_id ? systems[w.system_detail_id]?.system_name?.toLowerCase() || "" : "";
    if (filter === "expiring") return s.label === "Expiring Soon";
    if (filter === "expired") return s.label === "Expired";
    if (filter === "systems") return coreNames.some(n => sysName.includes(n));
    if (filter === "appliances") return !coreNames.some(n => sysName.includes(n));
    return true;
  });

  const active = warranties.filter(w => getStatus(w.coverage_end).label === "Active");
  const expiring = warranties.filter(w => getStatus(w.coverage_end).label === "Expiring Soon");
  const expired = warranties.filter(w => getStatus(w.coverage_end).label === "Expired");

  // Build a portfolio-level warranty context for the AI assistant.
  const warrantyContext = warranties.map(w => {
    const sys = w.system_detail_id ? systems[w.system_detail_id] : null;
    const status = getStatus(w.coverage_end).label;
    const parts = [
      sys?.system_name ? `${sys.system_name}${sys.brand ? ` (${sys.brand})` : ""}` : (w.provider_name || "Warranty"),
      `type: ${w.warranty_type.replace(/_/g, " ")}`,
      w.provider_name ? `provider: ${w.provider_name}` : null,
      w.coverage_start ? `start: ${w.coverage_start}` : null,
      w.coverage_end ? `end: ${w.coverage_end}` : "end: unknown",
      `status: ${status}`,
    ].filter(Boolean);
    return `- ${parts.join(", ")}`;
  }).join("\n");

  const propertyAddress = activeProperty?.address || "your property";
  const portfolioSystemContext = `Property: ${propertyAddress}\nTotals — Active: ${active.length}, Expiring soon: ${expiring.length}, Expired: ${expired.length}, Total warranties: ${warranties.length}`;

  const portfolioChips = [
    "What warranties are about to expire?",
    "Which of my systems have no warranty?",
    "How do I file a warranty claim?",
    "Can I transfer warranties when I sell?",
    "What typically voids a home warranty?",
  ];

  const openWarrantyDetail = (w: WarrantyRow) => {
    const sys = w.system_detail_id ? systems[w.system_detail_id] : null;
    setDetailRow({ ...w, system_name: sys?.system_name || null } as any);
    setDetailDoc({
      fileName: w.document_path?.split("/").pop() || w.provider_name || "Warranty",
      storagePath: w.document_path,
      bucket: "property-records",
      url: null,
    });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "systems", label: "Systems" },
    { key: "appliances", label: "Appliances" },
    { key: "expiring", label: "Expiring Soon" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" /> My Warranties
      </h1>
      <p className="text-sm text-muted-foreground mb-4">All warranties across your home in one place.</p>
      <RefreshButton scope="warranties" variant="compact" className="mb-6" />

      {/* AI Assistant — collapsed by default */}
      <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setAiOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Ask AI about your warranties ✨
          </span>
          {aiOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {aiOpen && (
          <div className="border-t border-border p-3">
            <WarrantyAIChat
              warrantyContext={warrantyContext}
              systemContext={portfolioSystemContext}
              systemInfo={null}
              chips={portfolioChips}
              openingMessage={
                warranties.length > 0
                  ? `I have ${warranties.length} warrantie${warranties.length === 1 ? "" : "s"} on file for ${propertyAddress}. ${active.length} active, ${expiring.length} expiring soon, ${expired.length} expired. What would you like to know?`
                  : `I don't see any warranties on file yet for ${propertyAddress}. Add warranties from your system detail screens or upload them in the Document Vault. I can still answer general warranty questions.`
              }
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-500">{active.length}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="rounded-xl bg-[hsl(var(--health-amber))]/10 p-3 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--health-amber))]">{expiring.length}</p>
          <p className="text-[10px] text-muted-foreground">Expiring</p>
        </div>
        <div className="rounded-xl bg-destructive/10 p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{expired.length}</p>
          <p className="text-[10px] text-muted-foreground">Expired</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No warranties found. Add warranties from your system detail screens.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => {
            const s = getStatus(w.coverage_end);
            const sys = w.system_detail_id ? systems[w.system_detail_id] : null;
            return (
              <button
                key={w.id}
                onClick={() => openWarrantyDetail(w)}
                className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {s.label === "Active" && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                    {s.label === "Expiring Soon" && <ShieldAlert className="h-4 w-4 text-[hsl(var(--health-amber))]" />}
                    {s.label === "Expired" && <ShieldX className="h-4 w-4 text-destructive" />}
                    <span className="text-sm font-semibold text-foreground">
                      {sys?.system_name ||
                        w.provider_name ||
                        (w.document_path ? w.document_path.split("/").pop()?.replace(/\.[^.]+$/, "") : null) ||
                        "Warranty"}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {w.warranty_type.replace("_", " ")}{w.provider_name ? ` · ${w.provider_name}` : ""}
                </p>
                {s.days > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span><Clock className="h-3 w-3 inline mr-1" />{s.days} days left</span>
                      <span>{w.coverage_end}</span>
                    </div>
                    <Progress value={Math.min(100, (s.days / 365) * 100)} className="h-1" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Expiration alerts */}
      {expiring.length > 0 && (
        <div className="mt-6 rounded-xl border-l-4 border-[hsl(var(--health-amber))] bg-[hsl(var(--health-amber))]/10 p-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--health-amber))] mb-1">⏰ Expiration Alerts</h3>
          {expiring.map(w => {
            const sys = w.system_detail_id ? systems[w.system_detail_id] : null;
            const days = getStatus(w.coverage_end).days;
            return (
              <p key={w.id} className="text-xs text-foreground mt-1">
                Your {sys?.brand || ""} {sys?.system_name || "item"} warranty expires in <span className="font-bold">{days} days</span>. Test all functions and report issues before coverage ends.
              </p>
            );
          })}
        </div>
      )}

      {/* Extended marketplace CTA */}
      {expired.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">🛡️ Protect Your Home</h3>
          <p className="text-xs text-muted-foreground mb-3">
            You have {expired.length} expired {expired.length === 1 ? "warranty" : "warranties"}. Consider extended coverage.
          </p>
          <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold">
            View Extended Warranty Options
          </button>
        </div>
      )}

      <WarrantyReviewModal
        open={!!detailRow}
        onOpenChange={(v) => { if (!v) { setDetailRow(null); setDetailDoc(null); } }}
        recordId={null}
        directDoc={detailDoc}
        warrantyRow={detailRow as any}
      />
    </div>
  );
};

export default WarrantyDashboard;
