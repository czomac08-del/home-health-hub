import { useState } from "react";
import { CheckCircle2, Edit3, Sparkles, AlertTriangle, Lock, Eye, HelpCircle, ChevronDown } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  well_type: "Well Type",
  depth_ft: "Depth (ft)",
  casing_diameter_in: "Casing Diameter (in)",
  casing_material: "Casing Material",
  driller_name: "Driller Name",
  driller_license: "Driller License",
  drill_date: "Drill Date",
  static_water_level_ft: "Static Water Level (ft)",
  pump_gpm: "Pump GPM",
  tank_size_gallons: "Tank Size (gal)",
  tank_material: "Tank Material",
  system_type: "System Type",
  installation_date: "Installation Date",
  contractor_name: "Contractor Name",
  leach_field_size: "Leach Field Size",
  leach_field_type: "Leach Field Type",
  permit_number: "Permit Number",
  permit_type: "Permit Type",
  issue_date: "Issue Date",
  license_number: "License Number",
  work_description: "Work Description",
  inspecting_officer: "Inspecting Officer",
  address: "Address",
};

interface FieldNeedingInput {
  field: string;
  value: any;
  options?: string[];
}

interface Props {
  tier?: 1 | 2 | 3 | 4;
  confirmedFields?: Record<string, any>;
  fieldsNeedingInput?: FieldNeedingInput[];
  overallConfidence?: number;
  documentQuality?: string;
  fieldConfidences?: Record<string, number>;
  onAutoConfirmed?: (data: Record<string, any>) => void;
  onFieldResolved?: (field: string, value: any) => void;
  // Legacy props
  extracted?: Record<string, any>;
  confidence?: string;
  onConfirm?: (data: Record<string, any>) => void;
  onEdit?: () => void;
}

const AiExtractionResults = (props: Props) => {
  const {
    tier, confirmedFields = {}, fieldsNeedingInput = [],
    fieldConfidences = {}, onAutoConfirmed, onFieldResolved,
    extracted, confidence, onConfirm, onEdit,
  } = props;

  const [showLog, setShowLog] = useState(false);
  const [resolvedFields, setResolvedFields] = useState<Record<string, any>>({});
  const [allResolved, setAllResolved] = useState(false);
  const [editedData, setEditedData] = useState(extracted || {});
  const [isEditing, setIsEditing] = useState(false);

  // Legacy mode
  if (tier === undefined) {
    const displayFields = Object.entries(editedData).filter(
      ([key, val]) => val != null && val !== "" && key !== "parse_error" && key !== "raw_text"
    );
    if (displayFields.length === 0) return null;

    return (
      <div className="rounded-xl border border-[hsl(var(--brain-blue))]/30 bg-[hsl(var(--brain-blue))]/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--brain-blue))]" />
          <span className="text-sm font-semibold text-foreground">AI extracted the following from your document:</span>
        </div>
        {confidence === "low" && (
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--health-amber))]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Low confidence — please review carefully
          </div>
        )}
        <div className="space-y-2">
          {displayFields.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">{FIELD_LABELS[key] || key}</span>
              {isEditing ? (
                <input type="text" value={String(val)}
                  onChange={(e) => setEditedData(prev => ({ ...prev, [key]: e.target.value }))}
                  className="text-xs text-foreground font-medium bg-secondary rounded px-2 py-1 w-40 text-right border border-border" />
              ) : (
                <span className="text-xs text-foreground font-medium">{String(val)}</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onConfirm?.(editedData)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm these details
          </button>
          <button onClick={() => { setIsEditing(!isEditing); onEdit?.(); }}
            className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>
    );
  }

  // Tier 1: Silent — show nothing
  if (tier === 1) return null;

  // Tier 2: Summary only
  if (tier === 2) {
    const fieldCount = Object.keys(confirmedFields).length;
    return (
      <div className="rounded-xl border border-[hsl(var(--brain-blue))]/20 bg-[hsl(var(--brain-blue))]/5 p-3">
        <button onClick={() => setShowLog(!showLog)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[hsl(var(--brain-blue))]" />
            <span className="text-xs font-semibold text-foreground">
              {fieldCount} fields auto-added to your profile
            </span>
            <span className="text-[9px] bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-1.5 py-0.5 rounded-full font-medium">
              🔒 AI Verified — tap to review
            </span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showLog ? "rotate-180" : ""}`} />
        </button>
        {showLog && (
          <div className="mt-3 space-y-1.5">
            {Object.entries(confirmedFields).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-1.5">
                <span className="text-[10px] text-muted-foreground">{FIELD_LABELS[key] || key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground font-medium">{String(val)}</span>
                  <span className="text-[9px] text-[hsl(var(--brain-blue))]">{fieldConfidences[key] || "—"}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tier 3: Auto-added with amber badge
  if (tier === 3) {
    const fieldCount = Object.keys(confirmedFields).length;
    return (
      <div className="rounded-xl border border-[hsl(var(--health-amber))]/20 bg-[hsl(var(--health-amber))]/5 p-3">
        <button onClick={() => setShowLog(!showLog)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-[hsl(var(--health-amber))]" />
            <span className="text-xs font-semibold text-foreground">
              {fieldCount} records auto-added
            </span>
            <span className="text-[9px] bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))] px-1.5 py-0.5 rounded-full font-medium">
              ⚠️ Auto-Added — Review Optional
            </span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showLog ? "rotate-180" : ""}`} />
        </button>
        {showLog && (
          <div className="mt-3 space-y-1.5">
            {Object.entries(confirmedFields).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-card/50 px-3 py-1.5">
                <span className="text-[10px] text-muted-foreground">{FIELD_LABELS[key] || key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground font-medium">{String(val)}</span>
                  <span className="text-[9px] text-[hsl(var(--health-amber))]">{fieldConfidences[key] || "—"}%</span>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Glance at these when you have a moment — no action needed
            </p>
          </div>
        )}
      </div>
    );
  }

  // Tier 4: Focused prompts
  const unresolvedFields = fieldsNeedingInput.filter(f => !(f.field in resolvedFields));
  const currentField = unresolvedFields[0];

  if (allResolved || unresolvedFields.length === 0) {
    const allConfirmed = { ...confirmedFields, ...resolvedFields };
    return (
      <div className="rounded-xl border border-[hsl(var(--brain-blue))]/20 bg-[hsl(var(--brain-blue))]/5 p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brain-blue))]" />
          <span className="text-xs font-semibold text-foreground">
            All fields resolved — {Object.keys(allConfirmed).length} records added
          </span>
          <span className="text-[9px] bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-1.5 py-0.5 rounded-full font-medium">
            🔒 AI Verified
          </span>
        </div>
      </div>
    );
  }

  const resolveField = (field: string, value: any) => {
    const newResolved = { ...resolvedFields, [field]: value };
    setResolvedFields(newResolved);
    onFieldResolved?.(field, value);
    if (unresolvedFields.length <= 1) {
      setAllResolved(true);
      onAutoConfirmed?.({ ...confirmedFields, ...newResolved });
    }
  };

  return (
    <div className="space-y-3">
      {Object.keys(confirmedFields).length > 0 && (
        <div className="rounded-xl border border-[hsl(var(--brain-blue))]/20 bg-[hsl(var(--brain-blue))]/5 p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[hsl(var(--brain-blue))]" />
            <span className="text-xs text-foreground">
              {Object.keys(confirmedFields).length} fields auto-added
            </span>
            <span className="text-[9px] bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-1.5 py-0.5 rounded-full font-medium">
              🔒 AI Verified
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Quick Question</span>
          <span className="text-[10px] text-muted-foreground">
            {unresolvedFields.length} remaining
          </span>
        </div>

        <div className="rounded-lg bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">
            We found your record but this field is unclear:
          </p>
          <p className="text-sm font-semibold text-foreground mb-3">
            {FIELD_LABELS[currentField.field] || currentField.field}
            {currentField.value && (
              <span className="text-muted-foreground font-normal">
                {" "}— We read: "{String(currentField.value)}"
              </span>
            )}
          </p>

          {currentField.options && currentField.options.length > 0 ? (
            <div className="space-y-2">
              {currentField.options.map((opt, i) => (
                <button key={i} onClick={() => resolveField(currentField.field, opt)}
                  className="w-full text-left rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors">
                  ○ {opt}
                </button>
              ))}
              <input type="text" placeholder="Enter a different value"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) resolveField(currentField.field, val);
                  }
                }} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input type="text" defaultValue={currentField.value ? String(currentField.value) : ""}
                placeholder={`Enter ${FIELD_LABELS[currentField.field] || currentField.field}`}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground"
                id={`field-input-${currentField.field}`} />
              <button onClick={() => {
                const input = document.getElementById(`field-input-${currentField.field}`) as HTMLInputElement;
                resolveField(currentField.field, input?.value || currentField.value);
              }}
                className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                Confirm →
              </button>
            </div>
          )}
        </div>

        <button onClick={() => resolveField(currentField.field, currentField.value)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default AiExtractionResults;
