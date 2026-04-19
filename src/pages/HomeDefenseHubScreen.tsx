import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, Zap, Waves, Flame, Snowflake, ShieldAlert, AlertTriangle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDrought } from "@/hooks/useActiveDrought";
import { parseStateFromAddress } from "@/lib/parseAddress";
import {
  FEDERAL_DROUGHT_RESOURCES,
  getStateDroughtData,
  STATE_DROUGHT_DEFAULT_EXTENSION,
  type Resource,
} from "@/data/droughtResources";
import ResourceCard from "@/components/ResourceCard";
import SEO from "@/components/SEO";

type Threat = "drought" | "power" | "flood" | "wildfire" | "winter";

const THREATS: { key: Threat; label: string; icon: typeof Droplets; live: boolean }[] = [
  { key: "drought", label: "Drought", icon: Droplets, live: true },
  { key: "power", label: "Power & Grid", icon: Zap, live: false },
  { key: "flood", label: "Flooding", icon: Waves, live: false },
  { key: "wildfire", label: "Wildfire", icon: Flame, live: false },
  { key: "winter", label: "Winter & Freeze", icon: Snowflake, live: false },
];

const HomeDefenseHubScreen = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeThreat = (params.get("threat") as Threat) || "drought";
  const { activeProperty } = useAuth();
  const address = activeProperty?.address ?? null;
  const state = useMemo(() => parseStateFromAddress(address), [address]);
  const drought = useActiveDrought(address);
  const stateData = useMemo(() => getStateDroughtData(state), [state]);

  // Build legal-rights cards from state data (drought-specific).
  const stateLegalCards: Resource[] = useMemo(() => {
    if (!stateData || !state) return [];
    return [
      {
        id: "rainwater",
        title: `${state} — Rainwater Harvesting (${stateData.rainwaterHarvesting.legal})`,
        what: stateData.rainwaterHarvesting.notes,
        qualifies: ["Homeowner", "Landowner"],
        cost: "$0",
        url: stateData.rainwaterHarvesting.sourceUrl,
        badge: "Legal Right",
      },
      {
        id: "graywater",
        title: `${state} — Gray Water Reuse (${stateData.grayWaterReuse.legal})`,
        what: stateData.grayWaterReuse.notes,
        qualifies: ["Homeowner"],
        cost: "$0",
        url: stateData.grayWaterReuse.sourceUrl,
        badge: "Legal Right",
      },
      {
        id: "shutoff",
        title: stateData.shutoffProtection.protected
          ? `${state} — Utility Shutoff Protection (Active)`
          : `${state} — Utility Shutoff Rules`,
        what: stateData.shutoffProtection.notes,
        qualifies: ["Homeowner", "Renter"],
        cost: "$0",
        url: stateData.shutoffProtection.sourceUrl,
        badge: "Legal Right",
      },
    ];
  }, [stateData, state]);

  const stateProgramCard = stateData?.stateProgram ?? null;

  const setThreat = (t: Threat) => {
    const next = new URLSearchParams(params);
    next.set("threat", t);
    setParams(next, { replace: true });
  };

  return (
    <>
      <SEO
        title="Home Defense Hub — ComingHomeIQ"
        description="Real, legal, actionable resources for homeowners and landowners — verified federal, state, and utility programs sourced only from official .gov links."
        path="/home-defense"
      />
      <div className="min-h-screen pb-24 lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-6 lg:pt-10">
          {/* Header */}
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-start gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-black text-2xl lg:text-3xl text-foreground">Home Defense Hub</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Real programs and rights you actually qualify for. No ads, no fluff — every link points to an official .gov or utility page.
              </p>
            </div>
          </div>

          {/* Active condition banner */}
          {drought.isActive && activeThreat === "drought" && (
            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-foreground">{drought.description}</span>
                <span className="text-muted-foreground"> detected in your county{drought.fipsCode ? ` (FIPS ${drought.fipsCode})` : ""}. The programs below apply right now.</span>
              </div>
            </div>
          )}

          {/* Threat tabs */}
          <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Threat categories">
            {THREATS.map((t) => {
              const Icon = t.icon;
              const active = activeThreat === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setThreat(t.key)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {!t.live && <span className="text-[10px] uppercase tracking-wider opacity-70">soon</span>}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          {activeThreat === "drought" ? (
            <div className="mt-6 space-y-8">
              {/* Federal */}
              <section>
                <h2 className="font-heading font-bold text-lg text-foreground mb-3">Federal Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FEDERAL_DROUGHT_RESOURCES.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              </section>

              {/* State legal rights + program */}
              <section>
                <h2 className="font-heading font-bold text-lg text-foreground mb-1">
                  {state ? `${state} — State Programs & Legal Rights` : "State Programs & Legal Rights"}
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Sourced from each state's official environmental, health, and utility commission websites.
                </p>

                {!state && (
                  <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                    Add a property address to see state-specific programs and legal rights.
                  </div>
                )}

                {state && !stateData && (
                  <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                    No current programs found for {state} — check back or contact your county extension office.
                  </div>
                )}

                {stateData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stateProgramCard && <ResourceCard resource={stateProgramCard} />}
                    {stateLegalCards.map((r) => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                )}
              </section>

              {/* Cooperative Extension */}
              <section>
                <h2 className="font-heading font-bold text-lg text-foreground mb-3">Local Expertise</h2>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-heading font-bold text-base text-foreground">
                    {state ? `${state} Cooperative Extension` : "USDA Cooperative Extension"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Free, county-level expert advice on wells, septic, drought-tolerant landscaping, and water conservation.
                  </p>
                  <a
                    href={stateData?.extensionUrl ?? STATE_DROUGHT_DEFAULT_EXTENSION}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Find your county extension office
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </section>

              {/* Honest disclaimer */}
              <p className="text-xs text-muted-foreground text-center pt-2">
                ComingHomeIQ does not administer these programs. Eligibility, funding, and rules can change — always confirm details on the official source page.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
              <h2 className="font-heading font-bold text-lg text-foreground">Coming soon</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                We only ship verified data. {THREATS.find((t) => t.key === activeThreat)?.label} resources are being sourced from official agencies and will appear here once cross-checked.
              </p>
              <button
                onClick={() => setThreat("drought")}
                className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                View Drought programs
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomeDefenseHubScreen;
