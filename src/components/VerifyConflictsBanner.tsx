import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import VerifyConflictsModal from "./VerifyConflictsModal";

const VerifyConflictsBanner = () => {
  const { activeProperty } = useAuth();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeProperty?.id) { setCount(0); return; }
    const { count: c } = await supabase
      .from("system_pending_verifications" as any)
      .select("id", { count: "exact", head: true })
      .eq("property_id", activeProperty.id)
      .is("resolved_at", null);
    setCount(c ?? 0);
  }, [activeProperty?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (count === 0 || !activeProperty?.id) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left hover:bg-amber-500/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-500/20 p-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {count} {count === 1 ? "value needs" : "values need"} verification
            </div>
            <div className="text-xs text-muted-foreground">Different sources gave different answers — pick which is right.</div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      <VerifyConflictsModal
        open={open}
        onClose={() => setOpen(false)}
        propertyId={activeProperty.id}
        onResolved={refresh}
      />
    </>
  );
};

export default VerifyConflictsBanner;