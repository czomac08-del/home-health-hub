import { useEffect, useState } from "react";
import { HousePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import StructuresZonesSection from "@/components/StructuresZonesSection";
import { useAuth } from "@/contexts/AuthContext";

const AdditionalStructuresBanner = () => {
  const { activeProperty, refreshProperties } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Re-evaluate when the active property changes
  useEffect(() => { setDismissed(false); }, [activeProperty?.id]);

  if (!activeProperty?.id) return null;
  const ap = activeProperty as any;
  if (!ap.has_additional_structures) return null;
  if (ap.additional_structures_banner_dismissed_at || dismissed) return null;

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      await supabase
        .from("properties")
        .update({ additional_structures_banner_dismissed_at: new Date().toISOString() } as any)
        .eq("id", activeProperty.id);
      refreshProperties?.();
    } catch {
      // best-effort
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
      >
        <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
          <HousePlus className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Finish setting up your property</div>
          <div className="text-xs text-muted-foreground">Add additional structures and systems.</div>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label="Dismiss"
          onClick={handleDismiss}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDismiss(e as any); }}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a Structure</DialogTitle>
          </DialogHeader>
          <StructuresZonesSection propertyId={activeProperty.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdditionalStructuresBanner;