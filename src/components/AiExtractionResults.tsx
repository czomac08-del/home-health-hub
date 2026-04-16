import { useState } from "react";
import { CheckCircle2, Edit3, Sparkles, AlertTriangle } from "lucide-react";

interface Props {
  extracted: Record<string, any>;
  confidence: string;
  onConfirm: (data: Record<string, any>) => void;
  onEdit: () => void;
}

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

const AiExtractionResults = ({ extracted, confidence, onConfirm, onEdit }: Props) => {
  const [editedData, setEditedData] = useState(extracted);
  const [isEditing, setIsEditing] = useState(false);

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
              <input
                type="text"
                value={String(val)}
                onChange={(e) => setEditedData(prev => ({ ...prev, [key]: e.target.value }))}
                className="text-xs text-foreground font-medium bg-secondary rounded px-2 py-1 w-40 text-right border border-border"
              />
            ) : (
              <span className="text-xs text-foreground font-medium">{String(val)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(editedData)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm these details
        </button>
        <button
          onClick={() => { setIsEditing(!isEditing); onEdit(); }}
          className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
    </div>
  );
};

export default AiExtractionResults;
