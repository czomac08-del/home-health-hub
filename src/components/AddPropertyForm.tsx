import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Loader2, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GEOCODE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`;
const RENTCAST_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rentcast-lookup`;

interface AddressMatch {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  county?: string | null;
  countyFips?: string | null;
  state?: string | null;
  stateFips?: string | null;
}

function parseMatched(matched: string) {
  const parts = matched.split(",").map((s) => s.trim()).filter(Boolean);
  const street = parts[0] || "";
  const city = parts[1] || "";
  let state = "", zip = "";
  const tail = parts.slice(2).join(" ");
  const m = tail.match(/\b([A-Z]{2})\b\s*(\d{5}(?:-\d{4})?)?/);
  if (m) { state = m[1]; zip = m[2] || ""; }
  return { street, city, state, zip };
}

const PROPERTY_TYPES = [
  { id: "primary", label: "Primary Residence" },
  { id: "investment", label: "Investment" },
  { id: "rental", label: "Rental" },
  { id: "vacation", label: "Vacation" },
  { id: "land", label: "Land Only" },
];

interface Props {
  /** Show the optional nickname + property type fields. Default true. */
  showExtras?: boolean;
  /** Called after the property is saved successfully. */
  onSaved?: (propertyId: string) => void;
  /** CTA label override. */
  submitLabel?: string;
}

/**
 * Reusable address-capture form. Used on the dashboard empty state and
 * inside the PropertySelector "Add Property" slide-over panel.
 */
const AddPropertyForm = ({ showExtras = true, onSaved, submitLabel = "Add Property" }: Props) => {
  const { user, refreshProperties, setActivePropertyId } = useAuth();
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressMatch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<AddressMatch | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [propertyType, setPropertyType] = useState("primary");
  const [saving, setSaving] = useState(false);
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

  const fetchSuggestions = async (q: string) => {
    if (q.trim().length < 4) { setSuggestions([]); return; }
    setSearching(true);
    setGeocodeError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("not authenticated");
      const res = await fetch(`${GEOCODE_URL}?address=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await res.json();
      const matches: AddressMatch[] = payload?.matches || [];
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      if (matches.length === 0) {
        setGeocodeError("We couldn't find that address. Try including your city and state, or check for typos.");
      }
    } catch {
      setSuggestions([]);
      setGeocodeError("We couldn't find that address. Try including your city and state, or check for typos.");
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (v: string) => {
    setAddressInput(v);
    setSelectedMatch(null);
    setGeocodeError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 400);
  };

  const selectAddress = (m: AddressMatch) => {
    setSelectedMatch(m);
    setAddressInput(m.matchedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const submit = async () => {
    if (!user || !selectedMatch) return;
    setSaving(true);
    try {
      const { city, state, zip } = parseMatched(selectedMatch.matchedAddress);
      const typeLabel = PROPERTY_TYPES.find((t) => t.id === propertyType)?.label || "Primary Residence";
      const insertRow: Record<string, unknown> = {
        user_id: user.id,
        address: selectedMatch.matchedAddress,
        label: nickname.trim() || typeLabel,
        is_active: true,
        city: city || null,
        state: selectedMatch.state || state || null,
        zip: zip || null,
        county: selectedMatch.county || null,
        county_fips: selectedMatch.countyFips || null,
        property_type: propertyType,
      };
      const { data, error } = await supabase
        .from("properties")
        .insert(insertRow as never)
        .select("id")
        .single();
      if (error) throw error;
      const newId = (data as { id: string }).id;
      await refreshProperties();
      setActivePropertyId(newId);

      // Fire background scan (best-effort)
      void (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return;
          await fetch(`${RENTCAST_URL}?address=${encodeURIComponent(selectedMatch.matchedAddress)}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        } catch { /* silent */ }
      })();

      toast.success("Property added!");
      onSaved?.(newId);
    } catch (e) {
      toast.error("Could not save your property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative" ref={wrapperRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        {searching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
        )}
        {selectedMatch && !searching && (
          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
        )}
        <input
          type="text"
          value={addressInput}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Start typing your address..."
          className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{s.matchedAddress}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMatch && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-semibold text-primary">Address verified</p>
            {selectedMatch.county && (
              <p className="text-muted-foreground mt-0.5">
                {selectedMatch.county}{selectedMatch.state ? `, ${selectedMatch.state}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {geocodeError && !selectedMatch && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{geocodeError}</p>
        </div>
      )}

      {showExtras && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nickname (optional)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Primary Residence, Lake House, Rental Property"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Property type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPropertyType(t.id)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm transition-all text-left flex items-center gap-2 ${
                    propertyType === t.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Home className={`h-4 w-4 shrink-0 ${propertyType === t.id ? "text-primary" : ""}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={submit}
        disabled={!selectedMatch || saving}
        className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : submitLabel}
      </button>
    </div>
  );
};

export default AddPropertyForm;