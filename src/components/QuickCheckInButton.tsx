import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuickCheckInButtonProps {
  systemName: string;
}

const QuickCheckInButton = ({ systemName }: QuickCheckInButtonProps) => {
  const { user, activeProperty } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCheckIn = async () => {
    if (!user || !activeProperty || saving) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("maintenance_history").insert({
      user_id: user.id,
      property_id: activeProperty.id,
      system_name: systemName,
      action: "Confirmed working — routine check-in",
      performed_date: today,
      performed_by: "Homeowner",
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save check-in");
    } else {
      setSaved(true);
      toast.success(`${systemName} check-in logged!`);
      setTimeout(() => setSaved(false), 5000);
    }
  };

  return (
    <button
      onClick={handleCheckIn}
      disabled={saving || saved}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        saved
          ? "border-health-green/30 bg-health-green/10 text-health-green"
          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      {saved ? "Logged ✓" : "Still working fine ✓"}
    </button>
  );
};

export default QuickCheckInButton;
