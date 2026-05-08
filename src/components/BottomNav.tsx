import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Grid3X3, FileText, User, Briefcase, ShieldAlert } from "lucide-react";
import { useProfileSwitcher } from "@/contexts/ProfileSwitcherContext";
import { useRole } from "@/contexts/RoleContext";

const ROLE_HOME: Record<string, string> = {
  realtor: "/realtor",
  inspector: "/inspector",
  contractor: "/contractor",
  investor: "/investor",
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeAppProfile } = useProfileSwitcher();
  const { role } = useRole();

  const isBusiness = activeAppProfile?.profile_type === "business";
  const dashPath = ROLE_HOME[role] || "/dashboard";

  const tabs = [
    { path: dashPath, icon: LayoutDashboard, label: "Dashboard" },
    ...(isBusiness ? [{ path: "/portfolio", icon: Briefcase, label: "Portfolio" }] : []),
    { path: "/systems", icon: Grid3X3, label: "Systems" },
    { path: "/home-defense", icon: ShieldAlert, label: "Defense" },
    { path: "/documents", icon: FileText, label: "Docs" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === dashPath) {
      return (
        location.pathname === dashPath ||
        location.pathname === "/dashboard" ||
        location.pathname.startsWith("/system/") ||
        Object.values(ROLE_HOME).includes(location.pathname)
      );
    }
    return location.pathname === path;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 px-2 py-2 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                />
              )}
              <tab.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
