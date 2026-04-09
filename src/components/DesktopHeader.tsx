import { Bell, Home, ChevronDown, User, Settings, HelpCircle, LogOut, ArrowLeftRight } from "lucide-react";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DesktopHeader = () => {
  const { user, profile, properties, activeProperty, setActivePropertyId, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const firstName = profile?.full_name?.split(" ")[0] || "User";

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate("/");
  };

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-card sticky top-0 z-30">
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

      {/* Right */}
      <div className="flex items-center gap-3 w-40 justify-end">
        <PrivacyBadge />
        <button className="relative h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {initials}
              </div>
              {/* Green online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <span className="text-sm font-medium text-foreground hidden xl:inline">{firstName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden xl:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
              {[
                { icon: User, label: "My Profile", action: () => navigate("/profile") },
                { icon: ArrowLeftRight, label: "Switch Property", action: () => { setShowUserMenu(false); setShowSwitcher(true); } },
                { icon: Settings, label: "Account Settings", action: () => navigate("/integrations") },
                { icon: HelpCircle, label: "Help & Support", action: () => navigate("/feedback") },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setShowUserMenu(false); item.action(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border mt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
