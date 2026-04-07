import { useState, useRef } from "react";
import { Camera, AlertTriangle, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shared sub-components ───

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-1">{children}</h4>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring appearance-none">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PhotoSlot({ label, preview, onUpload }: { label: string; preview: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-[120px]">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <button onClick={() => ref.current?.click()}
        className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
        {preview ? <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
    </div>
  );
}

function EmergencyField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl border-2 border-health-amber/40 bg-health-amber/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Navigation className="h-4 w-4 text-health-amber" />
        <h4 className="text-sm font-semibold text-health-amber">How to Find This in an Emergency</h4>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">Write plain-language directions for someone who has never been in this house.</p>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        placeholder="e.g. Go to the east side of the house. Look for the small wooden door in the foundation..."
        className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
    </div>
  );
}

function MapSketchSlot({ preview, onUpload }: { preview: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <label className="text-xs text-muted-foreground">Location Map Sketch</label>
      </div>
      <button onClick={() => ref.current?.click()}
        className="w-full aspect-[16/9] rounded-lg border-2 border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center gap-1 overflow-hidden hover:border-primary/50 transition-colors">
        {preview ? <img src={preview} alt="Map sketch" className="w-full h-full object-contain rounded-lg" /> : (
          <>
            <MapPin className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload sketch or floor plan</span>
          </>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
    </div>
  );
}

function filePreview(file: File, setter: (v: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => setter(e.target?.result as string);
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════
// ELECTRICAL PANEL LOCATION
// ════════════════════════════════════════
const PANEL_LOCATION_TYPES = ["Inside House", "Exterior Wall", "Garage", "Basement", "Utility Room", "Crawl Space", "Other"];

export function ElectricalPanelLocation({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  const [locPhoto, setLocPhoto] = useState<string | null>(data._locPhotoPreview || null);
  const [mapSketch, setMapSketch] = useState<string | null>(data._mapSketchPreview || null);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Panel Location</h3>
      <SelectField label="Location Type" value={data.locationType || ""} onChange={(v) => set("locationType", v)} options={PANEL_LOCATION_TYPES} />
      <TextField label="Specific Location Description" value={data.specificLocation || ""} onChange={(v) => set("specificLocation", v)} placeholder="e.g. Mounted on exterior north wall beside back door" />
      <PhotoSlot label="Panel Location Photo" preview={locPhoto} onUpload={(f) => filePreview(f, setLocPhoto)} />
      <TextField label="GPS or Home-Relative Directions" value={data.directions || ""} onChange={(v) => set("directions", v)} placeholder="e.g. Walk out back door, turn left 10 feet" />
      <TextField label="Access Notes" value={data.accessNotes || ""} onChange={(v) => set("accessNotes", v)} placeholder="e.g. Key needed, behind wooden cover panel" />
      <EmergencyField value={data.emergency || ""} onChange={(v) => set("emergency", v)} />
      <MapSketchSlot preview={mapSketch} onUpload={(f) => filePreview(f, setMapSketch)} />
    </div>
  );
}

// ════════════════════════════════════════
// WATER HEATER LOCATION
// ════════════════════════════════════════
const WH_UNIT_TYPES = ["Tank", "Tankless"];
const WH_FUEL_TYPES = ["Electric", "Natural Gas", "Propane", "Solar"];
const WH_LOCATION_TYPES = ["Inside House", "Outside", "Under House Crawl Space", "Garage", "Basement", "Utility Closet", "Attic", "Other"];

export function WaterHeaterLocation({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  const [unitPhoto, setUnitPhoto] = useState<string | null>(null);
  const [locPhoto, setLocPhoto] = useState<string | null>(null);
  const [mapSketch, setMapSketch] = useState<string | null>(null);

  const showWarning = data.locationType === "Under House Crawl Space" || data.locationType === "Outside";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Water Heater Location & Type</h3>
      <SelectField label="Unit Type" value={data.unitType || ""} onChange={(v) => set("unitType", v)} options={WH_UNIT_TYPES} />
      <SelectField label="Fuel Type" value={data.fuelType || ""} onChange={(v) => set("fuelType", v)} options={WH_FUEL_TYPES} />
      <SelectField label="Location Type" value={data.locationType || ""} onChange={(v) => set("locationType", v)} options={WH_LOCATION_TYPES} />

      {showWarning && (
        <div className="rounded-lg border border-health-amber/40 bg-health-amber/10 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-health-amber shrink-0 mt-0.5" />
          <p className="text-xs text-health-amber">Units in this location require additional weatherproofing checks — see maintenance guide.</p>
        </div>
      )}

      <TextField label="Specific Location Description" value={data.specificLocation || ""} onChange={(v) => set("specificLocation", v)} placeholder="e.g. Under house in crawl space near center support beam" />
      <div className="flex gap-3">
        <PhotoSlot label="Water Heater Unit Photo" preview={unitPhoto} onUpload={(f) => filePreview(f, setUnitPhoto)} />
        <PhotoSlot label="Location / Access Photo" preview={locPhoto} onUpload={(f) => filePreview(f, setLocPhoto)} />
      </div>
      <TextField label="Access Instructions" value={data.accessInstructions || ""} onChange={(v) => set("accessInstructions", v)} placeholder="e.g. Crawl space access door on north side of house foundation" />
      <TextField label="Shutoff Valve Location" value={data.shutoffValve || ""} onChange={(v) => set("shutoffValve", v)} placeholder="e.g. Cold water shutoff is the blue handle directly above the unit" />
      <EmergencyField value={data.emergency || ""} onChange={(v) => set("emergency", v)} />
      <MapSketchSlot preview={mapSketch} onUpload={(f) => filePreview(f, setMapSketch)} />
    </div>
  );
}

// ════════════════════════════════════════
// HVAC LOCATION
// ════════════════════════════════════════
const HANDLER_LOCATIONS = ["Attic", "Garage", "Basement", "Crawl Space", "Utility Closet", "Under House", "Exterior", "Other"];
const CONDENSER_LOCATIONS = ["Backyard", "Front Yard", "Side of House", "Roof", "None — Heat Pump Only", "Other"];

export function HvacLocation({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  const [handlerPhoto, setHandlerPhoto] = useState<string | null>(null);
  const [handlerLocPhoto, setHandlerLocPhoto] = useState<string | null>(null);
  const [condenserPhoto, setCondenserPhoto] = useState<string | null>(null);
  const [condenserLocPhoto, setCondenserLocPhoto] = useState<string | null>(null);
  const [mapSketch, setMapSketch] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> HVAC Location Details</h3>

      {/* Air Handler */}
      <div className="space-y-3">
        <SectionLabel>Air Handler / Furnace</SectionLabel>
        <SelectField label="Air Handler Location" value={data.handlerLocation || ""} onChange={(v) => set("handlerLocation", v)} options={HANDLER_LOCATIONS} />
        <TextField label="Specific Location" value={data.handlerSpecific || ""} onChange={(v) => set("handlerSpecific", v)} placeholder="e.g. Under house in crawl space accessible from east side" />
        <div className="flex gap-3">
          <PhotoSlot label="Air Handler Photo" preview={handlerPhoto} onUpload={(f) => filePreview(f, setHandlerPhoto)} />
          <PhotoSlot label="Air Handler Location Photo" preview={handlerLocPhoto} onUpload={(f) => filePreview(f, setHandlerLocPhoto)} />
        </div>
        <TextField label="Access Instructions" value={data.handlerAccess || ""} onChange={(v) => set("handlerAccess", v)} placeholder="e.g. Open the utility closet door in the hallway" />
      </div>

      {/* Outdoor Condenser */}
      <div className="space-y-3">
        <SectionLabel>Outdoor Condenser Unit</SectionLabel>
        <SelectField label="Condenser Location" value={data.condenserLocation || ""} onChange={(v) => set("condenserLocation", v)} options={CONDENSER_LOCATIONS} />
        <TextField label="Specific Location" value={data.condenserSpecific || ""} onChange={(v) => set("condenserSpecific", v)} placeholder="e.g. Right side of house, 5 feet from fence" />
        <div className="flex gap-3">
          <PhotoSlot label="Outdoor Condenser Photo" preview={condenserPhoto} onUpload={(f) => filePreview(f, setCondenserPhoto)} />
          <PhotoSlot label="Condenser Location Photo" preview={condenserLocPhoto} onUpload={(f) => filePreview(f, setCondenserLocPhoto)} />
        </div>
        <TextField label="Access Instructions" value={data.condenserAccess || ""} onChange={(v) => set("condenserAccess", v)} placeholder="e.g. Go through the side gate" />
        <TextField label="Clearance Notes" value={data.clearanceNotes || ""} onChange={(v) => set("clearanceNotes", v)} placeholder="e.g. Keep 2 feet clear — bushes encroaching on east side" />
      </div>

      {/* Filter & Emergency */}
      <div className="space-y-3">
        <SectionLabel>Filter & Shutoff</SectionLabel>
        <TextField label="Filter Location" value={data.filterLocation || ""} onChange={(v) => set("filterLocation", v)} placeholder="e.g. Filter slot in the hallway ceiling return air duct" />
        <TextField label="Filter Size" value={data.filterSize || ""} onChange={(v) => set("filterSize", v)} placeholder="e.g. 16x25x1" />
        <TextField label="Emergency Shutoff Location" value={data.emergencyShutoff || ""} onChange={(v) => set("emergencyShutoff", v)} placeholder="e.g. Red switch on wall beside air handler unit" />
      </div>

      <EmergencyField value={data.emergency || ""} onChange={(v) => set("emergency", v)} />
      <MapSketchSlot preview={mapSketch} onUpload={(f) => filePreview(f, setMapSketch)} />
    </div>
  );
}
