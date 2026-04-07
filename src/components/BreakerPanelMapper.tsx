import { useState, useRef } from "react";
import { Camera, AlertTriangle, Share2, Printer, X, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ElectricalPanelLocation } from "@/components/SystemLocationTracking";

// --- Types ---
interface Breaker {
  number: number;
  amperage: string;
  label: string;
  status: "unlabeled" | "on" | "off" | "tripped";
}

const AMPERAGE_OPTIONS = ["15", "20", "30", "40", "50", "60", "100"];
const LABEL_SUGGESTIONS = [
  "Kitchen Outlets", "Master Bedroom", "HVAC", "Water Heater",
  "Dryer", "Washer", "Garage", "Outdoor Lights", "Bathrooms",
  "Living Room", "Dining Room", "Dishwasher", "Microwave",
  "Refrigerator", "Office", "Guest Bedroom",
];
const PANEL_BRANDS = [
  { name: "Square D", warning: false },
  { name: "Siemens", warning: false },
  { name: "Eaton / Cutler-Hammer", warning: false },
  { name: "GE", warning: false },
  { name: "Murray", warning: false },
  { name: "Federal Pacific", warning: true },
  { name: "Zinsco", warning: true },
  { name: "Other", warning: false },
];
const TOTAL_AMP_OPTIONS = ["100", "150", "200", "400"];

function makeBreakerDefaults(count: number): Breaker[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    amperage: "",
    label: "",
    status: "unlabeled" as const,
  }));
}

// --- Sub-components ---

function PhotoUploadSlot({ label, preview, onUpload }: { label: string; preview: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <button
        onClick={() => ref.current?.click()}
        className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors"
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground" />
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, warning }: { label: string; value: string; onChange: (v: string) => void; options: { name: string; warning?: boolean }[] | string[]; warning?: boolean }) {
  const opts = typeof options[0] === "string"
    ? (options as string[]).map((o) => ({ name: o, warning: false }))
    : (options as { name: string; warning?: boolean }[]);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-ring",
            warning && "border-destructive text-destructive"
          )}
        >
          <option value="">Select...</option>
          {opts.map((o) => (
            <option key={o.name} value={o.name}>
              {o.warning ? `⚠️ ${o.name}` : o.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {warning && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Known safety hazard — replacement strongly recommended
        </p>
      )}
    </div>
  );
}

// --- Breaker Slot ---
function BreakerSlot({ breaker, onClick }: { breaker: Breaker; onClick: () => void }) {
  const colorMap = {
    unlabeled: "bg-secondary border-border",
    on: "bg-primary/20 border-primary",
    off: "bg-secondary/80 border-muted-foreground/30",
    tripped: "bg-destructive/20 border-destructive",
  };
  const textColor = {
    unlabeled: "text-muted-foreground",
    on: "text-primary",
    off: "text-muted-foreground/60",
    tripped: "text-destructive",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-14 rounded-md border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-[1.03] active:scale-95",
        colorMap[breaker.status]
      )}
    >
      <span className={cn("text-[10px] font-bold", textColor[breaker.status])}>#{breaker.number}</span>
      {breaker.label ? (
        <span className={cn("text-[9px] leading-tight text-center px-1 truncate w-full", textColor[breaker.status])}>{breaker.label}</span>
      ) : (
        <span className="text-[9px] text-muted-foreground/40">Tap to label</span>
      )}
      {breaker.amperage && (
        <span className={cn("text-[8px]", textColor[breaker.status])}>{breaker.amperage}A</span>
      )}
    </button>
  );
}

// --- Edit Modal ---
function BreakerEditModal({ breaker, onSave, onClose }: { breaker: Breaker; onSave: (b: Breaker) => void; onClose: () => void }) {
  const [local, setLocal] = useState<Breaker>({ ...breaker });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = LABEL_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(local.label.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-semibold">Breaker #{local.number}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amperage</label>
          <div className="flex flex-wrap gap-2">
            {AMPERAGE_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setLocal((p) => ({ ...p, amperage: a }))}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  local.amperage === a ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {a}A
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="text-xs text-muted-foreground mb-1 block">Label / What it controls</label>
          <input
            value={local.label}
            onChange={(e) => { setLocal((p) => ({ ...p, label: e.target.value })); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="e.g. Kitchen Outlets"
            className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg max-h-32 overflow-y-auto">
              {filtered.map((s) => (
                <button key={s} onMouseDown={() => { setLocal((p) => ({ ...p, label: s })); setShowSuggestions(false); }} className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-secondary/60">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <div className="flex gap-2">
            {(["on", "off", "tripped"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setLocal((p) => ({ ...p, status: s }))}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-colors",
                  local.status === s
                    ? s === "tripped" ? "bg-destructive/20 border-destructive text-destructive" : s === "on" ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-muted-foreground/30 text-muted-foreground"
                    : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            const updated = { ...local };
            if (!updated.label && updated.status === "unlabeled") updated.status = "unlabeled";
            else if (updated.label && updated.status === "unlabeled") updated.status = "on";
            onSave(updated);
          }}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Save Breaker
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
const BreakerPanelMapper = () => {
  const [panelPhoto, setPanelPhoto] = useState<string | null>(null);
  const [labelPhoto, setLabelPhoto] = useState<string | null>(null);
  const [panelBrand, setPanelBrand] = useState("");
  const [totalAmp, setTotalAmp] = useState("");
  const [mainBreakerAmp, setMainBreakerAmp] = useState("");
  const [breakerCount, setBreakerCount] = useState(24);
  const [panelLocation, setPanelLocation] = useState("");
  const [inspectionDate, setInspectionDate] = useState<Date | undefined>();
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorLicense, setInspectorLicense] = useState("");
  const [breakers, setBreakers] = useState<Breaker[]>(makeBreakerDefaults(24));
  const [editingBreaker, setEditingBreaker] = useState<number | null>(null);
  const [specialNotes, setSpecialNotes] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [locationData, setLocationData] = useState<Record<string, string>>({});

  const isDangerousBrand = panelBrand === "Federal Pacific" || panelBrand === "Zinsco";
  const labeledCount = breakers.filter((b) => b.label).length;

  const handleFilePreview = (file: File, setter: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBreakerCountChange = (newCount: number) => {
    const clamped = Math.max(2, Math.min(60, newCount));
    setBreakerCount(clamped);
    setBreakers((prev) => {
      if (clamped > prev.length) return [...prev, ...makeBreakerDefaults(clamped - prev.length).map((b, i) => ({ ...b, number: prev.length + i + 1 }))];
      return prev.slice(0, clamped);
    });
  };

  const saveBreaker = (updated: Breaker) => {
    setBreakers((prev) => prev.map((b) => (b.number === updated.number ? updated : b)));
    setEditingBreaker(null);
  };

  const leftBreakers = breakers.filter((_, i) => i % 2 === 0);
  const rightBreakers = breakers.filter((_, i) => i % 2 === 1);

  return (
    <div className="space-y-6">
      {/* ─── Panel Photos ─── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-foreground font-semibold mb-3">Panel Photos</h3>
        <div className="flex gap-3">
          <PhotoUploadSlot label="Full Panel Photo" preview={panelPhoto} onUpload={(f) => handleFilePreview(f, setPanelPhoto)} />
          <PhotoUploadSlot label="Panel Label Close-up" preview={labelPhoto} onUpload={(f) => handleFilePreview(f, setLabelPhoto)} />
        </div>
      </div>

      {/* ─── Panel Information ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-foreground font-semibold">Panel Information</h3>

        <SelectField label="Panel Brand" value={panelBrand} onChange={setPanelBrand} options={PANEL_BRANDS} warning={isDangerousBrand} />
        <SelectField label="Total Amperage" value={totalAmp} onChange={setTotalAmp} options={TOTAL_AMP_OPTIONS.map((a) => ({ name: a + " Amp" }))} />

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Number of Breakers</label>
          <input
            type="number"
            value={breakerCount}
            onChange={(e) => handleBreakerCountChange(parseInt(e.target.value) || 24)}
            className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Panel Location in Home</label>
          <input
            value={panelLocation}
            onChange={(e) => setPanelLocation(e.target.value)}
            placeholder="e.g. Basement utility room, east wall"
            className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Last Inspection Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("w-full rounded-lg bg-secondary/60 border border-border text-sm px-3 py-2.5 text-left", inspectionDate ? "text-foreground" : "text-muted-foreground")}>
                {inspectionDate ? format(inspectionDate, "PPP") : "Select date..."}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={inspectionDate} onSelect={setInspectionDate} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Inspector Name</label>
            <input value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="Name" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">License Number</label>
            <input value={inspectorLicense} onChange={(e) => setInspectorLicense(e.target.value)} placeholder="License #" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </div>

      {/* ─── Panel Location ─── */}
      <ElectricalPanelLocation data={locationData} onChange={setLocationData} />

      {/* ─── Visual Breaker Map ─── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground font-semibold">Breaker Map</h3>
          <span className="text-xs text-muted-foreground">{labeledCount}/{breakers.length} labeled</span>
        </div>

        {/* Panel visual */}
        <div className="rounded-xl bg-[hsl(210,13%,10%)] border-2 border-[hsl(210,10%,25%)] p-3 space-y-2">
          {/* Main Breaker */}
          <div className="mx-auto w-3/4 rounded-lg bg-secondary border-2 border-primary/50 py-3 text-center mb-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Main Breaker</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <select
                value={mainBreakerAmp}
                onChange={(e) => setMainBreakerAmp(e.target.value)}
                className="bg-transparent border-none text-primary font-bold text-lg focus:outline-none text-center appearance-none"
              >
                <option value="" className="bg-card">—</option>
                {TOTAL_AMP_OPTIONS.map((a) => (
                  <option key={a} value={a} className="bg-card">{a}A</option>
                ))}
              </select>
            </div>
          </div>

          {/* Breaker grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Array.from({ length: Math.max(leftBreakers.length, rightBreakers.length) }).map((_, row) => (
              <>
                {leftBreakers[row] ? (
                  <BreakerSlot key={`l-${row}`} breaker={leftBreakers[row]} onClick={() => setEditingBreaker(leftBreakers[row].number)} />
                ) : <div key={`le-${row}`} />}
                {rightBreakers[row] ? (
                  <BreakerSlot key={`r-${row}`} breaker={rightBreakers[row]} onClick={() => setEditingBreaker(rightBreakers[row].number)} />
                ) : <div key={`re-${row}`} />}
              </>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary border border-border" /> Unlabeled</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 border border-primary" /> On</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/80 border border-muted-foreground/30" /> Off</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive" /> Tripped</span>
        </div>
      </div>

      {/* ─── Breaker List View ─── */}
      {labeledCount > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold">Breaker Reference</h3>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">Amps</th>
                  <th className="text-left py-2 font-medium">Controls</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {breakers.filter((b) => b.label).map((b) => (
                  <tr key={b.number} className="border-b border-border/50">
                    <td className="py-2 text-foreground font-medium">{b.number}</td>
                    <td className="py-2 text-muted-foreground">{b.amperage || "—"}A</td>
                    <td className="py-2 text-foreground">{b.label}</td>
                    <td className="py-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full capitalize",
                        b.status === "on" && "bg-primary/20 text-primary",
                        b.status === "off" && "bg-secondary text-muted-foreground",
                        b.status === "tripped" && "bg-destructive/20 text-destructive",
                      )}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Share Panel Map ─── */}
      <button
        onClick={() => setShowShare(true)}
        className="w-full rounded-xl border border-border bg-card py-3.5 flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:bg-secondary/60 transition-colors"
      >
        <Share2 className="h-4 w-4" /> Share Panel Map
      </button>

      {showShare && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-foreground font-semibold">Share Panel Map</h3>
            <p className="text-sm text-muted-foreground">Send a read-only view of your breaker panel map to an electrician or contractor.</p>
            <div className="space-y-2">
              <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Copy Share Link</button>
              <button className="w-full py-2.5 rounded-lg bg-secondary text-foreground font-semibold text-sm border border-border">Email to Electrician</button>
            </div>
            <button onClick={() => setShowShare(false)} className="w-full text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Special Notes ─── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-foreground font-semibold mb-2">Special Notes</h3>
        <textarea
          value={specialNotes}
          onChange={(e) => setSpecialNotes(e.target.value)}
          placeholder="e.g. Breaker 12 trips frequently when dishwasher and microwave run simultaneously"
          rows={3}
          className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {/* Edit modal */}
      {editingBreaker !== null && (
        <BreakerEditModal
          breaker={breakers.find((b) => b.number === editingBreaker)!}
          onSave={saveBreaker}
          onClose={() => setEditingBreaker(null)}
        />
      )}
    </div>
  );
};

export default BreakerPanelMapper;
