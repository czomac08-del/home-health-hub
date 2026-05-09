import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wrench, FileText, Camera, X, Check, Home as HomeIcon, ClipboardList, Info, AlertTriangle } from "lucide-react";

interface JobPackage {
  status: "active" | "expired" | "revoked" | "invalid";
  share_id: string;
  property_id: string;
  system_id: string | null;
  share_type: "contractor" | "inspector" | "realtor";
  job_description: string | null;
  access_notes: string | null;
  allow_submission: boolean;
  submission_status: "pending" | "submitted" | "approved" | "rejected";
  property_address_short: string | null;
  system_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  last_service: string | null;
  specs: any;
  expires_at: string;
  recent_history: Array<any>;
  has_submission: boolean;
}

const JobShareScreen = () => {
  const { token } = useParams();
  const [params] = useSearchParams();
  const initialTab = params.get("contractor") === "true" ? "submit" : "info";
  const [tab, setTab] = useState<"info" | "submit">(initialTab as any);
  const [pkg, setPkg] = useState<JobPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [contractorName, setContractorName] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [partsInput, setPartsInput] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [partModelsInput, setPartModelsInput] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [deficiency, setDeficiency] = useState<"minor" | "major" | "safety" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isInspector = pkg?.share_type === "inspector";

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_job_share_package", { _token: token } as any);
      if (error || !data || (data as any[]).length === 0) {
        setPkg({ status: "invalid" } as any);
      } else {
        setPkg((data as any[])[0] as JobPackage);
      }
      setLoading(false);
    })();
  }, [token]);

  const addPart = () => {
    const v = partsInput.trim();
    if (!v) return;
    setParts((p) => [...p, v]);
    setPartsInput("");
  };

  const removePart = (i: number) => setParts((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!pkg || pkg.status !== "active" || !token) return;
    if (!workPerformed.trim()) {
      toast.error(isInspector ? "Findings summary is required" : "Work performed is required");
      return;
    }
    if (isInspector && !deficiency) {
      toast.error("Select a deficiency level");
      return;
    }
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const f of files) {
        const path = `${token}/${Date.now()}-${f.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("contractor-submissions")
          .upload(path, f, { contentType: f.type });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("contractor-submissions").getPublicUrl(path);
          if (pub?.publicUrl) photoUrls.push(pub.publicUrl);
        }
      }

      const partModels = partModelsInput
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (isInspector) {
        const { error } = await supabase.from("inspector_submissions").insert({
          share_id: pkg.share_id,
          share_token: token,
          property_id: pkg.property_id,
          system_id: pkg.system_id,
          inspector_name: contractorName.trim() || null,
          findings_summary: workPerformed.trim(),
          deficiency_level: deficiency || null,
          parts_replaced: parts,
          notes: notes.trim() || null,
          photos: photoUrls,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contractor_submissions").insert({
          share_id: pkg.share_id,
          share_token: token,
          property_id: pkg.property_id,
          system_id: pkg.system_id,
          contractor_name: contractorName.trim() || null,
          work_performed: workPerformed.trim(),
          parts_replaced: parts,
          part_models: partModels,
          labor_hours: laborHours ? parseFloat(laborHours) : null,
          invoice_amount: invoice ? parseFloat(invoice) : null,
          notes: notes.trim() || null,
          photos: photoUrls,
        } as any);
        if (error) throw error;
      }

      // mark share as submitted (best-effort; will fail silently if RLS blocks)
      await supabase
        .from("property_shares")
        .update({ submission_status: "submitted" } as any)
        .eq("token", token);

      setSubmitted(true);
      toast.success("Submitted to homeowner");
    } catch (e: any) {
      toast.error(e?.message || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!pkg || pkg.status !== "active") {
    const map: Record<string, { title: string; body: string }> = {
      invalid: { title: "Link not found", body: "This share link is invalid or no longer exists." },
      expired: { title: "Link expired", body: "This job share link has expired. Please ask the homeowner for a new link." },
      revoked: { title: "Link revoked", body: "The homeowner has revoked this link." },
    };
    const m = map[pkg?.status || "invalid"];
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground mb-1">{m.title}</h1>
          <p className="text-xs text-muted-foreground">{m.body}</p>
        </div>
      </div>
    );
  }

  const submissionDone = submitted || pkg.submission_status !== "pending";

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto px-4 py-6">
      <header className="mb-4">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
          {isInspector ? "Inspection Share" : "Job Share"} · ComingHomeIQ
        </p>
        <h1 className="text-xl font-bold text-foreground">{pkg.job_description || (isInspector ? "Property Inspection" : "Service Job")}</h1>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <HomeIcon className="h-3 w-3" /> {pkg.property_address_short || "Property"}
        </p>
      </header>

      <div className="flex gap-1 mb-4 rounded-xl bg-secondary/50 p-1">
        <button onClick={() => setTab("info")}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold ${tab === "info" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <ClipboardList className="h-3.5 w-3.5 inline mr-1" /> Job Info
        </button>
        {pkg.allow_submission && (
          <button onClick={() => setTab("submit")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold ${tab === "submit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <Wrench className="h-3.5 w-3.5 inline mr-1" /> Submit Work
          </button>
        )}
      </div>

      {tab === "info" && (
        <div className="space-y-4">
          {pkg.access_notes && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Access Notes</p>
                  <p className="text-xs text-foreground/80 whitespace-pre-line">{pkg.access_notes}</p>
                </div>
              </div>
            </div>
          )}

          {pkg.system_name && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">System</p>
              <p className="text-base font-bold text-foreground mb-3">{pkg.system_name}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {pkg.brand && <Field label="Brand" value={pkg.brand} />}
                {pkg.model && <Field label="Model" value={pkg.model} />}
                {pkg.serial_number && <Field label="Serial" value={pkg.serial_number} />}
                {pkg.install_date && <Field label="Installed" value={pkg.install_date} />}
                {pkg.last_service && <Field label="Last Service" value={pkg.last_service} />}
                {pkg.specs?.filter_size && <Field label="Filter Size" value={String(pkg.specs.filter_size)} />}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Service History</p>
            {pkg.recent_history?.length ? (
              <div className="space-y-2">
                {pkg.recent_history.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between text-xs border-b border-border last:border-b-0 pb-2 last:pb-0">
                    <div>
                      <p className="text-foreground font-medium">{h.action}</p>
                      <p className="text-muted-foreground text-[10px]">{h.performed_by || "Unknown"}</p>
                    </div>
                    <span className="text-muted-foreground text-[10px]">{h.performed_date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No prior service records on file.</p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Link expires {new Date(pkg.expires_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {tab === "submit" && pkg.allow_submission && (
        submissionDone ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center">
            <Check className="h-10 w-10 text-primary mx-auto mb-2" />
            <h2 className="text-base font-bold text-foreground mb-1">
              {pkg.submission_status === "approved"
                ? "Approved by homeowner"
                : pkg.submission_status === "rejected"
                  ? "Submission declined"
                  : "Work Record Submitted — Pending Homeowner Review"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {pkg.submission_status === "approved"
                ? "The homeowner has added this to their property record."
                : pkg.submission_status === "rejected"
                  ? "The homeowner declined this submission."
                  : "The homeowner will review and add it to their property record."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Submit your completed {isInspector ? "inspection" : "work"} to the homeowner's ComingHomeIQ record. They'll review and approve before it's added.
            </p>

            <Input label="Your Name or Company" value={contractorName} onChange={setContractorName} placeholder="Optional" />

            <Textarea
              label={isInspector ? "Findings Summary *" : "Work Performed *"}
              value={workPerformed}
              onChange={setWorkPerformed}
              placeholder={isInspector ? "Describe what you inspected and any issues found" : "Describe the work you performed"}
              rows={4}
            />

            {isInspector && (
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Deficiency Level *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["minor", "major", "safety"] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setDeficiency(d)}
                      className={`rounded-lg py-2 text-xs font-semibold border ${deficiency === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border"}`}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Parts Replaced</label>
              <div className="flex gap-2 mb-2">
                <input value={partsInput} onChange={(e) => setPartsInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPart(); } }}
                  placeholder="Add a part and press Enter"
                  className="flex-1 rounded-lg border border-border bg-secondary/30 py-2 px-3 text-xs" />
                <button type="button" onClick={addPart} className="rounded-lg bg-secondary px-3 text-xs font-semibold">Add</button>
              </div>
              {parts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {parts.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px]">
                      {p}
                      <button onClick={() => removePart(i)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!isInspector && (
              <>
                <Textarea label="Part Models" value={partModelsInput} onChange={setPartModelsInput} placeholder="One model number per line" rows={2} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Labor Hours" value={laborHours} onChange={setLaborHours} placeholder="e.g. 2.5" type="number" />
                  <Input label="Invoice Amount ($)" value={invoice} onChange={setInvoice} placeholder="Optional" type="number" />
                </div>
              </>
            )}

            <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Optional" rows={3} />

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Photos</label>
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 py-4 cursor-pointer hover:bg-secondary/50">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to add photos</span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
              </label>
              {files.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">{files.length} photo{files.length === 1 ? "" : "s"} ready</p>
              )}
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Submit to Homeowner
            </button>
          </div>
        )
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-foreground font-medium">{value}</p>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <div>
    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm resize-none" />
  </div>
);

export default JobShareScreen;