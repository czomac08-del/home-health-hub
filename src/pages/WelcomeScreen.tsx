import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GEOCODE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`;

interface AddressSuggestion {
  matchedAddress: string;
  coordinates: { x: number; y: number };
}

const WelcomeScreen = () => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [verified, setVerified] = useState(false);
  const [searching, setSearching] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    setAddress(s.matchedAddress);
    setVerified(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleContinue = async () => {
    if (!address.trim() || !user) return;
    setLoading(true);

    let finalAddress = address.trim();

    // If not yet verified, try geocoding with a 3s timeout — never block navigation
    if (!verified && !verifyFailed) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `${GEOCODE_URL}?address=${encodeURIComponent(finalAddress)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        const data = await res.json();
        const matches = data?.matches || [];
        if (matches.length > 0) {
          finalAddress = matches[0].matchedAddress;
          setAddress(finalAddress);
        }
      } catch {
        // Timeout or error — proceed with user-entered address
      }
    }

    // Save property and navigate — always within a few seconds
    try {
      if (properties.length === 0) {
        await supabase.from("properties").insert({
          user_id: user.id,
          address: finalAddress,
          label: "Primary Residence",
          is_active: true,
        });
        await refreshProperties();
      }
    } catch {
      // Don't block navigation on DB errors either
    }

    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Home Passport</h1>
        </div>

        <p className="text-muted-foreground text-lg text-center">
          Welcome, {profile?.full_name?.split(" ")[0] || "there"}! Let&apos;s set up your home.
        </p>

        <div className="w-full relative" ref={wrapperRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
          )}
          {verified && !searching && (
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
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
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

        <button
          onClick={handleContinue}
          disabled={!address.trim() || loading}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Setting up..." : verifyFailed ? "Use This Address Anyway" : "Scan My Home"}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
