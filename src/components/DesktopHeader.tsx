import { ChevronDown, User, Settings, HelpCircle, LogOut, ArrowLeftRight, Plus, Heart } from "lucide-react";
import PrivacyBadge from "@/components/PrivacyBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropertySelector from "@/components/PropertySelector";
import CreditBalancePill from "@/components/CreditBalancePill";

const DesktopHeader = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
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
    <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-[hsl(var(--bg-secondary))] sticky top-0 z-30">
      <div className="flex items-center gap-2 w-40">
        <Heart className="h-5 w-5 text-primary fill-primary" />
        <span className="text-sm font-logo font-bold text-foreground hidden xl:inline">Coming Home<span className="text-primary font-black">IQ</span></span>
        <span className="text-sm font-logo font-black text-primary xl:hidden">CHIQ</span>
      </div>

      {/* Center — property switcher */}
      <div className="relative flex-1 min-w-0 max-w-md mx-4">
        <PropertySelector variant="pill" className="flex justify-center" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 w-40 justify-end">
        <ThemeToggle />
        <CreditBalancePill />
        <button
          onClick={() => navigate("/system-config/new")}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-heading font-extrabold hover:opacity-90 transition-opacity glow-orange"
        >
          <Plus className="h-3.5 w-3.5" /> Add System
        </button>
        <PrivacyBadge />

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-heading font-bold">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
            </div>
            <span className="text-sm font-medium text-foreground hidden xl:inline">{firstName}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden xl:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-heading font-bold text-foreground">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
              {[
                { icon: User, label: "My Profile", action: () => navigate("/profile") },
              { icon: ArrowLeftRight, label: "Add Property", action: () => navigate("/onboarding") },
                { icon: Settings, label: "Account Settings", action: () => navigate("/integrations") },
                { icon: HelpCircle, label: "Help & Support", action: () => navigate("/feedback") },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { setShowUserMenu(false); item.action(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border mt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-muted transition-colors"
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
