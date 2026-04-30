import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, EyeOff, Flag } from "lucide-react";
import {
  hideVaultRecord,
  LEGAL_HOLD_DELETE_MESSAGE,
} from "@/lib/recordVault";
import { useState } from "react";
import { toast } from "sonner";

interface LegalHoldDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId?: string | null;
  onHidden?: () => void;
  onDispute?: () => void;
}

/**
 * Shown whenever a homeowner attempts to delete a vaulted property record.
 * Explains the legal hold and offers Hide / Dispute as the only options.
 */
export function LegalHoldDeleteDialog({
  open,
  onOpenChange,
  vaultId,
  onHidden,
  onDispute,
}: LegalHoldDeleteDialogProps) {
  const [hiding, setHiding] = useState(false);

  const handleHide = async () => {
    if (!vaultId) {
      toast.info("This record will be hidden from your view.");
      onHidden?.();
      onOpenChange(false);
      return;
    }
    setHiding(true);
    const { ok, error } = await hideVaultRecord(vaultId);
    setHiding(false);
    if (!ok) {
      toast.error(error?.message ?? "Could not hide this record.");
      return;
    }
    toast.success("Record hidden from your view. It remains in the legal archive.");
    onHidden?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>This record is under legal hold</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            {LEGAL_HOLD_DELETE_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleHide}
            disabled={hiding}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Hide from my view
          </Button>
          {onDispute && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onDispute();
                onOpenChange(false);
              }}
            >
              <Flag className="mr-2 h-4 w-4" />
              Flag as disputed
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}