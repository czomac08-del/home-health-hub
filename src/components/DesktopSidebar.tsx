import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Grid3X3, Wrench, User, Settings, Briefcase, Heart, Shield } from "lucide-react";
import { useProfileSwitcher } from "@/contexts/ProfileSwitcherContext";
const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeAppProfile } = useProfileSwitcher();
  const isBusiness = activeAppProfile?.profile_type === "business";

  const tabs = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(isBusiness ? [{ path: "/portfolio", icon: Briefcase, label: "Portfolio" }] : []),
    { path: "/systems", icon: Grid3X3, label: "Systems" },
    { path: "/guides", icon: Wrench, label: "DIY Guides" },
    { path: "/warranties", icon: Shield, label: "Warranties" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/integrations", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname.startsWith("/system/");
    return location.pathname === path;
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="text-base font-logo font-bold text-foreground">
          Coming Home<span className="text-primary font-black">IQ</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary border-l-[3px] border-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-[3px] border-transparent"
              }`}
            >
              <tab.icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">© 2026 ComingHomeIQ. All rights reserved.</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
