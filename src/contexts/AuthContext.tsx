import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { attributeSignupReferral } from "@/lib/referrals";

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
  year_built: string | null;
  square_footage: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
  county_fips?: string | null;
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
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("active_property_id");
  });
  const [loading, setLoading] = useState(true);

  // Persist to localStorage + (debounced) DB whenever the active property changes.
  const setActivePropertyId = (id: string) => {
    setActivePropertyIdState(id);
    try { localStorage.setItem("active_property_id", id); } catch {}
    // Fire-and-forget DB persistence so it follows the user across devices.
    void supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      void supabase.from("profiles").update({ active_property_id: id }).eq("user_id", uid);
    });
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, role, avatar_url, active_property_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      // Restore server-side active property if no local selection yet.
      const serverActiveId = (data as { active_property_id?: string | null }).active_property_id;
      if (serverActiveId && !localStorage.getItem("active_property_id")) {
        setActivePropertyIdState(serverActiveId);
        try { localStorage.setItem("active_property_id", serverActiveId); } catch {}
      }
    }
  };

  const fetchProperties = async (userId: string) => {
    const { data } = await supabase
      .from("properties")
      .select("id, address, label, is_active, health_score, year_built, square_footage, city, state, zip, county, county_fips")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) {
      setProperties(data);
      // Validate stored active id still exists in user's property list.
      const storedId = activePropertyId;
      const stillExists = storedId && data.some((p) => p.id === storedId);
      if (!stillExists && data.length > 0) {
        const fallback = data.find((p) => p.is_active) || data[0];
        setActivePropertyIdState(fallback.id);
        try { localStorage.setItem("active_property_id", fallback.id); } catch {}
      }
    }
  };

  useEffect(() => {
    // 1. Get the initial session — this determines loading state
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Fire-and-forget: don't block loading on data fetches
        void fetchProfile(s.user.id);
        void fetchProperties(s.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes — never block with await
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          void fetchProfile(s.user.id);
          void fetchProperties(s.user.id);
          if (event === "SIGNED_IN") {
            // Dispatch custom event for welcome toast
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("auth:signed_in"));
            }, 300);
            // Attribute any pending referral code to this newly signed-in user.
            // No-op if no code is stored or the user is already attributed.
            void attributeSignupReferral(s.user.id);
          }
        } else {
          setProfile(null);
          setProperties([]);
          setActivePropertyId(null);
        }
        setLoading(false);
      }
    );

    // Listen for property data updates from refresh hook
    const handlePropertyUpdate = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) void fetchProperties(currentSession.user.id);
    };
    window.addEventListener("property-data-updated", handlePropertyUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("property-data-updated", handlePropertyUpdate);
    };
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
