import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, Briefcase, ClipboardList, Wrench } from "lucide-react";
import { useRole, type UserRole } from "@/contexts/RoleContext";

const roleCards: { key: UserRole; icon: typeof Home; title: string; desc: string }[] = [
  { key: "homeowner", icon: Home, title: "Homeowner", desc: "Manage and protect your home" },
  { key: "realtor", icon: Briefcase, title: "Realtor", desc: "Add value to your listings" },
  { key: "inspector", icon: ClipboardList, title: "Home Inspector", desc: "Streamline your inspections" },
  { key: "contractor", icon: Wrench, title: "Pro Contractor", desc: "Arrive prepared to every job" },
];

const WelcomeScreen = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const { role, setRole } = useRole();

  const handleContinue = () => {
    if (role === "homeowner" && !address.trim()) return;
    const dest: Record<UserRole, string> = {
      homeowner: "/scanning",
      realtor: "/realtor",
      inspector: "/inspector",
      contractor: "/contractor",
    };
    navigate(dest[role]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center glow-teal">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Home Passport</h1>
        </div>

        <p className="text-muted-foreground text-lg text-center">Your Home's Digital Passport</p>

        {/* Role Selector */}
        <div className="w-full">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Sign in as</p>
          <div className="grid grid-cols-2 gap-2">
            {roleCards.map((r) => {
              const active = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}
                >
                  <r.icon className={`h-5 w-5 mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{r.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Address input only for homeowner */}
        {role === "homeowner" && (
          <div className="w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter your home address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={role === "homeowner" && !address.trim()}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed glow-teal-strong"
        >
          {role === "homeowner" ? "Scan My Home" : `Continue as ${roleCards.find((r) => r.key === role)?.title}`}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
