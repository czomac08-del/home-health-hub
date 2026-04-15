import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2, CheckCircle2, Heart, BadgeCheck, Home, BedDouble, Bath, Ruler, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const GEOCODE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`;
const RENTCAST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rentcast-lookup`;

interface AddressSuggestion {
  matchedAddress: string;
  coordinates: { x: number; y: number };
}

interface RentCastData {
  found: boolean;
  yearBuilt?: number | null;
  squareFootage?: number | null;
  lotSize?: number | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  estimatedValue?: number | null;
  formattedAddress?: string | null;
}

const WelcomeScreen = () => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searching, setSearching] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [propertyData, setPropertyData] = useState<RentCastData | null>(null);
  const [fetchingProperty, setFetchingProperty] = useState(false);
  const navigate = useNavigate();
  const { user, profile, properties, refreshProperties } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchRentCastData = async (addr: string) => {
    setFetchingProperty(true);
    try {
      const res = await fetch(`${RENTCAST_URL}?address=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data: RentCastData = await res.json();
        if (data.found) {
          setPropertyData(data);
        } else {
          setPropertyData(null);
        }
      } else {
        setPropertyData(null);
      }
    } catch {
      setPropertyData(null);
    } finally {
      setFetchingProperty(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${GEOCODE_URL}?address=${encodeURIComponent(query)}`);
      const data = await res.json();
      const matches = data?.matches || [];
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setAddress(value);
    setVerified(false);
    setVerifyFailed(false);
    setPropertyData(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    setAddress(s.matchedAddress);
    setVerified(true);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchRentCastData(s.matchedAddress);
  };

  const handleContinue = () => {
    if (!address.trim()) return;
    setLoading(true);

    const finalAddress = address.trim();

    if (user && properties.length === 0) {
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        address: finalAddress,
        label: "Primary Residence",
        is_active: true,
      };
      if (propertyData?.yearBuilt) insertData.year_built = String(propertyData.yearBuilt);
      if (propertyData?.squareFootage) insertData.square_footage = String(propertyData.squareFootage);

      supabase.from("properties").insert(insertData as any).then(() => { void refreshProperties(); });
    }

    // Store property data in sessionStorage so onboarding can use it
    if (propertyData) {
      sessionStorage.setItem("rentcast_data", JSON.stringify(propertyData));
    }

    navigate(user ? "/scanning" : "/auth");
  };

  const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString() : null;
  const fmtCurrency = (n: number | null | undefined) => n != null ? `$${n.toLocaleString()}` : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-logo font-bold text-foreground tracking-tight">
            Coming Home<span className="text-primary font-black">IQ</span>
          </h1>
        </div>

        <p className="text-muted-foreground text-lg text-center">
          Welcome to ComingHomeIQ, {profile?.full_name?.split(" ")[0] || "there"}! Let&apos;s build your home&apos;s complete IQ in about 5 minutes.
        </p>

        <div className="w-full relative" ref={wrapperRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          {(searching || fetchingProperty) && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
          )}
          {verified && !searching && !fetchingProperty && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
          )}
          <input
            type="text"
            placeholder="Enter your home address..."
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{s.matchedAddress}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {verified && (
          <p className="text-xs text-primary flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Address verified
          </p>
        )}

        {verifyFailed && (
          <p className="text-xs text-muted-foreground text-center">
            We couldn&apos;t verify this address automatically. You can still proceed — just double-check it&apos;s correct.
          </p>
        )}

        {/* RentCast Property Data Card */}
        {fetchingProperty && (
          <div className="w-full rounded-xl border border-border bg-card p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Looking up property data...</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-muted" />)}
            </div>
          </div>
        )}

        {propertyData && propertyData.found && !fetchingProperty && (
          <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Property Data Verified ✓</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {propertyData.yearBuilt && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Year Built</p>
                    <p className="text-sm font-semibold text-foreground">{propertyData.yearBuilt}</p>
                  </div>
                </div>
              )}
              {propertyData.squareFootage && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <Ruler className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sq Ft</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(propertyData.squareFootage)}</p>
                  </div>
                </div>
              )}
              {propertyData.bedrooms && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bedrooms</p>
                    <p className="text-sm font-semibold text-foreground">{propertyData.bedrooms}</p>
                  </div>
                </div>
              )}
              {propertyData.bathrooms && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <Bath className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bathrooms</p>
                    <p className="text-sm font-semibold text-foreground">{propertyData.bathrooms}</p>
                  </div>
                </div>
              )}
              {propertyData.propertyType && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{propertyData.propertyType.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              )}
              {propertyData.estimatedValue && (
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                  <span className="text-muted-foreground shrink-0 text-sm font-bold">$</span>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Value</p>
                    <p className="text-sm font-semibold text-foreground">{fmtCurrency(propertyData.estimatedValue)}</p>
                  </div>
                </div>
              )}
            </div>
            {propertyData.lotSize && (
              <p className="text-xs text-muted-foreground mt-2">Lot size: {fmt(propertyData.lotSize)} sq ft</p>
            )}
          </div>
        )}

        {verified && !fetchingProperty && !propertyData && (
          <p className="text-xs text-muted-foreground text-center">
            No property records found — you&apos;ll enter details manually during setup.
          </p>
        )}

        <button
          onClick={handleContinue}
          disabled={!address.trim() || loading}
          className="w-full rounded-xl bg-primary py-4 font-heading font-extrabold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed glow-orange"
        >
          {loading ? "Setting up..." : verifyFailed ? "Use This Address Anyway" : "Scan My Home"}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
