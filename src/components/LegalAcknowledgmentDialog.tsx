import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export const ACKNOWLEDGMENT_TEXT =
  "By submitting this information, you confirm that you are the property owner or an authorized representative, and that this information is accurate to the best of your knowledge. ComingHomeIQ stores this record as owner-provided and does not independently verify its accuracy. This record will be associated with this property address permanently, including after any future sale or transfer.";

interface Props {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
  propertyId: string;
  recordType: string;
}

const LegalAcknowledgmentDialog = ({ open, onClose, onAccepted, propertyId, recordType }: Props) => {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    setChecking(true);
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) { setChecking(false); return; }
      const { data } = await supabase
        .from("acknowledgment_log" as never)
        .select("id")
        .eq("user_id", u.user.id)
        .eq("property_id", propertyId)
        .eq("record_type", recordType)
        .maybeSingle();
      if (data) { onAccepted(); onClose(); }
      else setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, propertyId, recordType]);

  const handleAccept = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (u?.user?.id) {
      await supabase.from("acknowledgment_log" as never).insert({
        user_id: u.user.id,
        property_id: propertyId,
        record_type: recordType,
        acknowledgment_text: ACKNOWLEDGMENT_TEXT,
      } as never);
    }
    setSaving(false);
    onAccepted();
    onClose();
  };

  if (checking) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm before saving</DialogTitle>
          <DialogDescription className="pt-3 text-foreground leading-relaxed">
            {ACKNOWLEDGMENT_TEXT}
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} className="mt-0.5" />
          <span className="text-sm">I understand and confirm</span>
        </label>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAccept} disabled={!confirmed || saving}>
            {saving ? "Saving…" : "Save Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalAcknowledgmentDialog;