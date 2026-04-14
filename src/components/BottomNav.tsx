import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Grid3X3, Wrench, User, Briefcase } from "lucide-react";
import { useProfileSwitcher } from "@/contexts/ProfileSwitcherContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeAppProfile } = useProfileSwitcher();

  const isBusiness = activeAppProfile?.profile_type === "business";

  const tabs = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(isBusiness ? [{ path: "/portfolio", icon: Briefcase, label: "Portfolio" }] : []),
    { path: "/systems", icon: Grid3X3, label: "Systems" },
    { path: "/guides", icon: Wrench, label: "DIY Guides" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname.startsWith("/system/");
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
