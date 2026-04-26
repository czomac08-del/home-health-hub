import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Policy = {
  id: string;
  insurance_company: string | null;
  policy_number: string | null;
  coverage_end: string | null;
  agent_name: string | null;
  policy_type: string;
};

const maskPolicyNumber = (n: string | null) => {
  if (!n) return null;
  const last = n.slice(-4);
  return `••••${last}`;
};

const DashboardInsuranceCard = () => {
  const navigate = useNavigate();
  const { user, activeProperty } = useAuth();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !activeProperty?.id) { setLoaded(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("insurance_policies")
        .select("id, insurance_company, policy_number, coverage_end, agent_name, policy_type")
        .eq("property_id", activeProperty.id)
        .eq("user_id", user.id)
        .order("policy_type", { ascending: true });
      if (cancelled) return;
      const primary = (data || []).find((p) => p.policy_type === "primary") || (data || [])[0] || null;
      setPolicy(primary as Policy | null);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, activeProperty?.id]);

  if (!loaded) return null;

  // No policy on file
  if (!policy) {
    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-heading font-bold text-sm">Home Insurance — Not on File</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your policy info so it's at your fingertips when something happens.
              </p>
              <button
                onClick={() => navigate("/insurance?add=manual")}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> Add Policy Info →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Policy on file
  const daysUntil = policy.coverage_end
    ? Math.ceil((new Date(policy.coverage_end).getTime() - Date.now()) / 86400000)
    : null;
  const expiresSoon = daysUntil !== null && daysUntil <= 30 && daysUntil >= 0;

  return (
    <div className="mb-6">
      <button
        onClick={() => navigate("/insurance")}
        className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-foreground font-heading font-bold text-sm truncate">
                {policy.insurance_company || "Home Insurance"}
              </p>
              {expiresSoon && (
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider bg-orange/15 text-orange px-2 py-0.5 rounded-full">
                  Expires Soon
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              {policy.policy_number && (
                <div className="truncate">
                  <span className="text-muted-foreground">Policy:</span>{" "}
                  <span className="text-foreground font-mono">{maskPolicyNumber(policy.policy_number)}</span>
                </div>
              )}
              {policy.coverage_end && (
                <div className="truncate">
                  <span className="text-muted-foreground">Expires:</span>{" "}
                  <span className="text-foreground">{new Date(policy.coverage_end).toLocaleDateString()}</span>
                </div>
              )}
              {policy.agent_name && (
                <div className="truncate col-span-2">
                  <span className="text-muted-foreground">Agent:</span>{" "}
                  <span className="text-foreground">{policy.agent_name}</span>
                </div>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-heading font-bold text-primary">
              View Full Policy <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default DashboardInsuranceCard;