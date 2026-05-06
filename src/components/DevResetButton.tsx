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
// Tables without a user_id column (record_sources, drought_cache) are skipped — they're global reference tables.
const DELETE_STEPS: Array<{ table: string; column?: string }> = [
  { table: "system_photos" },
  { table: "system_documents" },
  { table: "system_details" },
  { table: "maintenance_history" },
  { table: "verification_events" },
  { table: "property_timeline_events" },
  { table: "property_records", column: "uploaded_by_user_id" },
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

    const failed: string[] = [];

    for (const step of DELETE_STEPS) {
      const col = step.column ?? "user_id";
      const { error } = await supabase.from(step.table as never).delete().eq(col, user.id);
      if (error) {
        console.error(`[DevReset] Failed deleting ${step.table}:`, error.message);
        failed.push(step.table);
      }
    }

    // Reset profile-level fields. Note: profiles table currently has no
    // onboarding_complete / address / home_iq_score columns in this schema,
    // so there's nothing to null out on profiles itself. Onboarding restart
    // is driven by the absence of properties.
    await refreshProperties();

    if (failed.length === 0) {
      toast.success("Reset complete. Starting fresh.");
    } else {
      toast.error(
        `Reset complete with errors: ${failed.join(", ")}. Check foreign key constraints on these tables.`,
      );
    }

    setTimeout(() => {
      setResetting(false);
      navigate("/onboarding");
    }, 1500);
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
          <AlertDialogTitle>Reset Test Account</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all property data, systems, records, warranties, insurance,
            documents, and onboarding progress for your account. Your login, subscription, and user
            role will not be affected. This cannot be undone.
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
