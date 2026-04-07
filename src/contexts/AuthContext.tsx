import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string;
  email: string;
  role: "homeowner" | "realtor" | "inspector" | "contractor";
  avatar_url: string | null;
}

interface Property {
  id: string;
  address: string;
  label: string;
  is_active: boolean;
  health_score: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  properties: Property[];
  activeProperty: Property | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshProperties: () => Promise<void>;
  setActivePropertyId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  properties: [],
  activeProperty: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshProperties: async () => {},
  setActivePropertyId: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, role, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const fetchProperties = async (userId: string) => {
    const { data } = await supabase
      .from("properties")
      .select("id, address, label, is_active, health_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) {
      setProperties(data);
      if (!activePropertyId && data.length > 0) {
        const active = data.find((p) => p.is_active) || data[0];
        setActivePropertyId(active.id);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          await fetchProperties(session.user.id);
        } else {
          setProfile(null);
          setProperties([]);
          setActivePropertyId(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchProperties(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setProperties([]);
    setActivePropertyId(null);
  };

  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        properties,
        activeProperty,
        loading,
        signOut,
        refreshProfile: async () => { if (user) await fetchProfile(user.id); },
        refreshProperties: async () => { if (user) await fetchProperties(user.id); },
        setActivePropertyId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
