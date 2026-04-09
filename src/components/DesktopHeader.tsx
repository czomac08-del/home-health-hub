import { Bell, Home, ChevronDown } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const DesktopHeader = () => {
  const { properties, activeProperty, setActivePropertyId } = useAuth();
  const [showSwitcher, setShowSwitcher] = useState(false);

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-card sticky top-0 z-30">
      {/* Left — hidden on desktop since sidebar has logo */}
      <div className="w-40" />

      {/* Center — property switcher */}
      <div className="relative">
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <Home className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{activeProperty?.label || "My Home"}</span>
          <span className="text-muted-foreground text-xs hidden xl:inline">— {activeProperty?.address || "No property"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
        {showSwitcher && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 rounded-xl border border-border bg-card shadow-lg py-1 z-50 min-w-[240px]">
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => { setActivePropertyId(p.id); setShowSwitcher(false); }}
                className={`w-full px-4 py-2.5 text-sm hover:bg-secondary text-left ${p.id === activeProperty?.id ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {p.label} — {p.address}
              </button>
            ))}
            {properties.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground italic">No properties yet</p>
            )}
          </div>
        )}
      </div>

      {/* Right — notifications + profile */}
      <div className="flex items-center gap-3 w-40 justify-end">
        <PrivacyBadge />
        <button className="relative h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <ProfileSwitcher />
      </div>
    </header>
  );
};

export default DesktopHeader;
