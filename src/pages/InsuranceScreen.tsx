import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, Upload, Phone, AlertTriangle, ChevronRight, Plus, FileText,
  MessageSquare, Send, Bot, Clock, ExternalLink, Star, Trash2, X,
  CheckCircle2, AlertCircle, Bell, Search, ArrowLeft, Heart, Pencil
} from "lucide-react";
import DiscountPotentialSection from "@/components/DiscountPotentialSection";
import RefreshButton from "@/components/RefreshButton";

// ─── Types ───
type PolicyType = "primary" | "flood" | "earthquake" | "umbrella" | "warranty";
interface Policy {
  id: string;
  policy_type: string;
  insurance_company: string | null;
  policy_number: string | null;
  coverage_start: string | null;
  coverage_end: string | null;
  premium_amount: number | null;
  premium_frequency: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  claims_phone: string | null;
  online_portal_url: string | null;
  dwelling_coverage: number | null;
  personal_property_coverage: number | null;
  liability_coverage: number | null;
  deductible_amount: number | null;
  wind_hail_deductible: string | null;
  flood_coverage: boolean | null;
  earthquake_coverage: boolean | null;
  equipment_breakdown: boolean | null;
  exclusions: string[] | null;
  coverage_gaps: string[] | null;
  ai_analysis: Record<string, unknown> | null;
  property_id: string;
  user_id: string;
}
interface Claim {
  id: string;
  claim_date: string;
  claim_type: string;
  amount_claimed: number | null;
  amount_paid: number | null;
  claim_number: string | null;
  status: string;
  notes: string | null;
}
interface ChatMsg { role: "user" | "assistant"; content: string; }

const policyTypeLabels: Record<PolicyType, string> = {
  primary: "Primary Home Insurance",
  flood: "Flood Insurance",
  earthquake: "Earthquake Insurance",
  umbrella: "Umbrella Policy",
  warranty: "Home Warranty",
};

const questionChips = [
  "Is my roof covered for hail damage?",
  "What is my water damage deductible?",
  "Am I covered if my HVAC system fails?",
  "Does my policy cover a sewer backup?",
  "What happens if a tree falls on my house?",
  "Is my detached garage covered?",
  "How do I file a claim?",
];

const insuranceProviders = [
  { name: "State Farm", rating: 4.5, range: "$1,200 – $2,400/yr" },
  { name: "Allstate", rating: 4.3, range: "$1,100 – $2,200/yr" },
  { name: "USAA", rating: 4.8, range: "$900 – $1,800/yr" },
  { name: "Progressive", rating: 4.2, range: "$1,000 – $2,000/yr" },
  { name: "Liberty Mutual", rating: 4.1, range: "$1,150 – $2,300/yr" },
];

const fmt = (n: number | null | undefined): string | null =>
  n != null && n > 0 ? `$${n.toLocaleString()}` : null;

// ─── Component ───
const InsuranceScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, properties } = useAuth();
  const activeProperty = properties.find((p) => p.is_active) || properties[0];

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddClaim, setShowAddClaim] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [newPolicyType, setNewPolicyType] = useState<PolicyType>("primary");
  const [uploading, setUploading] = useState(false);

  // Policy form
  const [pForm, setPForm] = useState({
    insurance_company: "", policy_number: "", coverage_start: "", coverage_end: "",
    premium_amount: "", premium_frequency: "annual", agent_name: "", agent_phone: "",
    claims_phone: "", online_portal_url: "", dwelling_coverage: "", personal_property_coverage: "",
    liability_coverage: "", deductible_amount: "", agent_email: "", notes: "",
  });

  // Claims form
  const [cForm, setCForm] = useState({
    claim_date: "", claim_type: "", amount_claimed: "", amount_paid: "",
    claim_number: "", status: "open", notes: "",
  });

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // System alerts
  const [systemAlerts, setSystemAlerts] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [user, activeProperty]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Open the manual entry form directly when arriving via ?add=manual
  useEffect(() => {
    if (searchParams.get("add") === "manual") {
      setShowAddPolicy(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    if (!user || !activeProperty) return;
    setLoading(false);
    const { data: pol } = await supabase
      .from("insurance_policies")
      .select("*")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id);
    if (pol) setPolicies(pol as unknown as Policy[]);

    if (pol && pol.length > 0) {
      const { data: cl } = await supabase
        .from("insurance_claims")
        .select("*")
        .eq("policy_id", pol[0].id)
        .eq("user_id", user.id)
        .order("claim_date", { ascending: false });
      if (cl) setClaims(cl as unknown as Claim[]);
    }

    // Check system details for alerts
    const { data: systems } = await supabase
      .from("system_details")
      .select("system_name, brand, health_score, install_date")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id);
    const alertSet = new Set<string>();
    if (systems) {
      for (const s of systems) {
        if (s.system_name?.toLowerCase().includes("electrical") &&
          s.brand && ["federal pacific", "zinsco", "challenger"].some(
            (b) => s.brand!.toLowerCase().includes(b)
          )) {
          alertSet.add(`Your ${s.brand} electrical panel may affect your insurance coverage — some insurers require replacement. Check with your agent.`);
        }
        if (s.system_name?.toLowerCase().includes("roof") && s.install_date) {
          const age = new Date().getFullYear() - new Date(s.install_date).getFullYear();
          if (age >= 20) alertSet.add("Your roof age may affect your coverage or premium — verify with your insurer.");
        }
        if (s.system_name?.toLowerCase().includes("well") && s.health_score && s.health_score < 60) {
          alertSet.add("Some insurers require annual well water tests — check your policy requirements.");
        }
      }
    }
    setSystemAlerts(Array.from(alertSet));
  };

  const handleAddPolicy = async () => {
    if (!user || !activeProperty) return;
    if (!pForm.insurance_company.trim() && !pForm.policy_number.trim()) {
      toast.error("Add at least the insurance company or policy number");
      return;
    }
    const payload = {
      user_id: user.id,
      property_id: activeProperty.id,
      policy_type: newPolicyType,
      data_status: "owner_submitted",
      insurance_company: pForm.insurance_company || null,
      policy_number: pForm.policy_number || null,
      coverage_start: pForm.coverage_start || null,
      coverage_end: pForm.coverage_end || null,
      premium_amount: pForm.premium_amount ? Number(pForm.premium_amount) : null,
      premium_frequency: pForm.premium_frequency,
      agent_name: pForm.agent_name || null,
      agent_phone: pForm.agent_phone || null,
      claims_phone: pForm.claims_phone || null,
      online_portal_url: pForm.online_portal_url || null,
      dwelling_coverage: pForm.dwelling_coverage ? Number(pForm.dwelling_coverage) : null,
      personal_property_coverage: pForm.personal_property_coverage ? Number(pForm.personal_property_coverage) : null,
      liability_coverage: pForm.liability_coverage ? Number(pForm.liability_coverage) : null,
      deductible_amount: pForm.deductible_amount ? Number(pForm.deductible_amount) : null,
      // Stash agent email + notes inside ai_analysis until dedicated columns exist.
      ai_analysis: (pForm.agent_email || pForm.notes)
        ? { owner_entered: { agent_email: pForm.agent_email || null, notes: pForm.notes || null } }
        : null,
    };
    const { error } = await supabase.from("insurance_policies").insert(payload as any);
    if (error) { toast.error("Failed to save policy"); return; }
    toast.success("Policy added!");
    setShowAddPolicy(false);
    setPForm({ insurance_company: "", policy_number: "", coverage_start: "", coverage_end: "", premium_amount: "", premium_frequency: "annual", agent_name: "", agent_phone: "", claims_phone: "", online_portal_url: "", dwelling_coverage: "", personal_property_coverage: "", liability_coverage: "", deductible_amount: "", agent_email: "", notes: "" });
    loadData();
  };

  const handleUploadDoc = async (policyId: string, file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${policyId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("insurance-documents").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = await supabase.storage.from("insurance-documents").createSignedUrl(path, 86400);
    await supabase.from("insurance_documents").insert({
      user_id: user.id, policy_id: policyId, file_name: file.name,
      storage_path: path, url: urlData?.signedUrl || "", doc_type: "policy",
    });
    toast.success("Document uploaded!");
    setUploading(false);
  };

  const handleAddClaim = async () => {
    if (!user || policies.length === 0) return;
    const { error } = await supabase.from("insurance_claims").insert({
      user_id: user.id,
      policy_id: policies[0].id,
      claim_date: cForm.claim_date,
      claim_type: cForm.claim_type,
      amount_claimed: cForm.amount_claimed ? Number(cForm.amount_claimed) : null,
      amount_paid: cForm.amount_paid ? Number(cForm.amount_paid) : null,
      claim_number: cForm.claim_number || null,
      status: cForm.status,
      notes: cForm.notes || null,
    });
    if (error) { toast.error("Failed to add claim"); return; }
    toast.success("Claim logged!");
    setShowAddClaim(false);
    setCForm({ claim_date: "", claim_type: "", amount_claimed: "", amount_paid: "", claim_number: "", status: "open", notes: "" });
    loadData();
  };

  const buildPolicyContext = () => {
    if (policies.length === 0) return "";
    return policies.map((p) => `
Policy Type: ${policyTypeLabels[p.policy_type as PolicyType] || p.policy_type}
Insurance Company: ${p.insurance_company || "Unknown"}
Policy Number: ${p.policy_number || "N/A"}
Coverage Period: ${p.coverage_start || "?"} to ${p.coverage_end || "?"}
Dwelling Coverage: ${fmt(p.dwelling_coverage)}
Personal Property Coverage: ${fmt(p.personal_property_coverage)}
Liability Coverage: ${fmt(p.liability_coverage)}
Deductible: ${fmt(p.deductible_amount)}
Wind/Hail Deductible: ${p.wind_hail_deductible || "Standard"}
Flood Coverage: ${p.flood_coverage ? "Yes" : "No"}
Earthquake Coverage: ${p.earthquake_coverage ? "Yes" : "No"}
Equipment Breakdown: ${p.equipment_breakdown ? "Yes" : "No"}
`).join("\n---\n");
  };

  const sendChat = async (msg: string) => {
    if (!msg.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: msg };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insurance-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages, policyContext: buildPolicyContext() }),
        }
      );
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantSoFar += c;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant")
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("AI chat error");
    }
    setChatLoading(false);
  };

  const primary = policies.find((p) => p.policy_type === "primary");
  const daysUntilRenewal = primary?.coverage_end
    ? Math.ceil((new Date(primary.coverage_end).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/systems")} className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Home Insurance
          </h1>
          <p className="text-sm text-muted-foreground">Manage policies, claims & coverage</p>
        </div>
      </div>

      {/* Refresh data */}
      <RefreshButton scope="insurance" variant="compact" className="mb-4" />

      {/* Emergency Claims Button */}
      <button
        onClick={() => setShowEmergency(true)}
        className="w-full rounded-2xl bg-danger py-4 font-heading font-bold text-white text-lg hover:bg-danger/90 transition-colors flex items-center justify-center gap-3 mb-6 shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
      >
        <Phone className="h-6 w-6" /> Emergency Claims — Call Now
      </button>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowEmergency(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                <Phone className="h-5 w-5 text-danger" /> Emergency Contacts
              </h2>
              <button onClick={() => setShowEmergency(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {policies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No policies added yet — add your policy to see claims contacts.</p>
            ) : (
              policies.map((p) => (
                <div key={p.id} className="rounded-xl bg-bg-secondary border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">{p.insurance_company || policyTypeLabels[p.policy_type as PolicyType]}</p>
                  {p.claims_phone && (
                    <a href={`tel:${p.claims_phone}`} className="flex items-center gap-2 mt-2 text-danger font-heading font-bold text-lg hover:underline">
                      <Phone className="h-5 w-5" /> {p.claims_phone}
                    </a>
                  )}
                  {p.agent_phone && (
                    <a href={`tel:${p.agent_phone}`} className="flex items-center gap-2 mt-1 text-primary text-sm hover:underline">
                      <Phone className="h-4 w-4" /> Agent: {p.agent_name} — {p.agent_phone}
                    </a>
                  )}
                  {p.online_portal_url && (
                    <a href={p.online_portal_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 text-brain-blue text-sm hover:underline">
                      <ExternalLink className="h-4 w-4" /> Online Portal
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Renewal Reminder */}
      {daysUntilRenewal != null && daysUntilRenewal <= 60 && daysUntilRenewal > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 mb-6 flex items-start gap-3">
          <Bell className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Your home insurance renews in {daysUntilRenewal} days.</p>
            <p className="text-xs text-muted-foreground mt-1">This is a good time to shop for better rates and review your coverage.</p>
          </div>
        </div>
      )}

      {/* System Health Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {systemAlerts.map((alert, i) => (
            <div key={i} className="rounded-2xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Policies ── */}
      <Section title="My Policies">
        {policies.length === 0 && !showAddPolicy && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No insurance policies yet</p>
            <p className="text-xs text-muted-foreground mb-4">Add your home insurance to track coverage and get AI-powered insights</p>
            <button onClick={() => setShowAddPolicy(true)} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-heading font-bold text-primary-foreground hover:opacity-90">
              <Plus className="inline h-4 w-4 mr-1" /> Add Policy
            </button>
          </div>
        )}

        {policies.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 mb-3 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-heading font-bold text-foreground">{p.insurance_company || policyTypeLabels[p.policy_type as PolicyType]}</span>
              </div>
              <span className="text-xs bg-success/15 text-success px-2.5 py-1 rounded-full font-medium">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {p.policy_number && (
                <div><span className="text-muted-foreground">Policy #:</span> <span className="text-foreground">{p.policy_number}</span></div>
              )}
              {fmt(p.premium_amount) && (
                <div><span className="text-muted-foreground">Premium:</span> <span className="text-foreground">{fmt(p.premium_amount)}/{p.premium_frequency}</span></div>
              )}
              {p.coverage_start && (
                <div><span className="text-muted-foreground">Start:</span> <span className="text-foreground">{p.coverage_start}</span></div>
              )}
              {p.coverage_end && (
                <div><span className="text-muted-foreground">End:</span> <span className="text-foreground">{p.coverage_end}</span></div>
              )}
            </div>
            {/* Upload area */}
            <label className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg-secondary py-3 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload Policy PDF"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUploadDoc(p.id, e.target.files[0]); }} />
            </label>
          </div>
        ))}

        {policies.length > 0 && !showAddPolicy && (
          <button onClick={() => setShowAddPolicy(true)} className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-primary hover:bg-muted transition-colors flex items-center justify-center gap-2 mt-3">
            <Plus className="h-4 w-4" /> Add Another Policy
          </button>
        )}
      </Section>

      {/* Add Policy Form */}
      {showAddPolicy && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6 space-y-4">
          <div>
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Add Policy Manually
            </h3>
            <div className="mt-2 rounded-xl bg-brain-blue/10 border border-brain-blue/30 p-3">
              <p className="text-xs text-foreground">
                <span className="font-semibold">Don't have your document?</span>{" "}
                Enter what you know now — you can upload the full policy PDF anytime later.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Only the insurance company name or policy number is required.</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Policy Type</label>
            <select value={newPolicyType} onChange={(e) => setNewPolicyType(e.target.value as PolicyType)} className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-3 text-sm text-foreground">
              {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Insurance Company" value={pForm.insurance_company} onChange={(v) => setPForm({ ...pForm, insurance_company: v })} />
            <FormInput label="Policy Number" value={pForm.policy_number} onChange={(v) => setPForm({ ...pForm, policy_number: v })} />
            <FormInput label="Coverage Start" type="date" value={pForm.coverage_start} onChange={(v) => setPForm({ ...pForm, coverage_start: v })} />
            <FormInput label="Coverage End" type="date" value={pForm.coverage_end} onChange={(v) => setPForm({ ...pForm, coverage_end: v })} />
            <FormInput label="Premium Amount" type="number" value={pForm.premium_amount} onChange={(v) => setPForm({ ...pForm, premium_amount: v })} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Frequency</label>
              <select value={pForm.premium_frequency} onChange={(e) => setPForm({ ...pForm, premium_frequency: e.target.value })} className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-3 text-sm text-foreground">
                <option value="monthly">Monthly</option><option value="annual">Annual</option>
              </select>
            </div>
            <FormInput label="Agent Name" value={pForm.agent_name} onChange={(v) => setPForm({ ...pForm, agent_name: v })} />
            <FormInput label="Agent Phone" value={pForm.agent_phone} onChange={(v) => setPForm({ ...pForm, agent_phone: v })} />
            <FormInput label="Agent Email" value={pForm.agent_email} onChange={(v) => setPForm({ ...pForm, agent_email: v })} />
            <FormInput label="Claims Phone (24hr)" value={pForm.claims_phone} onChange={(v) => setPForm({ ...pForm, claims_phone: v })} />
            <FormInput label="Online Portal URL" value={pForm.online_portal_url} onChange={(v) => setPForm({ ...pForm, online_portal_url: v })} />
            <FormInput label="Dwelling Coverage" type="number" value={pForm.dwelling_coverage} onChange={(v) => setPForm({ ...pForm, dwelling_coverage: v })} />
            <FormInput label="Personal Property" type="number" value={pForm.personal_property_coverage} onChange={(v) => setPForm({ ...pForm, personal_property_coverage: v })} />
            <FormInput label="Liability Coverage" type="number" value={pForm.liability_coverage} onChange={(v) => setPForm({ ...pForm, liability_coverage: v })} />
            <FormInput label="Deductible" type="number" value={pForm.deductible_amount} onChange={(v) => setPForm({ ...pForm, deductible_amount: v })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={pForm.notes}
              onChange={(e) => setPForm({ ...pForm, notes: e.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="Anything else worth remembering about this policy…"
              className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddPolicy} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-heading font-bold text-primary-foreground hover:opacity-90">Save Policy</button>
            <button onClick={() => setShowAddPolicy(false)} className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-medium text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Coverage Summary ── */}
      {primary && (
        <Section title="Coverage Summary">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <CoverageStat label="Dwelling" value={fmt(primary.dwelling_coverage)} />
              <CoverageStat label="Personal Property" value={fmt(primary.personal_property_coverage)} />
              <CoverageStat label="Liability" value={fmt(primary.liability_coverage)} />
              <CoverageStat label="Deductible" value={fmt(primary.deductible_amount)} />
            </div>
            {/* Exclusions */}
            {primary.exclusions && primary.exclusions.length > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Key Exclusions</p>
                {primary.exclusions.map((ex, i) => (
                  <p key={i} className="text-xs text-muted-foreground ml-5 mb-1">• {ex}</p>
                ))}
              </div>
            )}
            {/* Coverage Gaps */}
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <p className="text-xs font-semibold text-foreground mb-2">Coverage Gap Analysis</p>
              {!primary.flood_coverage && (
                <GapAlert text="Your policy does not mention flood coverage — if you are in a flood zone this is important." />
              )}
              {primary.wind_hail_deductible && (
                <GapAlert text={`Your policy has a separate wind and hail deductible of ${primary.wind_hail_deductible}.`} />
              )}
              {!primary.equipment_breakdown && (
                <GapAlert text="Equipment breakdown coverage is not included — this would cover your HVAC and appliances." />
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── AI Insurance Chat ── */}
      <Section title="Insurance AI — Ask about your policy">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Chat messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-bg-secondary rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-sm text-foreground">
                    {primary
                      ? `I have read your ${primary.insurance_company || "home insurance"} policy. You are covered up to ${fmt(primary.dwelling_coverage)} for dwelling and ${fmt(primary.personal_property_coverage)} for personal property. What would you like to know about your coverage?`
                      : "Upload your insurance policy and I can answer specific questions about your coverage. What would you like to know?"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">This is for informational purposes only. Always confirm coverage details directly with your insurance agent before filing a claim.</p>
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-2xl p-3 max-w-[85%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-bg-secondary text-foreground rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="bg-bg-secondary rounded-2xl rounded-tl-sm p-3"><span className="animate-pulse text-muted-foreground text-sm">Thinking…</span></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Question chips */}
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {questionChips.map((q) => (
              <button key={q} onClick={() => sendChat(q)} className="text-xs rounded-full border border-border bg-bg-secondary px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat(chatInput)}
              placeholder="Ask about your coverage…"
              className="flex-1 rounded-xl border border-border bg-bg-secondary py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim()} className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Section>

      {/* ── Claims History ── */}
      <Section title="Claims History">
        <p className="text-[10px] text-muted-foreground mb-3 italic flex items-center gap-1">
          <Shield className="h-3 w-3" /> Claims history is visible to you only — never shared without your permission. This is for your records.
        </p>
        <div className="rounded-2xl border border-border bg-card">
          {claims.length === 0 && !showAddClaim && (
            <p className="p-4 text-sm text-muted-foreground text-center">No claims logged yet</p>
          )}
          {claims.map((c, i) => (
            <div key={c.id} className={`p-4 flex items-start gap-3 ${i < claims.length - 1 ? "border-b border-border/50" : ""}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${c.status === "closed" ? "bg-success/15" : c.status === "denied" ? "bg-danger/15" : "bg-warning/15"}`}>
                {c.status === "closed" ? <CheckCircle2 className="h-4 w-4 text-success" /> : c.status === "denied" ? <X className="h-4 w-4 text-danger" /> : <Clock className="h-4 w-4 text-warning" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{c.claim_type}</p>
                <p className="text-xs text-muted-foreground">
                  {c.claim_date}{c.claim_number ? ` · #${c.claim_number}` : ""}
                </p>
                <div className="flex gap-4 mt-1 text-xs">
                  {fmt(c.amount_claimed) && (
                    <span className="text-muted-foreground">Claimed: {fmt(c.amount_claimed)}</span>
                  )}
                  {fmt(c.amount_paid) && (
                    <span className="text-muted-foreground">Paid: {fmt(c.amount_paid)}</span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === "closed" ? "bg-success/15 text-success" : c.status === "denied" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {showAddClaim ? (
          <div className="rounded-2xl border border-border bg-card p-5 mt-3 space-y-3">
            <h3 className="font-heading font-bold text-foreground text-sm">Log a Claim</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Claim Date" type="date" value={cForm.claim_date} onChange={(v) => setCForm({ ...cForm, claim_date: v })} />
              <FormInput label="Claim Type" value={cForm.claim_type} onChange={(v) => setCForm({ ...cForm, claim_type: v })} placeholder="e.g. Water damage" />
              <FormInput label="Amount Claimed" type="number" value={cForm.amount_claimed} onChange={(v) => setCForm({ ...cForm, amount_claimed: v })} />
              <FormInput label="Amount Paid" type="number" value={cForm.amount_paid} onChange={(v) => setCForm({ ...cForm, amount_paid: v })} />
              <FormInput label="Claim Number" value={cForm.claim_number} onChange={(v) => setCForm({ ...cForm, claim_number: v })} />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select value={cForm.status} onChange={(e) => setCForm({ ...cForm, status: e.target.value })} className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-3 text-sm text-foreground">
                  <option value="open">Open</option><option value="closed">Closed</option><option value="denied">Denied</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddClaim} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-heading font-bold text-primary-foreground hover:opacity-90">Save Claim</button>
              <button onClick={() => setShowAddClaim(false)} className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-medium text-foreground">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddClaim(true)} className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-primary hover:bg-muted transition-colors flex items-center justify-center gap-2 mt-3">
            <Plus className="h-4 w-4" /> Log a Claim
          </button>
        )}
      </Section>

      {/* ── Maintenance Discount Potential ── */}
      <DiscountPotentialSection
        healthScore={87}
        profileCompleteness={65}
        totalSystems={8}
        configuredSystems={5}
      />

      {/* ── Insurance Marketplace ── */}
      <Section title="Compare Insurance Options">
        <div className="space-y-3">
          {insuranceProviders.map((prov) => (
            <div key={prov.name} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-navy/20 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold text-foreground">{prov.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <span className="text-xs text-muted-foreground">{prov.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{prov.range}</span>
                </div>
              </div>
              <button className="rounded-xl bg-navy px-4 py-2 text-xs font-heading font-bold text-white hover:bg-navy-light transition-colors">
                Get Quote
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-center italic">
          ComingHomeIQ may receive compensation when you request a quote through our platform.
        </p>
      </Section>
    </div>
  );
};

// ─── Sub-components ───
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">{title}</h2>
    {children}
  </div>
);

const FormInput = ({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
  </div>
);

const CoverageStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-bg-secondary p-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="text-lg font-heading font-bold text-foreground mt-0.5">{value}</p>
  </div>
);

const GapAlert = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 rounded-xl bg-warning/10 border border-warning/20 p-3">
    <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
    <p className="text-xs text-foreground">{text}</p>
  </div>
);

export default InsuranceScreen;
