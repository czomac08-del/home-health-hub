import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Camera } from "lucide-react";
import { toast } from "sonner";

type Mode = "resolve" | "in_progress";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  finding: { id: string; title: string } | null;
  mode: Mode;
  onSaved: () => void;
}

const RESOLVED_BY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "self", label: "I fixed it myself" },
  { value: "contractor", label: "Hired a contractor" },
  { value: "warranty_claim", label: "Covered by warranty" },
  { value: "not_applicable", label: "Not applicable for my home" },
  { value: "monitoring", label: "Still monitoring" },
];

export default function ResolveFindingDialog({ open, onOpenChange, finding, mode, onSaved }: Props) {
  const [resolvedBy, setResolvedBy] = useState<string>("self");
  const [contractorName, setContractorName] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setResolvedBy("self");
    setContractorName("");
    setCost("");
    setNotes("");
    setPhotoFile(null);
  };

  async function handleSave() {
    if (!finding) return;
    setSaving(true);
    try {
      let after_photo_url: string | null = null;
      if (mode === "resolve" && photoFile) {
        const userRes = await supabase.auth.getUser();
        const uid = userRes.data.user?.id;
        if (uid) {
          const path = `${uid}/${finding.id}-${Date.now()}-${photoFile.name}`;
          const { error: upErr } = await supabase.storage
            .from("fix-verification")
            .upload(path, photoFile, { upsert: false });
          if (!upErr) {
            const { data: signed } = await supabase.storage
              .from("fix-verification")
              .createSignedUrl(path, 60 * 60 * 24 * 365);
            after_photo_url = signed?.signedUrl || path;
          }
        }
      }

      let nextStatus: string;
      if (mode === "in_progress") nextStatus = "in_progress";
      else if (resolvedBy === "monitoring") nextStatus = "monitoring";
      else if (resolvedBy === "not_applicable") nextStatus = "dismissed";
      else nextStatus = "resolved";

      const update: any = { status: nextStatus };
      if (mode === "resolve") {
        update.resolved_at = new Date().toISOString();
        update.resolved_by = resolvedBy;
        update.resolution_notes = notes || null;
        update.resolution_cost = cost ? Number(cost) : null;
        update.contractor_name = resolvedBy === "contractor" ? (contractorName || null) : null;
        if (after_photo_url) update.after_photo_url = after_photo_url;
      } else {
        update.in_progress_notes = notes || null;
      }

      const { error } = await supabase
        .from("inspection_findings")
        .update(update)
        .eq("id", finding.id);
      if (error) throw error;

      toast.success(mode === "resolve" ? "Marked as resolved" : "Marked as in progress");
      try { window.dispatchEvent(new CustomEvent("inspection-findings-updated")); } catch {}
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      console.error("ResolveFindingDialog save failed", e);
      toast.error(e?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "resolve" ? (
              <><CheckCircle2 className="h-4 w-4 text-health-green" /> Mark this issue as resolved?</>
            ) : (
              <>What's happening with this?</>
            )}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{finding?.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "resolve" && (
            <div className="space-y-2">
              <Label>How was it fixed?</Label>
              <Select value={resolvedBy} onValueChange={setResolvedBy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOLVED_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "resolve" && resolvedBy === "contractor" && (
            <div className="space-y-2">
              <Label>Contractor name (optional)</Label>
              <Input value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="e.g. Acme HVAC" />
            </div>
          )}

          {mode === "resolve" && (
            <div className="space-y-2">
              <Label>Approximate cost (optional)</Label>
              <Input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$" />
            </div>
          )}

          <div className="space-y-2">
            <Label>{mode === "resolve" ? "Notes (optional)" : "Notes"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === "in_progress" ? "e.g. Contractor scheduled for June 15" : "Anything worth remembering"}
              rows={3}
            />
          </div>

          {mode === "resolve" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Camera className="h-3.5 w-3.5" /> After photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "resolve" ? "Mark Resolved" : "Save Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}