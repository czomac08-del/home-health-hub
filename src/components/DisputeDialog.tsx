import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag, Info } from "lucide-react";
import { fileDispute } from "@/lib/dataTrust";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  fieldPath?: string | null;
  findingId?: string | null;
  propertyRecordId?: string | null;
  inspectorFindingText?: string | null;
  onFiled?: () => void;
}

export function DisputeDialog({
  open,
  onOpenChange,
  propertyId,
  fieldPath,
  findingId,
  propertyRecordId,
  inspectorFindingText,
  onFiled,
}: DisputeDialogProps) {
  const { user } = useAuth();
  const [statement, setStatement] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStatement("");
    setDocName("");
    setDocUrl("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (statement.trim().length < 10) {
      toast.error("Please describe your concern (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    const docs = docName && docUrl ? [{ name: docName, url: docUrl }] : [];
    const res = await fileDispute({
      propertyId,
      userId: user.id,
      fieldPath,
      findingId,
      propertyRecordId,
      inspectorFindingText,
      homeownerStatement: statement.trim(),
      supportingDocuments: docs,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Could not file dispute");
      return;
    }
    toast.success("Dispute filed. The inspector finding remains on record.");
    reset();
    onOpenChange(false);
    onFiled?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-600" />
            Dispute This Finding
          </DialogTitle>
          <DialogDescription>
            Filing a dispute does <strong>not</strong> remove or hide the inspector's finding.
            Both the original finding and your concern will remain visible.
          </DialogDescription>
        </DialogHeader>

        {inspectorFindingText && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <div className="font-medium mb-1">Inspector finding</div>
            <div className="text-muted-foreground">{inspectorFindingText}</div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="dispute-statement">Describe your concern</Label>
            <Textarea
              id="dispute-statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain why you believe this finding is inaccurate or incomplete…"
              rows={5}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="dispute-doc-name">Supporting document name (optional)</Label>
              <Input
                id="dispute-doc-name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g., Contractor assessment"
              />
            </div>
            <div>
              <Label htmlFor="dispute-doc-url">Document URL (optional)</Label>
              <Input
                id="dispute-doc-url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Resolution requires <strong>official documentation</strong> (court order, licensed
              contractor assessment, or signed settlement). Without it, the inspector finding
              stands — licensed inspectors are given professional benefit of the doubt.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Filing…" : "File Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}