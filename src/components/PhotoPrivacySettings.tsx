import { useState } from "react";
import { Shield, Camera, Wrench, MapPin, FileText, AlertTriangle } from "lucide-react";

export type PrivacyLevel = "private" | "shared" | "professional";

export interface PrivacySettings {
  coreInfrastructure: PrivacyLevel;
  appliances: PrivacyLevel;
  exteriorLocation: PrivacyLevel;
  documents: PrivacyLevel;
}

const defaultSettings: PrivacySettings = {
  coreInfrastructure: "private",
  appliances: "private",
  exteriorLocation: "private",
  documents: "private",
};

interface Props {
  settings?: PrivacySettings;
  onChange?: (settings: PrivacySettings) => void;
}

const categories: {
  key: keyof PrivacySettings;
  label: string;
  desc: string;
  icon: typeof Camera;
  warning?: string;
}[] = [
  {
    key: "coreInfrastructure",
    label: "Core Infrastructure Photos",
    desc: "Electrical panel, well, water heater, HVAC, septic",
    icon: Wrench,
  },
  {
    key: "appliances",
    label: "Appliance Photos",
    desc: "Kitchen, laundry, and other appliance images",
    icon: Camera,
  },
  {
    key: "exteriorLocation",
    label: "Exterior & Location Photos",
    desc: "Property exterior, equipment locations, yard",
    icon: MapPin,
    warning: "Location photos may reveal sensitive information about your property. We recommend keeping these Private or Shared only.",
  },
  {
    key: "documents",
    label: "Documents & Manuals",
    desc: "Warranty docs, manuals, receipts, invoices",
    icon: FileText,
  },
];

const options: { value: PrivacyLevel; label: string; desc: string }[] = [
  { value: "private", label: "Private", desc: "Only me" },
  { value: "shared", label: "Shared", desc: "Me and contractors I invite" },
  { value: "professional", label: "Professional", desc: "Me, contractors, and realtors I work with" },
];

const PhotoPrivacySettings = ({ settings: externalSettings, onChange }: Props) => {
  const [localSettings, setLocalSettings] = useState<PrivacySettings>(defaultSettings);
  const settings = externalSettings || localSettings;

  const update = (key: keyof PrivacySettings, value: PrivacyLevel) => {
    const next = { ...settings, [key]: value };
    if (onChange) onChange(next);
    else setLocalSettings(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold text-sm">Photo Privacy Controls</h3>
          <p className="text-xs text-muted-foreground">Control who can see photos of your home systems and utilities.</p>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat.key} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <cat.icon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-foreground text-sm font-medium">{cat.label}</p>
              <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
            </div>
          </div>

          {cat.warning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 mb-3">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/90 leading-relaxed">{cat.warning}</p>
            </div>
          )}

          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                onClick={() => update(cat.key, opt.value)}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  settings[cat.key] === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    settings[cat.key] === opt.value ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {settings[cat.key] === opt.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotoPrivacySettings;
