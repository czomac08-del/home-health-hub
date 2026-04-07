import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppProfile {
  id: string;
  user_id: string;
  profile_name: string;
  profile_type: "personal" | "business";
  business_name: string | null;
  separate_expenses: boolean;
}

interface ProfileSwitcherContextType {
  appProfiles: AppProfile[];
  activeAppProfile: AppProfile | null;
  setActiveAppProfileId: (id: string) => void;
  refreshAppProfiles: () => Promise<void>;
  loading: boolean;
}

const ProfileSwitcherContext = createContext<ProfileSwitcherContextType>({
  appProfiles: [],
  activeAppProfile: null,
  setActiveAppProfileId: () => {},
  refreshAppProfiles: async () => {},
  loading: true,
});

export const ProfileSwitcherProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [appProfiles, setAppProfiles] = useState<AppProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    if (!user) { setAppProfiles([]); setLoading(false); return; }
    const { data } = await supabase
      .from("app_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    const profiles = (data || []) as unknown as AppProfile[];
    setAppProfiles(profiles);
    if (!activeId && profiles.length > 0) {
      setActiveId(profiles[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [user]);

  const activeAppProfile = appProfiles.find((p) => p.id === activeId) || appProfiles[0] || null;

  return (
    <ProfileSwitcherContext.Provider value={{
      appProfiles,
      activeAppProfile,
      setActiveAppProfileId: setActiveId,
      refreshAppProfiles: fetchProfiles,
      loading,
    }}>
      {children}
    </ProfileSwitcherContext.Provider>
  );
};

export const useProfileSwitcher = () => useContext(ProfileSwitcherContext);
