import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Briefcase, Plus, ChevronDown, Check, User } from "lucide-react";
import { useProfileSwitcher, type AppProfile } from "@/contexts/ProfileSwitcherContext";
import { useAuth } from "@/contexts/AuthContext";

const ProfileSwitcher = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { appProfiles, activeAppProfile, setActiveAppProfileId } = useProfileSwitcher();
  const { profile } = useAuth();

  const displayName = activeAppProfile?.profile_type === "business"
    ? activeAppProfile.business_name || activeAppProfile.profile_name
    : profile?.full_name?.split(" ")[0] || "Personal";

  const handleSwitch = (p: AppProfile) => {
    setActiveAppProfileId(p.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-8 rounded-full bg-secondary px-3 hover:bg-secondary/80 transition-colors"
      >
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          {activeAppProfile?.profile_type === "business" ? (
            <Briefcase className="h-3 w-3 text-primary" />
          ) : (
            <User className="h-3 w-3 text-primary" />
          )}
        </div>
        <span className="text-xs font-medium text-foreground max-w-[80px] truncate">{displayName}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-scale-in">
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Switch Profile</p>
            </div>
            {appProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwitch(p)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  p.id === activeAppProfile?.id ? "bg-primary/20" : "bg-secondary"
                }`}>
                  {p.profile_type === "business" ? (
                    <Briefcase className="h-4 w-4 text-primary" />
                  ) : (
                    <Home className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.profile_type === "business" ? p.business_name || p.profile_name : p.profile_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">{p.profile_type}</p>
                </div>
                {p.id === activeAppProfile?.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); navigate("/create-profile"); }}
              className="w-full flex items-center gap-3 px-3 py-3 border-t border-border/50 text-primary hover:bg-secondary/30 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Add Profile</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSwitcher;
