import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronLeft, Building2, Hash, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileSwitcher } from "@/contexts/ProfileSwitcherContext";
import { toast } from "sonner";

const CreateProfileScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshAppProfiles, setActiveAppProfileId } = useProfileSwitcher();
  const [businessName, setBusinessName] = useState("");
  const [numProperties, setNumProperties] = useState("");
  const [separateExpenses, setSeparateExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!businessName.trim() || !user) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("app_profiles" as any).insert({
      user_id: user.id,
      profile_name: businessName.trim(),
      profile_type: "business",
      business_name: businessName.trim(),
      separate_expenses: separateExpenses,
    } as any).select().single();
    if (error) {
      toast.error("Failed to create profile");
    } else {
      toast.success("Business profile created!");
      await refreshAppProfiles();
      if (data) setActiveAppProfileId((data as any).id);
      navigate("/dashboard", { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Business Profile</h1>
          <p className="text-sm text-muted-foreground">Manage properties separately from your personal home</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            <Building2 className="h-3 w-3 inline mr-1" /> Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Smith Property Management"
            maxLength={100}
            className="w-full rounded-lg border border-border bg-secondary/50 py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            <Hash className="h-3 w-3 inline mr-1" /> Number of Properties
          </label>
          <select
            value={numProperties}
            onChange={(e) => setNumProperties(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/50 py-3 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select...</option>
            <option value="1-5">1–5 properties</option>
            <option value="6-20">6–20 properties</option>
            <option value="21-50">21–50 properties</option>
            <option value="50+">50+ properties</option>
          </select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-foreground text-sm font-medium">Separate Expenses</p>
              <p className="text-xs text-muted-foreground">Track business and personal costs independently</p>
            </div>
          </div>
          <button
            onClick={() => setSeparateExpenses(!separateExpenses)}
            className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${separateExpenses ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${separateExpenses ? "translate-x-5 bg-primary-foreground" : "bg-muted-foreground"}`} />
          </button>
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting || !businessName.trim()}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {submitting ? "Creating..." : "Create Business Profile"}
        </button>
      </div>
    </div>
  );
};

export default CreateProfileScreen;
