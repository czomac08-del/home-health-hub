import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEV_EMAIL = "czomac08@gmail.com";

// Order matters: child rows first, parents last.
const DELETE_STEPS: Array<{ table: string; column?: string }> = [
  { table: "system_photos" },
  { table: "system_documents" },
  { table: "system_details" },
  { table: "maintenance_history" },
  { table: "verification_events" },
  { table: "property_timeline_events" },
  { table: "property_records", column: "uploaded_by_user_id" },
  // record_sources is a global reference table — skip (no user_id column)
  { table: "inspections" },
  { table: "insurance_claims" },
  { table: "insurance_documents" },
  { table: "insurance_policies" },
  { table: "warranties" },
  { table: "household_profiles" },
  { table: "refresh_logs" },
  { table: "permanent_archive" },
  { table: "properties" },
  { table: "app_profiles" },
];

const DevResetButton = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProperties } = useAuth();
  const [resetting, setResetting] = useState(false);

  const email = profile?.email || user?.email;
  if (email?.toLowerCase() !== DEV_EMAIL) return null;

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);

    for (const step of DELETE_STEPS) {
      const col = step.column ?? "user_id";
      const { error } = await supabase.from(step.table as never).delete().eq(col, user.id);
      if (error) {
        toast.error(`Failed deleting ${step.table}: ${error.message}`);
        setResetting(false);
        return;
      }
    }

    // Reset profile fields that exist on the profiles table.
    // (onboarding_complete / home_iq_score columns don't exist — skipping.)
    // Nothing to null on profiles per current schema, so we skip that update.

    await refreshProperties();
    toast.success("Account wiped. Restarting onboarding…");
    setResetting(false);
    navigate("/onboarding");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={resetting}
          className="w-full rounded-xl border border-destructive/40 bg-destructive/10 py-3.5 font-semibold text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          {resetting ? "Resetting…" : "Reset for Testing (Dev)"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all property data?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all property data, systems, records, and onboarding progress for your account.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={resetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DevResetButton;
