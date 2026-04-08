import { useState } from "react";
import { Wifi, ChevronRight, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  logo: string;
  description: string;
  dataShared: string[];
  connected: boolean;
  lastSynced?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "resideo",
    name: "Resideo / Honeywell Home",
    logo: "🏠",
    description: "Connect your thermostat to see real temperature, humidity, and filter life data.",
    dataShared: ["Current temperature & humidity", "Filter life remaining %", "Heating/cooling runtime", "Energy usage estimates"],
    connected: false,
  },
  {
    id: "nest",
    name: "Google Nest",
    logo: "🔵",
    description: "Connect Nest thermostat for temperature, humidity, and energy data.",
    dataShared: ["Current temperature & humidity", "Energy history", "Schedule & eco mode status"],
    connected: false,
  },
  {
    id: "ecobee",
    name: "Ecobee",
    logo: "🟢",
    description: "Connect Ecobee thermostat for home comfort data.",
    dataShared: ["Temperature & humidity by room", "Occupancy data", "Filter reminders"],
    connected: false,
  },
  {
    id: "ring",
    name: "Ring",
    logo: "🔔",
    description: "Connect Ring for security system status.",
    dataShared: ["Alarm status", "Device battery levels", "Motion activity summary"],
    connected: false,
  },
  {
    id: "simplisafe",
    name: "SimpliSafe",
    logo: "🛡️",
    description: "Connect SimpliSafe for security monitoring.",
    dataShared: ["System armed/disarmed status", "Sensor status", "Alert history"],
    connected: false,
  },
];

export const SmartHomeIntegrations = () => {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    toast.info("Smart home integrations will be available soon! We're working on connecting with popular platforms.");
    // Future: OAuth flow
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false, lastSynced: undefined } : i));
    toast.success("Disconnected");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-2">
        <p className="text-xs text-foreground font-medium flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          Connecting your smart devices gives Home Passport real data instead of estimates — making your health score more accurate.
        </p>
      </div>

      {integrations.map(integ => (
        <div key={integ.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <button onClick={() => setExpanded(expanded === integ.id ? null : integ.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left">
            <span className="text-2xl">{integ.logo}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{integ.name}</p>
              <div className="flex items-center gap-2">
                {integ.connected ? (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Not connected</span>
                )}
                {integ.lastSynced && (
                  <span className="text-[10px] text-muted-foreground">Last synced: {integ.lastSynced}</span>
                )}
              </div>
            </div>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded === integ.id ? "rotate-90" : ""}`} />
          </button>

          <div className={`transition-all duration-300 ease-out ${expanded === integ.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <p className="text-xs text-muted-foreground">{integ.description}</p>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Data shared with Home Passport:</p>
                <div className="space-y-1">
                  {integ.dataShared.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-xs text-foreground">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              {integ.connected ? (
                <button onClick={() => handleDisconnect(integ.id)}
                  className="w-full rounded-lg border border-destructive/30 text-destructive py-2 text-xs font-medium hover:bg-destructive/5 transition-colors flex items-center justify-center gap-1.5">
                  <X className="h-3 w-3" /> Disconnect
                </button>
              ) : (
                <button onClick={() => handleConnect(integ.id)}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                  <ExternalLink className="h-3 w-3" /> Connect {integ.name}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
