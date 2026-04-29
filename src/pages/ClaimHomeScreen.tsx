import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Check, Shield, Star, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const includedSystems = [
  { name: "HVAC", health: 92, lastService: "Mar 2024" },
  { name: "Well / Water Source", health: 85, lastService: "Jan 2024" },
  { name: "Electrical Panel", health: 65, lastService: "Nov 2023" },
  { name: "Plumbing", health: 78, lastService: "Jan 2024" },
  { name: "Roof", health: 55, lastService: "Sep 2023" },
  { name: "Water Heater", health: 70, lastService: "Jun 2023" },
];

const ClaimHomeScreen = () => {
  const navigate = useNavigate();
  const { activeProperty } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [newAppliances, setNewAppliances] = useState<string[]>([]);
  const [verifyFirst, setVerifyFirst] = useState("");

  const applianceOptions = ["Refrigerator", "Washer", "Dryer", "Dishwasher", "Microwave", "Stove/Oven"];

  if (claimed) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-1">New Owner Setup</h1>
        <p className="text-xs text-muted-foreground mb-6">Let's customize your new ComingHomeIQ profile.</p>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What appliances did you bring?</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {applianceOptions.map((a) => {
                const selected = newAppliances.includes(a);
                return (
                  <button key={a} onClick={() => setNewAppliances((p) => selected ? p.filter((x) => x !== a) : [...p, a])}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"}`}>
                    {selected && <Check className="h-3 w-3 inline mr-1" />}{a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What would you like to verify first?</h2>
          <div className="space-y-1.5">
            {["HVAC System", "Electrical Panel", "Roof Condition", "Plumbing", "Water Heater"].map((item) => (
              <button key={item} onClick={() => setVerifyFirst(item)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${verifyFirst === item ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-foreground hover:bg-secondary/30"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { toast.success("Your ComingHomeIQ profile is ready!"); navigate("/dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
          Complete Setup <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Home className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Claim Your Home</h1>
        <p className="text-sm text-muted-foreground">A ComingHomeIQ profile has been prepared for you</p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6">
        <p className="text-lg font-bold text-foreground mb-0.5">{activeProperty?.address || "Your Home"}</p>
        {activeProperty?.year_built && (
          <p className="text-xs text-muted-foreground mb-3">Built {activeProperty.year_built}</p>
        )}

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">78%</span>
            <span className="text-xs text-muted-foreground">Health Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-semibold text-foreground">4.2</span>
            <span className="text-xs text-muted-foreground">Seller Rating</span>
          </div>
        </div>

        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Included in Passport ({includedSystems.length} systems)</h3>
        <div className="space-y-1.5 mb-4">
          {includedSystems.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${s.health >= 70 ? "text-health-green" : s.health >= 60 ? "text-health-amber" : "text-health-red"}`}>{s.health}%</span>
                <span className="text-muted-foreground">· {s.lastService}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Also Included</h3>
          <p className="text-xs text-muted-foreground">Warranties, permits, service records, owner's manuals, seller's welcome note</p>
        </div>
      </div>

      <button onClick={() => setClaimed(true)}
        className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
        <Check className="h-5 w-5" /> Claim This Home
      </button>
    </div>
  );
};

export default ClaimHomeScreen;
