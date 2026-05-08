import { useState } from "react";
import { Droplets, CircleDot, Plus, Trash2 } from "lucide-react";
import { UtilityContactCard } from "./WaterSourceSelector";

interface SewerSelectorProps {
  onSelect: (type: "city" | "septic") => void;
  selected?: string;
}

export const SewerTypeSelector = ({ onSelect, selected }: SewerSelectorProps) => {
  const dimUnselected = (type: "city" | "septic") => !!selected && selected !== type;
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <h2 className="text-lg font-bold text-foreground">What is your sewer / waste system?</h2>
      <p className="text-xs text-muted-foreground">Select your primary waste system type. The non-applicable option will be greyed out.</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect("city")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            selected === "city" ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40"
          } ${dimUnselected("city") ? "opacity-40" : ""}`}
        >
          <Droplets className={`h-10 w-10 ${selected === "city" ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm font-semibold ${selected === "city" ? "text-foreground" : "text-muted-foreground"}`}>City / Municipal Sewer</span>
          {dimUnselected("city") && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Not applicable</span>}
        </button>
        <button
          onClick={() => onSelect("septic")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            selected === "septic" ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40"
          } ${dimUnselected("septic") ? "opacity-40" : ""}`}
        >
          <CircleDot className={`h-10 w-10 ${selected === "septic" ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm font-semibold ${selected === "septic" ? "text-foreground" : "text-muted-foreground"}`}>Septic System</span>
          {dimUnselected("septic") && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Not applicable</span>}
        </button>
      </div>
    </div>
  );
};

export interface SepticSystem {
  name: string;
  tankSize: string;
  tankMaterial: string;
  lastPumped: string;
  accessLocation: string;
  pumpCompany: string;
  pumpPhone: string;
  location: string;
  notes: string;
}

const emptySeptic: SepticSystem = {
  name: "", tankSize: "", tankMaterial: "", lastPumped: "",
  accessLocation: "", pumpCompany: "", pumpPhone: "", location: "", notes: "",
};

export const MultipleSepticSystems = ({ systems, onChange }: {
  systems: SepticSystem[];
  onChange: (systems: SepticSystem[]) => void;
}) => {
  const count = systems.length || 1;

  const setCount = (n: number) => {
    if (n > systems.length) {
      const newSystems = [...systems];
      for (let i = systems.length; i < n; i++) {
        newSystems.push({ ...emptySeptic, name: `Septic System ${i + 1}` });
      }
      onChange(newSystems);
    } else {
      onChange(systems.slice(0, n));
    }
  };

  const updateSystem = (index: number, field: keyof SepticSystem, value: string) => {
    const updated = [...systems];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSystem = (index: number) => {
    if (systems.length <= 1) return;
    onChange(systems.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold text-foreground">How many septic systems?</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                count === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              {n}
            </button>
          ))}
          <button onClick={() => setCount(count + 1)}
            className="h-8 px-2 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            More
          </button>
        </div>
      </div>

      {systems.map((sys, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <input
              type="text"
              value={sys.name}
              onChange={(e) => updateSystem(i, "name", e.target.value)}
              placeholder={`Septic System ${i + 1}`}
              className="text-sm font-semibold text-primary bg-transparent border-none focus:outline-none placeholder:text-primary/50"
            />
            {systems.length > 1 && (
              <button onClick={() => removeSystem(i)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {[
            { key: "location" as const, label: "Tank Location", placeholder: "e.g. 15ft north of back deck" },
            { key: "tankSize" as const, label: "Tank Size (gallons)", placeholder: "e.g. 1000" },
            { key: "tankMaterial" as const, label: "Tank Material", placeholder: "Concrete, Fiberglass, Plastic" },
            { key: "lastPumped" as const, label: "Last Pumped Date", placeholder: "MM/YYYY" },
            { key: "accessLocation" as const, label: "Access / Lid Location", placeholder: "How to find the access point" },
            { key: "pumpCompany" as const, label: "Pump Out Company", placeholder: "Company name" },
            { key: "pumpPhone" as const, label: "Company Phone", placeholder: "(555) 555-5555" },
          ].map(field => (
            <div key={field.key} className="mb-2">
              <label className="text-xs text-muted-foreground">{field.label}</label>
              <input
                type="text"
                value={sys[field.key]}
                onChange={(e) => updateSystem(i, field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}
          <div className="mb-2">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea
              value={sys.notes}
              onChange={(e) => updateSystem(i, "notes", e.target.value)}
              placeholder="Additional context about this system..."
              rows={2}
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export { UtilityContactCard };
