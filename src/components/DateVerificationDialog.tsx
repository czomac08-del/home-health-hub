import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProperty } from "@/hooks/useActiveProperty";
import { extractExifDate, exifMatchesClaim } from "@/lib/exifDate";
import VerificationBadge, { type VerificationLevel } from "@/components/VerificationBadge";
import { toast } from "sonner";

type EntityType = "maintenance_history" | "inspection_finding" | "fix_verification" | "property_record";
type DocType = "receipt" | "invoice" | "permit" | "work_order" | "photo";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: EntityType;
  entityId: string;
  defaultClaimedDate?: string;
  onSaved?: (level: VerificationLevel) => void;
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string; level: VerificationLevel }[] = [
  { value: "permit",     label: "Permit completion certificate", level: "permit_verified" },
  { value: "receipt",    label: "Receipt",                       level: "receipt_verified" },
  { value: "invoice",    label: "Invoice",                       level: "receipt_verified" },
  { value: "work_order", label: "Contractor work order",         level: "receipt_verified" },
  { value: "photo",      label: "Dated photo (EXIF)",            level: "photo_timestamp" },
];

const DateVerificationDialog = ({ open, onOpenChange, entityType, entityId, defaultClaimedDate, onSaved }: Props) => {
  const { user } = useAuth();
  const { activeProperty } = useActiveProperty();
  const [claimedDate, setClaimedDate] = useState(defaultClaimedDate || new Date().toISOString().slice(0, 10));
  const [docType, setDocType] = useState<DocType>("receipt");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!user || !activeProperty) {
      toast.error("Sign in and select a property first");
      return;
    }
    setBusy(true);
    try {
      let documentUrl: string | null = null;
      let storagePath: string | null = null;
      let exifIso: string | null = null;
      let level: VerificationLevel = "owner_claimed";

      if (file) {
        const path = `${user.id}/${activeProperty.id}/verifications/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("property-records")
          .upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = await supabase.storage
          .from("property-records")
          .createSignedUrl(path, 31536000);
        documentUrl = urlData?.signedUrl ?? null;
        storagePath = path;

        // Determine level from doc type
        const opt = DOC_TYPE_OPTIONS.find((o) => o.value === docType);
        level = opt?.level ?? "owner_claimed";

        // EXIF promotion for photos
        if (docType === "photo") {
          exifIso = await extractExifDate(file);
          if (exifIso && exifMatchesClaim(exifIso, claimedDate)) {
            level = "photo_timestamp";
          } else if (!exifIso) {
            // No EXIF date — fall back to owner-claimed
            level = "owner_claimed";
          }
        }
      }

      const { error: insErr } = await supabase.from("date_verifications").insert({
        user_id: user.id,
        property_id: activeProperty.id,
        entity_type: entityType,
        entity_id: entityId,
        claimed_date: claimedDate,
        verification_level: level,
        document_url: documentUrl,
        document_storage_path: storagePath,
        document_type: file ? docType : null,
        exif_date: exifIso,
        exif_matches_claim: exifIso ? exifMatchesClaim(exifIso, claimedDate) : null,
        notes: notes || null,
      });
      if (insErr) throw insErr;

      toast.success("Date verification saved");
      onSaved?.(level);
      onOpenChange(false);
      // Reset
      setFile(null);
      setNotes("");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  // Preview level so user knows what they'll get
  const previewLevel: VerificationLevel = !file
    ? "owner_claimed"
    : DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.level ?? "owner_claimed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Verify Date
          </DialogTitle>
          <DialogDescription>
            Backfill the date this work was actually completed. Add proof to upgrade your trust badge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="claimed-date" className="text-xs">Date completed</Label>
            <Input
              id="claimed-date"
              type="date"
              value={claimedDate}
              onChange={(e) => setClaimedDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div>
            <Label className="text-xs">Verification document (optional)</Label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <label className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Click to upload (image or PDF)"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <Label htmlFor="ver-notes" className="text-xs">Notes (optional)</Label>
            <Textarea
              id="ver-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Anything else to note about this date or work…"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Trust badge after save:</span>
            <VerificationBadge level={previewLevel} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save verification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateVerificationDialog;