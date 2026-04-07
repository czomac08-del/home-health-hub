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
// WATER SYSTEM LOCATION (Well + City + Irrigation)
// ════════════════════════════════════════

const WELL_COVER_TYPES = ["Standard Well Cap", "Decorative Rock Cover", "Decorative Stump Cover", "Buried with Marker", "Pipe Cap Only", "Well House Structure", "Other"];
const COMPASS_DIRS = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
const WELLHEAD_HEIGHTS = ["At Ground Level", "6 inches", "12 inches", "18 inches", "Below Ground with Cover"];
const PRESSURE_TANK_LOCS = ["Basement", "Crawl Space", "Utility Room", "Garage", "Well House", "Exterior", "Other"];
const CITY_METER_LOCS = ["Front Yard", "Side Yard", "Rear Yard", "Sidewalk Box", "Street Box", "Basement", "Interior", "Other"];
const CITY_ENTRY_LOCS = ["Basement", "Crawl Space", "Slab Through Floor", "Garage", "Utility Room", "Other"];
const IRRIGATION_SOURCES = ["Same as house", "Separate well", "Pond", "Municipal irrigation meter"];

function CriticalPhotoSlot({ label, preview, onUpload }: { label: string; preview: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-[120px]">
      <p className="text-xs text-destructive font-semibold mb-1.5">{label}</p>
      <button onClick={() => ref.current?.click()}
        className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/5 flex items-center justify-center overflow-hidden hover:border-destructive/70 transition-colors">
        {preview ? <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" /> : <Camera className="h-6 w-6 text-destructive/60" />}
      </button>
      <p className="text-[10px] text-destructive/70 mt-1">Important — everyone in your household should know where this is</p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
    </div>
  );
}

function RepeatableTextField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-1.5">
          <input value={v} onChange={(e) => { const n = [...values]; n[i] = e.target.value; onChange(n); }} placeholder={placeholder}
            className="flex-1 rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" />
          {values.length > 1 && (
            <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive text-xs px-2">✕</button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...values, ""])} className="text-xs text-primary hover:text-primary/80 mt-1">+ Add another</button>
    </div>
  );
}

export function WaterSystemLocation({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const waterSource = (data.waterSource as string) || "";

  // Photo states
  const [wellPhoto, setWellPhoto] = useState<string | null>(null);
  const [wellSketch, setWellSketch] = useState<string | null>(null);
  const [pressureTankPhoto, setPressureTankPhoto] = useState<string | null>(null);
  const [wellShutoffPhoto, setWellShutoffPhoto] = useState<string | null>(null);
  const [meterPhoto, setMeterPhoto] = useState<string | null>(null);
  const [entryPhoto, setEntryPhoto] = useState<string | null>(null);
  const [cityShutoffPhoto, setCityShutoffPhoto] = useState<string | null>(null);
  const [irrigationMapPhoto, setIrrigationMapPhoto] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Water Source Selector */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-foreground font-semibold flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-primary" /> Water Source</h3>
        <SelectField label="Water Source Type" value={waterSource} onChange={(v) => set("waterSource", v)} options={["Well Water", "City Water"]} />
      </div>

      {/* ── WELL WATER ── */}
      {waterSource === "Well Water" && (
        <>
          {/* Emergency Banner */}
          <div className="rounded-xl border-2 border-health-amber/50 bg-health-amber/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-health-amber shrink-0 mt-0.5" />
            <p className="text-sm text-health-amber font-medium">This information could be critical in an emergency. Make sure your family and any future owners know exactly where to find the well.</p>
          </div>

          {/* Well Location */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Well Location on Property</h3>
            <TextField label="Well Location Description" value={data.wellLocationDesc || ""} onChange={(v) => set("wellLocationDesc", v)} placeholder="e.g. Located 40 feet northeast of the back corner of the house near the large oak tree" />
            <SelectField label="Well Disguise or Cover Type" value={data.wellCoverType || ""} onChange={(v) => set("wellCoverType", v)} options={WELL_COVER_TYPES} />
            {(data.wellCoverType === "Other" || data.wellCoverType === "Decorative Rock Cover" || data.wellCoverType === "Decorative Stump Cover") && (
              <TextField label="Describe what the well cover looks like" value={data.wellCoverDesc || ""} onChange={(v) => set("wellCoverDesc", v)} placeholder="e.g. Looks like a large grey boulder approximately 2 feet wide sitting at the edge of the tree line" />
            )}
            <PhotoSlot label="Well Location Photo — shows exactly where to find it" preview={wellPhoto} onUpload={(f) => filePreview(f, setWellPhoto)} />
            <TextField label="Locate From House (directions)" value={data.wellDirections || ""} onChange={(v) => set("wellDirections", v)} placeholder="e.g. Stand at the back door. Walk straight back 30 feet then turn right..." />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Distance from house (feet)" value={data.wellDistance || ""} onChange={(v) => set("wellDistance", v)} placeholder="e.g. 40" />
              <SelectField label="Compass direction from house" value={data.wellCompass || ""} onChange={(v) => set("wellCompass", v)} options={COMPASS_DIRS} />
            </div>
            <SelectField label="Wellhead Height above ground" value={data.wellheadHeight || ""} onChange={(v) => set("wellheadHeight", v)} options={WELLHEAD_HEIGHTS} />
            <TextField label="Pitless Adapter Location" value={data.pitlessAdapter || ""} onChange={(v) => set("pitlessAdapter", v)} placeholder="Where the water line exits the well casing into the ground toward the house" />
            <TextField label="Water Line Path to House" value={data.waterLinePath || ""} onChange={(v) => set("waterLinePath", v)} placeholder="e.g. Line runs underground heading southwest toward the utility room entry point" />
            <TextField label="Freeze Risk Notes" value={data.freezeRiskNotes || ""} onChange={(v) => set("freezeRiskNotes", v)} placeholder="e.g. Wellhead is exposed — heat tape installed November through March" />
            <MapSketchSlot preview={wellSketch} onUpload={(f) => filePreview(f, setWellSketch)} />
          </div>

          {/* Pressure Tank */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Pressure Tank & Equipment Location</h3>
            <SelectField label="Pressure Tank Location" value={data.pressureTankLoc || ""} onChange={(v) => set("pressureTankLoc", v)} options={PRESSURE_TANK_LOCS} />
            <TextField label="Pressure Tank Specific Location" value={data.pressureTankDesc || ""} onChange={(v) => set("pressureTankDesc", v)} placeholder="e.g. In the crawl space near the center support beam" />
            <PhotoSlot label="Pressure Tank Photo" preview={pressureTankPhoto} onUpload={(f) => filePreview(f, setPressureTankPhoto)} />
            <TextField label="Where does the water line enter the house?" value={data.wellLineEntry || ""} onChange={(v) => set("wellLineEntry", v)} placeholder="e.g. Enters through the north foundation wall in the crawl space" />
            <TextField label="Main Water Shutoff Valve Location" value={data.wellShutoffLoc || ""} onChange={(v) => set("wellShutoffLoc", v)} placeholder="e.g. Blue handled valve on the supply line 6 inches after it enters the crawl space" />
            <CriticalPhotoSlot label="Shutoff Valve Photo" preview={wellShutoffPhoto} onUpload={(f) => filePreview(f, setWellShutoffPhoto)} />
          </div>

          <EmergencyField value={data.wellEmergency || ""} onChange={(v) => set("wellEmergency", v)} />
        </>
      )}

      {/* ── CITY WATER ── */}
      {waterSource === "City Water" && (
        <>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Water Meter Location</h3>
            <SelectField label="Water Meter Location" value={data.meterLocation || ""} onChange={(v) => set("meterLocation", v)} options={CITY_METER_LOCS} />
            <TextField label="Meter Specific Location" value={data.meterSpecific || ""} onChange={(v) => set("meterSpecific", v)} placeholder="e.g. In ground box at the front left corner of the property near the sidewalk" />
            <PhotoSlot label="Meter Location Photo" preview={meterPhoto} onUpload={(f) => filePreview(f, setMeterPhoto)} />
            <TextField label="Meter Number" value={data.meterNumber || ""} onChange={(v) => set("meterNumber", v)} placeholder="Actual meter ID number" />
            <SelectField label="Do you know how to read the meter?" value={data.knowMeterRead || ""} onChange={(v) => set("knowMeterRead", v)} options={["Yes I know how", "No — show me a guide"]} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Water Line Entry & Shutoff</h3>
            <SelectField label="Water Line Entry Point into House" value={data.cityEntryType || ""} onChange={(v) => set("cityEntryType", v)} options={CITY_ENTRY_LOCS} />
            <TextField label="Entry Point Specific Location" value={data.cityEntrySpecific || ""} onChange={(v) => set("cityEntrySpecific", v)} placeholder="e.g. Enters through the slab in the utility closet behind the water heater" />
            <PhotoSlot label="Entry Point Photo" preview={entryPhoto} onUpload={(f) => filePreview(f, setEntryPhoto)} />
            <TextField label="Main Water Shutoff Valve Location" value={data.cityShutoffLoc || ""} onChange={(v) => set("cityShutoffLoc", v)} placeholder="e.g. Ball valve on the supply line inside the utility closet — blue handle" />
            <CriticalPhotoSlot label="Main Shutoff Photo" preview={cityShutoffPhoto} onUpload={(f) => filePreview(f, setCityShutoffPhoto)} />
            <RepeatableTextField label="Secondary Shutoff Locations" values={(data.secondaryShutoffs as string[]) || [""]} onChange={(v) => set("secondaryShutoffs", v)} placeholder="e.g. Under kitchen sink, behind master toilet" />
            <TextField label="Water Pressure Regulator Location (if present)" value={data.pressureRegulator || ""} onChange={(v) => set("pressureRegulator", v)} placeholder="e.g. On the main line just after it enters the house" />
            <TextField label="Backflow Preventer Location (if present)" value={data.backflowPreventer || ""} onChange={(v) => set("backflowPreventer", v)} placeholder="e.g. Green valve assembly in the front yard near the meter" />
          </div>

          <EmergencyField value={data.cityEmergency || ""} onChange={(v) => set("cityEmergency", v)} />
        </>
      )}

      {/* ── EMERGENCY SHUTOFF CARD GENERATOR ── */}
      {waterSource && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-foreground font-semibold mb-2">Emergency Water Shutoff Card</h3>
          <p className="text-xs text-muted-foreground mb-3">Generate a simple printable card to post inside a kitchen cabinet or give to a house sitter.</p>
          <button onClick={() => {
            const shutoffLoc = waterSource === "Well Water" ? (data.wellShutoffLoc || "Not specified") : (data.cityShutoffLoc || "Not specified");
            const printContent = `
              <html><head><title>Emergency Water Shutoff</title>
              <style>body{font-family:system-ui;max-width:400px;margin:40px auto;padding:20px;border:3px solid #e53e3e;border-radius:12px}
              h1{color:#e53e3e;font-size:18px;margin-bottom:4px}h2{font-size:14px;color:#333;margin:12px 0 4px}
              p{font-size:13px;color:#555;margin:0 0 8px}.badge{display:inline-block;background:#e53e3e;color:white;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold}</style></head>
              <body>
              <h1>🚨 EMERGENCY WATER SHUTOFF</h1>
              <span class="badge">${waterSource.toUpperCase()}</span>
              <h2>Main Shutoff Location:</h2><p>${shutoffLoc}</p>
              <h2>Step-by-step:</h2>
              <p>1. Locate the shutoff valve described above</p>
              <p>2. Turn the valve clockwise (righty-tighty) until fully closed</p>
              <p>3. Open a faucet to confirm water has stopped</p>
              <p>4. Call your plumber</p>
              <h2>Plumber Contact:</h2><p>Name: _________________</p><p>Phone: _________________</p>
              <p style="font-size:10px;color:#999;margin-top:16px;border-top:1px solid #eee;padding-top:8px">Generated by Home Passport</p>
              </body></html>`;
            const w = window.open("", "_blank");
            if (w) { w.document.write(printContent); w.document.close(); w.print(); }
          }} className="w-full rounded-xl bg-destructive/15 border border-destructive/30 py-3 font-semibold text-destructive hover:bg-destructive/20 transition-colors text-sm">
            🚨 Generate Emergency Shutoff Card
          </button>
        </div>
      )}

      {/* ── IRRIGATION SYSTEM ── */}
      {waterSource && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-foreground font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Irrigation System (Optional)</h3>
          <SelectField label="Irrigation Water Source" value={data.irrigationSource || ""} onChange={(v) => set("irrigationSource", v)} options={IRRIGATION_SOURCES} />
          {data.irrigationSource && (
            <>
              <TextField label="Irrigation Shutoff Location" value={data.irrigationShutoff || ""} onChange={(v) => set("irrigationShutoff", v)} placeholder="e.g. Green valve by the garage spigot" />
              <TextField label="Irrigation Controller Location & Brand" value={data.irrigationController || ""} onChange={(v) => set("irrigationController", v)} placeholder="e.g. Rachio 3 in the garage on the east wall" />
              <TextField label="Number of Zones" value={data.irrigationZones || ""} onChange={(v) => set("irrigationZones", v)} placeholder="e.g. 6" />
              <MapSketchSlot preview={irrigationMapPhoto} onUpload={(f) => filePreview(f, setIrrigationMapPhoto)} />
            </>
          )}
        </div>
      )}
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
