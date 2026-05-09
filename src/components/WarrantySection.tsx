import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Upload, Phone, Globe, MessageSquare, ChevronDown, ChevronUp, FileText, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import WarrantyAIChat from "@/components/WarrantyAIChat";

interface Warranty {
  id: string;
  warranty_type: string;
  provider_name: string | null;
  coverage_start: string | null;
  coverage_end: string | null;
  claim_phone: string | null;
  claim_website: string | null;
  claim_notes: string | null;
  document_url: string | null;
  document_path: string | null;
  extended_doc_url: string | null;
  is_transferable: boolean | null;
  system_detail_id?: string | null;
}

interface SystemInfo {
  id: string;
  system_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  install_date: string | null;
}

const WARRANTY_TYPES = [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "extended", label: "Extended" },
  { value: "home_warranty", label: "Home Warranty" },
  { value: "retailer", label: "Retailer" },
];

function getWarrantyStatus(endDate: string | null): { label: string; color: string; icon: typeof ShieldCheck; daysLeft: number } {
  if (!endDate) return { label: "Unknown", color: "text-muted-foreground", icon: Shield, daysLeft: -1 };
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return { label: "Expired", color: "text-destructive", icon: ShieldX, daysLeft: diff };
  if (diff <= 90) return { label: "Expiring Soon", color: "text-[hsl(var(--health-amber))]", icon: ShieldAlert, daysLeft: diff };
  return { label: "Active", color: "text-emerald-500", icon: ShieldCheck, daysLeft: diff };
}

export default function WarrantySection({ systemDetailId, propertyId, systemInfo }: {
  systemDetailId: string;
  propertyId: string;
  systemInfo?: SystemInfo;
}) {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showClaimAssist, setShowClaimAssist] = useState<string | null>(null);
  const [_uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    warranty_type: "manufacturer",
    provider_name: "",
    coverage_start: "",
    coverage_end: "",
    claim_phone: "",
    claim_website: "",
    claim_notes: "",
    is_transferable: true,
  });

  useEffect(() => { loadWarranties(); }, [systemDetailId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWarranties = async () => {
    const { data } = await supabase
      .from("warranties")
      .select("*")
      .eq("property_id", propertyId)
      .or(`system_detail_id.eq.${systemDetailId},system_detail_id.is.null`);
    setWarranties((data as Warranty[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("warranties").insert({
      user_id: user.id,
      property_id: propertyId,
      system_detail_id: systemDetailId,
      ...form,
      coverage_start: form.coverage_start || null,
      coverage_end: form.coverage_end || null,
    });
    if (error) { toast.error("Failed to save warranty"); return; }
    toast.success("Warranty saved");
    setShowForm(false);
    setForm({ warranty_type: "manufacturer", provider_name: "", coverage_start: "", coverage_end: "", claim_phone: "", claim_website: "", claim_notes: "", is_transferable: true });
    loadWarranties();
  };

  const handleUploadDoc = async (warrantyId: string, file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${warrantyId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("warranty-documents").upload(path, file);
    if (uploadError) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: { signedUrl } } = await supabase.storage.from("warranty-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("warranties").update({ document_path: path, document_url: signedUrl }).eq("id", warrantyId);
    toast.success("Document uploaded");
    setUploading(false);
    loadWarranties();
  };

  const warrantyContext = warranties.map(w => {
    const status = getWarrantyStatus(w.coverage_end);
    return `Type: ${w.warranty_type}, Provider: ${w.provider_name || "Unknown"}, Status: ${status.label}, Coverage: ${w.coverage_start || "?"} to ${w.coverage_end || "?"}, Days left: ${status.daysLeft}, Claim phone: ${w.claim_phone || "N/A"}, Claim website: ${w.claim_website || "N/A"}`;
  }).join("\n");

  const systemContext = systemInfo
    ? `System: ${systemInfo.system_name}, Brand: ${systemInfo.brand || "Unknown"}, Model: ${systemInfo.model || "Unknown"}, Serial: ${systemInfo.serial_number || "Unknown"}, Purchase date: ${systemInfo.purchase_date || "Unknown"}, Install date: ${systemInfo.install_date || "Unknown"}`
    : "";

  if (loading) return <div className="animate-pulse h-24 bg-secondary rounded-xl" />;

  const systemWarranties = warranties.filter((w) => w.system_detail_id === systemDetailId);
  const propertyWarranties = warranties.filter((w) => !w.system_detail_id);

  const renderWarrantyCard = (w: Warranty) => {
    const status = getWarrantyStatus(w.coverage_end);
    const StatusIcon = status.icon;
    return (
      <div key={w.id} className="rounded-lg border border-border bg-background p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <span className="text-sm font-semibold text-foreground capitalize">{w.warranty_type.replace("_", " ")} Warranty</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            status.label === "Active" ? "bg-emerald-500/20 text-emerald-500" :
            status.label === "Expiring Soon" ? "bg-[hsl(var(--health-amber))]/20 text-[hsl(var(--health-amber))]" :
            "bg-destructive/20 text-destructive"
          }`}>{status.label}</span>
        </div>
        {status.daysLeft > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3 inline mr-1" />
              {systemInfo?.system_name || "This item"} warranty expires in <span className="font-bold text-foreground">{status.daysLeft} days</span>
            </p>
            <Progress value={Math.max(0, Math.min(100, (status.daysLeft / 365) * 100))} className="h-1.5" />
          </div>
        )}
        {status.daysLeft <= 0 && w.coverage_end && (
          <p className="text-xs text-destructive mb-3">Expired on {new Date(w.coverage_end).toLocaleDateString()}</p>
        )}
        {w.provider_name && <p className="text-xs text-muted-foreground">Provider: <span className="text-foreground">{w.provider_name}</span></p>}
        {w.coverage_start && w.coverage_end && (
          <p className="text-xs text-muted-foreground">Coverage: {w.coverage_start} — {w.coverage_end}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {w.claim_phone && (
            <a href={`tel:${w.claim_phone}`} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg font-medium">
              <Phone className="h-3 w-3" /> {w.claim_phone}
            </a>
          )}
          {w.claim_website && (
            <a href={w.claim_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg font-medium">
              <Globe className="h-3 w-3" /> File Claim Online
            </a>
          )}
        </div>
        {!w.document_url && (
          <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <Upload className="h-3.5 w-3.5" /> Upload warranty document (PDF)
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadDoc(w.id, e.target.files[0])} />
          </label>
        )}
        {w.document_url && (
          <a href={w.document_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
            <FileText className="h-3.5 w-3.5" /> View warranty document
          </a>
        )}
        <button onClick={() => setShowClaimAssist(showClaimAssist === w.id ? null : w.id)} className="mt-3 w-full text-xs bg-destructive/10 text-destructive font-semibold py-2 rounded-lg hover:bg-destructive/20 transition-colors">
          Help Me File a Claim
        </button>
        {showClaimAssist === w.id && (
          <ClaimAssistant warranty={w} systemInfo={systemInfo} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-semibold text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Warranty Information
          </h2>
          <button onClick={() => setShowForm(!showForm)} className="text-xs text-primary font-medium hover:underline">
            {showForm ? "Cancel" : "+ Add Warranty"}
          </button>
        </div>

        {systemWarranties.map(renderWarrantyCard)}

        {propertyWarranties.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Property Warranties</h3>
            <p className="text-xs text-muted-foreground mb-3">These warranties are not linked to a specific system.</p>
            {propertyWarranties.map(renderWarrantyCard)}
          </div>
        )}

        {systemWarranties.length === 0 && propertyWarranties.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-4">No warranties added yet. Add one to track coverage and get expiration alerts.</p>
        )}

        {showForm && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <select value={form.warranty_type} onChange={(e) => setForm({ ...form, warranty_type: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              {WARRANTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input placeholder="Provider name" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start date</label>
                <input type="date" value={form.coverage_start} onChange={(e) => setForm({ ...form, coverage_start: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End date</label>
                <input type="date" value={form.coverage_end} onChange={(e) => setForm({ ...form, coverage_end: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
            </div>
            <input placeholder="Claim phone number" value={form.claim_phone} onChange={(e) => setForm({ ...form, claim_phone: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            <input placeholder="Claim website URL" value={form.claim_website} onChange={(e) => setForm({ ...form, claim_website: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            <textarea placeholder="Claim process notes" value={form.claim_notes} onChange={(e) => setForm({ ...form, claim_notes: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" rows={2} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.is_transferable} onChange={(e) => setForm({ ...form, is_transferable: e.target.checked })} className="rounded border-border" />
              Transferable to new owner
            </label>
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold text-sm">Save Warranty</button>
          </div>
        )}
      </div>

      <button onClick={() => setShowChat(!showChat)} className="w-full rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 hover:bg-primary/10 transition-colors">
        <MessageSquare className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Ask about my warranty</span>
        {showChat ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />}
      </button>
      {showChat && (
        <WarrantyAIChat warrantyContext={warrantyContext} systemContext={systemContext} systemInfo={systemInfo} />
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--health-amber))]" /> Manufacturer vs Home Warranty
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You have two types of protection: Your <span className="text-foreground font-medium">manufacturer warranty</span> covers defects in your specific appliance. A <span className="text-foreground font-medium">home warranty</span> is a service contract that covers repair or replacement of multiple systems and appliances. You can have both.
        </p>
        <div className="flex gap-2 mt-3">
          <span className={`text-xs px-2 py-1 rounded-full ${warranties.some(w => w.warranty_type === "manufacturer") ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {warranties.some(w => w.warranty_type === "manufacturer") ? "✓ Manufacturer" : "✗ No Manufacturer"}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${warranties.some(w => w.warranty_type === "home_warranty") ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {warranties.some(w => w.warranty_type === "home_warranty") ? "✓ Home Warranty" : "✗ No Home Warranty"}
          </span>
        </div>
      </div>

      {warranties.some(w => getWarrantyStatus(w.coverage_end).label === "Expired" || getWarrantyStatus(w.coverage_end).label === "Expiring Soon") && (
        <div className="rounded-xl border border-[hsl(var(--health-amber))]/30 bg-[hsl(var(--health-amber))]/5 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Extended Warranty Options</h3>
          <p className="text-xs text-muted-foreground mb-3">Protect your {systemInfo?.system_name || "appliance"} with extended coverage.</p>
          {[
            { name: "Asurion", price: "$25-40/mo", deductible: "$75" },
            { name: "SquareTrade", price: "$20-35/mo", deductible: "$50" },
            { name: "Cinch Home Services", price: "$35-55/mo", deductible: "$100" },
            { name: "American Home Shield", price: "$30-75/mo", deductible: "$75-125" },
          ].map(p => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.price} · {p.deductible} deductible</p>
              </div>
              <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium">Get Quote</button>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-2">ComingHomeIQ may receive compensation when you request a quote through our platform.</p>
        </div>
      )}
    </div>
  );
}

function ClaimAssistant({ warranty, systemInfo }: { warranty: Warranty; systemInfo?: SystemInfo }) {
  const status = getWarrantyStatus(warranty.coverage_end);
  const steps = [
    { title: "Verify warranty period", detail: status.daysLeft > 0 ? `✅ Active — ${status.daysLeft} days remaining (expires ${warranty.coverage_end})` : `❌ Warranty expired on ${warranty.coverage_end}. Contact manufacturer — some may still honor claims.` },
    { title: "Document the problem", detail: "Take photos and video of the issue. Note when it started and any error codes." },
    { title: "Find proof of purchase", detail: systemInfo?.purchase_date ? `Your purchase date on file: ${systemInfo.purchase_date}` : "Check your uploaded receipts in the Documents section." },
    { title: "Contact the manufacturer", detail: `${warranty.claim_phone ? `Call: ${warranty.claim_phone}` : "No phone on file."} ${warranty.claim_website ? `\nOnline: ${warranty.claim_website}` : ""}` },
    { title: "What to say", detail: `Tell them: Model ${systemInfo?.model || "[add model]"}, Serial ${systemInfo?.serial_number || "[add serial]"}, purchased ${systemInfo?.purchase_date || "[add date]"}. Describe the issue clearly.` },
    { title: "What to expect", detail: "Most manufacturers will schedule a service visit within 5-10 business days. Parts-only warranties mean you pay for labor." },
  ];
  return (
    <div className="mt-3 space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-semibold text-foreground">Step {i + 1} — {s.title}</p>
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{s.detail}</p>
        </div>
      ))}
    </div>
  );
}
