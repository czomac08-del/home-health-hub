import { useState } from "react";
import { Droplets, Waves, Plus, ChevronRight, Trash2 } from "lucide-react";
import { additionalWaterSourceTypes, utilityContactFields } from "@/data/propertyTypes";

interface WaterSourceSelectorProps {
  onSelect: (type: "city" | "well") => void;
  selected?: string;
}

export const WaterSourceTypeSelector = ({ onSelect, selected }: WaterSourceSelectorProps) => (
  <div className="flex flex-col gap-4 animate-fade-in">
    <h2 className="text-lg font-bold text-foreground">What is your water source?</h2>
    <p className="text-xs text-muted-foreground">Select your primary water source to see relevant fields.</p>
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onSelect("city")}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
          selected === "city" ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <Droplets className={`h-10 w-10 ${selected === "city" ? "text-primary" : "text-muted-foreground"}`} />
        <span className={`text-sm font-semibold ${selected === "city" ? "text-foreground" : "text-muted-foreground"}`}>City / Municipal Water</span>
      </button>
      <button
        onClick={() => onSelect("well")}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
          selected === "well" ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <Waves className={`h-10 w-10 ${selected === "well" ? "text-primary" : "text-muted-foreground"}`} />
        <span className={`text-sm font-semibold ${selected === "well" ? "text-foreground" : "text-muted-foreground"}`}>Well Water</span>
      </button>
    </div>
  </div>
);

interface AdditionalWaterSource {
  type: string;
  location: string;
  pumpDetails: string;
  serviceContact: string;
}

export const AdditionalWaterSources = ({ sources, onChange }: {
  sources: AdditionalWaterSource[];
  onChange: (sources: AdditionalWaterSource[]) => void;
}) => {
  const [showAdd, setShowAdd] = useState(false);

  const addSource = (type: string) => {
    onChange([...sources, { type, location: "", pumpDetails: "", serviceContact: "" }]);
    setShowAdd(false);
  };

  const updateSource = (index: number, field: keyof AdditionalWaterSource, value: string) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSource = (index: number) => {
    onChange(sources.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">Additional Water Sources</h3>
      {sources.map((source, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-primary">{source.type}</span>
            <button onClick={() => removeSource(i)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {[
            { key: "location" as const, label: "Location", placeholder: "Where on property" },
            { key: "pumpDetails" as const, label: "Pump Details", placeholder: "Type, HP, brand" },
            { key: "serviceContact" as const, label: "Service Contact", placeholder: "Name & phone" },
          ].map(field => (
            <div key={field.key} className="mb-2">
              <label className="text-xs text-muted-foreground">{field.label}</label>
              <input
                type="text"
                value={source[field.key]}
                onChange={(e) => updateSource(i, field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}
        </div>
      ))}
      {showAdd ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Select type:</p>
          {additionalWaterSourceTypes.map(t => (
            <button key={t.id} onClick={() => addSource(t.label)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-sm text-foreground transition-colors flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-primary" /> {t.label}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full rounded-xl border border-dashed border-border bg-card/50 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
          <Plus className="h-4 w-4" /> Add Water Source
        </button>
      )}
    </div>
  );
};

export const UtilityContactCard = ({ title, values, onChange }: {
  title: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) => (
  <div className="rounded-xl border border-border bg-card p-4 mt-4">
    <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
    {utilityContactFields.map(field => (
      <div key={field.key} className="mb-2">
        <label className="text-xs text-muted-foreground">{field.label}</label>
        <input
          type="text"
          value={values[field.key] || ""}
          onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
          placeholder={field.placeholder || ""}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    ))}
  </div>
);
