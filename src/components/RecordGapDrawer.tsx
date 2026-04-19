import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Upload, Mail, PencilLine, XCircle, Copy, CheckCircle2, Loader2, ShieldAlert, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { STATE_NAMES } from "@/data/stateData";

export type GapStatus = "not_found" | "digitization_gap" | "owner_provided" | "verified" | "not_applicable";

export interface GapRecord {
  subcategory: string;
  category: string;
  safety_critical: boolean;
  typical_digitization_year: number | null;
  digitization_notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: GapRecord | null;
  propertyId: string;
  yearBuilt?: string;
  state?: string;
  county?: string;
  countyFips?: string;
  initialStatus: GapStatus;
  onStatusChange: (subcategory: string, status: GapStatus) => void;
}

type Tab = "overview" | "upload" | "request" | "manual" | "dismiss";

const STATUS_LABELS: Record<GapStatus, { label: string; tone: string }> = {
  not_found: { label: "Not Found", tone: "bg-muted text-muted-foreground" },
  digitization_gap: { label: "Digitization Gap", tone: "bg-amber-500/15 text-amber-400" },
  owner_provided: { label: "Owner Provided", tone: "bg-teal-500/15 text-teal-400" },
  verified: { label: "Verified", tone: "bg-health-green/15 text-health-green" },
  not_applicable: { label: "Not Applicable", tone: "bg-secondary text-muted-foreground" },
};

const buildExplanation = (rt: GapRecord): string => {
  const name = rt.subcategory;
  return `A ${name.toLowerCase()} is an official record that documents the existence, scope, or condition of this part of your property. It serves as legal and historical proof for owners, inspectors, insurers, and future buyers.`;
};

const buildWhyItMatters = (rt: GapRecord, ctx: { yearBuilt?: string; stateName: string; cutoff: number | null }): string[] => {
  const lines: string[] = [];
  if (rt.safety_critical) {
    lines.push(`This is a safety-critical record. Missing documentation for ${rt.subcategory.toLowerCase()} could affect your family's safety and may impact insurance coverage or claims.`);
  }
  if (ctx.cutoff && ctx.yearBuilt && parseInt(ctx.yearBuilt) < ctx.cutoff) {
    lines.push(`Records for ${ctx.stateName || "your state"} before ${ctx.cutoff} were not digitized. This does not mean the record doesn't exist — it means you may need to request it in person or by mail from your county.`);
  }
  if (ctx.yearBuilt) {
    lines.push(`Your home was built in ${ctx.yearBuilt}. Documenting this record strengthens your home's complete history for future sale, refinance, or insurance review.`);
  } else {
    lines.push(`Documenting this record strengthens your home's complete history for future sale, refinance, or insurance review.`);
  }
  return lines;
};

const buildLetterTemplate = (rt: GapRecord, ctx: { address: string; agencyName: string; agencyAddress: string }): string => {
  const today = new Date().toLocaleDateString();
  return `${today}

${ctx.agencyName}
${ctx.agencyAddress}

RE: Public Records Request — ${rt.subcategory}
Property Address: ${ctx.address}

To Whom It May Concern,

Pursuant to my state's public records law, I am requesting copies of all available records relating to "${rt.subcategory}" for the property listed above. This may include permits, applications, inspection reports, certificates, plans, or any related documentation on file.

If records are stored only on microfilm or paper, please advise on the procedure and any associated copy fees. If you require additional information to locate these records (parcel ID, prior owner names, etc.), please contact me at the address below.

Thank you for your time and assistance.

Sincerely,

[Your Name]
[Your Mailing Address]
[Phone / Email]
`;
};

const RecordGapDrawer = ({
  open,
  onOpenChange,
  record,
  propertyId,
  yearBuilt,
  state,
  county,
  countyFips,
  initialStatus,
  onStatusChange,
}: Props) => {
  const { user, activeProperty } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<GapStatus>(initialStatus);
  const [agency, setAgency] = useState<{ name: string; email: string | null; phone: string | null; address: string | null; portal: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Manual entry form
  const [mDate, setMDate] = useState("");
  const [mRef, setMRef] = useState("");
  const [mContractor, setMContractor] = useState("");
  const [mNotes, setMNotes] = useState("");

  // Dismiss form
  const [dismissReason, setDismissReason] = useState("");

  const stateAbbr = (state || "").toUpperCase();
  const stateName = STATE_NAMES[stateAbbr] || stateAbbr;

  useEffect(() => {
    setStatus(initialStatus);
    setTab("overview");
    setMDate(""); setMRef(""); setMContractor(""); setMNotes(""); setDismissReason("");
  }, [record?.subcategory, initialStatus]);

  // Look up county agency
  useEffect(() => {
    if (!open || !record) return;
    const q = supabase.from("county_agencies").select("agency_name, email, phone, mailing_address, records_portal_url").limit(1);
    const promise = countyFips ? q.eq("county_fips", countyFips) : (county && stateAbbr ? q.eq("county_name", county).eq("state", stateAbbr) : q);
    promise.then(({ data }) => {
      const row = data?.[0];
      if (row) {
        setAgency({
          name: row.agency_name,
          email: row.email,
          phone: row.phone,
          address: row.mailing_address,
          portal: row.records_portal_url,
        });
      } else {
        setAgency(null);
      }
    });
  }, [open, record?.subcategory, countyFips, county, stateAbbr]);

  if (!record) return null;

  const cutoff = record.typical_digitization_year;
  const whyLines = buildWhyItMatters(record, { yearBuilt, stateName, cutoff });
  const agencyName = agency?.name || (county ? `${county} County Records Office` : `${stateName || "State"} County Records Office`);
  const agencyAddress = agency?.address || "[County mailing address — look up at your county website]";
  const letter = buildLetterTemplate(record, {
    address: activeProperty?.address || "[Your Property Address]",
    agencyName,
    agencyAddress,
  });

  const logVerificationEvent = async (result: string, notes: string, source_type = "owner") => {
    if (!user) return false;
    const { error } = await supabase.from("verification_events").insert({
      user_id: user.id,
      property_id: propertyId,
      field_path: `record_type.${record.category}.${record.subcategory}`,
      field_value: record.subcategory,
      result,
      source_type,
      source_name: source_type === "owner" ? "Homeowner" : agencyName,
      source_weight: source_type === "owner" ? "self_reported" : "official",
      source_priority: source_type === "owner" ? 5 : 1,
      evidence_notes: notes,
    });
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleManualSave = async () => {
    if (!user) return;
    setSubmitting(true);
    const summary = [
      mDate && `Date: ${mDate}`,
      mRef && `Reference: ${mRef}`,
      mContractor && `Contractor: ${mContractor}`,
      mNotes && `Notes: ${mNotes}`,
    ].filter(Boolean).join(" | ");

    if (!summary) {
      toast({ title: "Add at least one detail", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Save to property_records as owner_provided
    const { error } = await supabase.from("property_records").insert({
      property_id: propertyId,
      uploaded_by_user_id: user.id,
      system_type: record.category,
      record_type: record.subcategory,
      source: "owner_provided",
      notes: summary,
      document_date: mDate || null,
    });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    await logVerificationEvent("owner_provided", `Owner-provided details for ${record.subcategory}: ${summary}`);
    setStatus("owner_provided");
    onStatusChange(record.subcategory, "owner_provided");
    toast({ title: "Saved", description: `Marked "${record.subcategory}" as owner-provided.` });
    setSubmitting(false);
    setTab("overview");
  };

  const handleDismiss = async () => {
    if (!dismissReason.trim()) {
      toast({ title: "Reason required", description: "Briefly explain why this doesn't apply.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await logVerificationEvent("not_applicable", `Marked N/A: ${dismissReason}`, "owner");
    if (ok) {
      setStatus("not_applicable");
      onStatusChange(record.subcategory, "not_applicable");
      toast({ title: "Dismissed", description: `Removed "${record.subcategory}" from gap count.` });
      setTab("overview");
    }
    setSubmitting(false);
  };

  const handleCopyLetter = async () => {
    await navigator.clipboard.writeText(letter);
    toast({ title: "Letter copied", description: "Paste into email or print." });
  };

  const handleUploadNav = () => {
    navigate(`/documents?recordType=${encodeURIComponent(record.subcategory)}&category=${encodeURIComponent(record.category)}`);
    onOpenChange(false);
  };

  const statusMeta = STATUS_LABELS[status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Safety banner */}
        {record.safety_critical && (
          <div className="bg-destructive/10 border-b border-destructive/30 px-5 py-3 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-medium">
              This is a safety-critical record. Missing documentation could affect your family's safety and your insurance coverage.
            </p>
          </div>
        )}

        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base">{record.subcategory}</SheetTitle>
              <SheetDescription className="text-xs">
                {record.category.replace(/_/g, " ")}
              </SheetDescription>
            </div>
            <Badge className={`shrink-0 ${statusMeta.tone} border-0 text-[10px]`}>{statusMeta.label}</Badge>
          </div>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-5">
          {tab === "overview" && (
            <>
              {/* What is this */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">What is this?</h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{buildExplanation(record)}</p>
              </section>

              {/* Why it matters */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Why it matters for your home</h4>
                <div className="space-y-2">
                  {whyLines.map((line, i) => (
                    <p key={i} className="text-sm text-foreground/85 leading-relaxed">{line}</p>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">What you can do</h4>
                <div className="space-y-2">
                  <ActionButton icon={<Upload className="h-4 w-4" />} label="Upload a Document" onClick={handleUploadNav} />
                  <ActionButton icon={<Mail className="h-4 w-4" />} label="Request This Record" onClick={() => setTab("request")} />
                  <ActionButton icon={<PencilLine className="h-4 w-4" />} label="Add What You Know" onClick={() => setTab("manual")} />
                  <ActionButton icon={<XCircle className="h-4 w-4" />} label="Mark as Not Applicable" onClick={() => setTab("dismiss")} variant="ghost" />
                </div>
              </section>
            </>
          )}

          {tab === "request" && (
            <section className="space-y-4">
              <BackLink onClick={() => setTab("overview")} />
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> {agencyName}
                </div>
                {agency?.address && <p className="text-muted-foreground">{agency.address}</p>}
                {agency?.email && <p className="text-muted-foreground">Email: {agency.email}</p>}
                {agency?.phone && <p className="text-muted-foreground">Phone: {agency.phone}</p>}
                {agency?.portal && (
                  <a href={agency.portal} target="_blank" rel="noopener noreferrer" className="text-primary underline block">Online portal →</a>
                )}
                {!agency && (
                  <p className="text-muted-foreground italic">Specific agency lookup unavailable. Use the template below and search "{county || stateName} county records request" online.</p>
                )}
              </div>

              <div>
                <Label className="text-xs">Pre-written request letter</Label>
                <Textarea value={letter} readOnly rows={14} className="mt-1.5 text-xs font-mono" />
                <Button onClick={handleCopyLetter} variant="outline" size="sm" className="mt-2 w-full">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Letter
                </Button>
              </div>
            </section>
          )}

          {tab === "manual" && (
            <section className="space-y-3">
              <BackLink onClick={() => setTab("overview")} />
              <p className="text-xs text-muted-foreground">Enter whatever you know. Even partial info helps build your home's record.</p>
              <div className="space-y-2.5">
                <div>
                  <Label htmlFor="mDate" className="text-xs">Date (if known)</Label>
                  <Input id="mDate" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="mRef" className="text-xs">Permit / reference number</Label>
                  <Input id="mRef" value={mRef} onChange={(e) => setMRef(e.target.value)} placeholder="e.g. 2018-04421" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="mContractor" className="text-xs">Contractor or company</Label>
                  <Input id="mContractor" value={mContractor} onChange={(e) => setMContractor(e.target.value)} placeholder="e.g. Smith Plumbing" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="mNotes" className="text-xs">Notes</Label>
                  <Textarea id="mNotes" value={mNotes} onChange={(e) => setMNotes(e.target.value)} rows={3} className="mt-1" placeholder="Anything else you remember…" />
                </div>
              </div>
              <Button onClick={handleManualSave} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </section>
          )}

          {tab === "dismiss" && (
            <section className="space-y-3">
              <BackLink onClick={() => setTab("overview")} />
              <p className="text-xs text-muted-foreground">Mark this record as not applicable to your property.</p>
              <div>
                <Label htmlFor="dReason" className="text-xs">Reason</Label>
                <Textarea
                  id="dReason"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder='e.g. "City water — no well on property"'
                />
              </div>
              <Button onClick={handleDismiss} disabled={submitting} variant="destructive" className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Not Applicable"}
              </Button>
            </section>
          )}

          {/* Status footer */}
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current status</span>
            <Badge className={`${statusMeta.tone} border-0`}>
              {status === "owner_provided" || status === "verified" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : status === "digitization_gap" ? (
                <AlertTriangle className="h-3 w-3 mr-1" />
              ) : null}
              {statusMeta.label}
            </Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ActionButton = ({ icon, label, onClick, variant = "outline" }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: "outline" | "ghost" }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
      variant === "ghost"
        ? "text-muted-foreground hover:bg-secondary/40"
        : "border border-border bg-secondary/20 hover:bg-secondary/40 text-foreground"
    }`}
  >
    <span className="text-primary">{icon}</span>
    <span className="flex-1">{label}</span>
  </button>
);

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
    ← Back
  </button>
);

export default RecordGapDrawer;
