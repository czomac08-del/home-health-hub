import { useState, useRef, Fragment } from "react";
import { Camera, AlertTriangle, Share2, Printer, X, ChevronDown, ChevronUp, Plus, Zap, FileText, Navigation } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ElectricalPanelLocation } from "@/components/SystemLocationTracking";

// ─── Types ───
interface Breaker {
  number: number;
  amperage: string;
  label: string;
  status: "unlabeled" | "on" | "off" | "tripped";
}

interface PanelData {
  id: string;
  nickname: string;
  panelType: string;
  propertyLocation: string;
  brand: string;
  totalAmp: string;
  mainBreakerAmp: string;
  breakerCount: number;
  breakers: Breaker[];
  panelPhoto: string | null;
  labelPhoto: string | null;
  inspectionDate: Date | undefined;
  inspectorName: string;
  inspectorLicense: string;
  specialNotes: string;
  connectedTo: string;
  feederBreaker: string;
  feederAmp: string;
  emergency: string;
  locationData: Record<string, string>;
}

const AMPERAGE_OPTIONS = ["15", "20", "30", "40", "50", "60", "100"];
const TOTAL_AMP_OPTIONS = ["100", "150", "200", "400"];
const PANEL_TYPES = ["Main Panel", "Subpanel", "Disconnect", "Generator Panel"];
const PROPERTY_LOCATIONS = ["Main House Interior", "Main House Exterior", "Detached Garage", "Shop", "Barn", "Outbuilding", "Pool House", "Shed", "Other"];
const LABEL_SUGGESTIONS = ["Kitchen Outlets", "Master Bedroom", "HVAC", "Water Heater", "Dryer", "Washer", "Garage", "Outdoor Lights", "Bathrooms", "Living Room", "Dining Room", "Dishwasher", "Microwave", "Refrigerator", "Office", "Guest Bedroom"];
const PANEL_BRANDS = [
  { name: "Square D", warning: false }, { name: "Siemens", warning: false },
  { name: "Eaton / Cutler-Hammer", warning: false }, { name: "GE", warning: false },
  { name: "Murray", warning: false }, { name: "Federal Pacific", warning: true },
  { name: "Zinsco", warning: true }, { name: "Other", warning: false },
];

function makeBreakerDefaults(count: number): Breaker[] {
  return Array.from({ length: count }, (_, i) => ({ number: i + 1, amperage: "", label: "", status: "unlabeled" as const }));
}

function makeNewPanel(id: string): PanelData {
  return {
    id, nickname: "", panelType: "", propertyLocation: "", brand: "", totalAmp: "", mainBreakerAmp: "",
    breakerCount: 24, breakers: makeBreakerDefaults(24), panelPhoto: null, labelPhoto: null,
    inspectionDate: undefined, inspectorName: "", inspectorLicense: "", specialNotes: "",
    connectedTo: "", feederBreaker: "", feederAmp: "", emergency: "", locationData: {},
  };
}

// ─── Small reusable parts ───
function PhotoSlot({ label, preview, onUpload }: { label: string; preview: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <button onClick={() => ref.current?.click()} className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
        {preview ? <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
    </div>
  );
}

function BreakerSlot({ breaker, onClick }: { breaker: Breaker; onClick: () => void }) {
  const colors = { unlabeled: "bg-secondary border-border", on: "bg-primary/20 border-primary", off: "bg-secondary/80 border-muted-foreground/30", tripped: "bg-destructive/20 border-destructive" };
  const text = { unlabeled: "text-muted-foreground", on: "text-primary", off: "text-muted-foreground/60", tripped: "text-destructive" };
  return (
    <button onClick={onClick} className={cn("w-full h-14 rounded-md border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-[1.03] active:scale-95", colors[breaker.status])}>
      <span className={cn("text-[10px] font-bold", text[breaker.status])}>#{breaker.number}</span>
      {breaker.label ? <span className={cn("text-[9px] leading-tight text-center px-1 truncate w-full", text[breaker.status])}>{breaker.label}</span> : <span className="text-[9px] text-muted-foreground/40">Tap to label</span>}
      {breaker.amperage && <span className={cn("text-[8px]", text[breaker.status])}>{breaker.amperage}A</span>}
    </button>
  );
}

function BreakerEditModal({ breaker, onSave, onClose }: { breaker: Breaker; onSave: (b: Breaker) => void; onClose: () => void }) {
  const [local, setLocal] = useState<Breaker>({ ...breaker });
  const [showSugg, setShowSugg] = useState(false);
  const filtered = LABEL_SUGGESTIONS.filter((s) => s.toLowerCase().includes(local.label.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-foreground font-semibold">Breaker #{local.number}</h3><button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amperage</label>
          <div className="flex flex-wrap gap-2">
            {AMPERAGE_OPTIONS.map((a) => (<button key={a} onClick={() => setLocal((p) => ({ ...p, amperage: a }))} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors", local.amperage === a ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:border-primary/50")}>{a}A</button>))}
          </div>
        </div>
        <div className="relative">
          <label className="text-xs text-muted-foreground mb-1 block">Label / What it controls</label>
          <input value={local.label} onChange={(e) => { setLocal((p) => ({ ...p, label: e.target.value })); setShowSugg(true); }} onFocus={() => setShowSugg(true)} onBlur={() => setTimeout(() => setShowSugg(false), 200)} placeholder="e.g. Kitchen Outlets" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" />
          {showSugg && filtered.length > 0 && (<div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg max-h-32 overflow-y-auto">{filtered.map((s) => (<button key={s} onMouseDown={() => { setLocal((p) => ({ ...p, label: s })); setShowSugg(false); }} className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-secondary/60">{s}</button>))}</div>)}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <div className="flex gap-2">
            {(["on", "off", "tripped"] as const).map((s) => (<button key={s} onClick={() => setLocal((p) => ({ ...p, status: s }))} className={cn("flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-colors", local.status === s ? s === "tripped" ? "bg-destructive/20 border-destructive text-destructive" : s === "on" ? "bg-primary/20 border-primary text-primary" : "bg-secondary border-muted-foreground/30 text-muted-foreground" : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30")}>{s}</button>))}
          </div>
        </div>
        <button onClick={() => { const u = { ...local }; if (!u.label && u.status === "unlabeled") u.status = "unlabeled"; else if (u.label && u.status === "unlabeled") u.status = "on"; onSave(u); }} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">Save Breaker</button>
      </div>
    </div>
  );
}

// ─── Connection Diagram ───
function ConnectionDiagram({ panels }: { panels: PanelData[] }) {
  const mainPanels = panels.filter((p) => p.panelType === "Main Panel" || !p.panelType);
  const subPanels = panels.filter((p) => p.panelType !== "Main Panel" && p.panelType);

  if (panels.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Property Electrical Diagram</h3>
      <div className="flex flex-col items-center gap-2">
        {/* Main panels */}
        {mainPanels.map((p) => (
          <Fragment key={p.id}>
            <div className="rounded-lg border-2 border-primary bg-primary/10 px-4 py-2.5 text-center min-w-[200px]">
              <p className="text-sm font-semibold text-primary">{p.nickname || "Main Panel"}</p>
              {(p.totalAmp || p.propertyLocation) && (
                <p className="text-[10px] text-muted-foreground">
                  {[p.totalAmp ? `${p.totalAmp}A` : null, p.propertyLocation || null].filter(Boolean).join(" • ")}
                </p>
              )}
            </div>
            {/* Lines to subpanels fed from this main */}
            {subPanels.filter((s) => s.connectedTo === p.nickname || s.connectedTo === p.id || (!s.connectedTo && mainPanels.length === 1)).map((sub) => (
              <Fragment key={sub.id}>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-primary/40" />
                  {(sub.feederBreaker || sub.feederAmp) && (
                    <span className="text-[9px] text-muted-foreground bg-card px-2 py-0.5 rounded border border-border">
                      {[
                        sub.feederBreaker ? `Brk ${sub.feederBreaker}` : null,
                        sub.feederAmp ? `${sub.feederAmp}A feeder` : null,
                      ].filter(Boolean).join(" • ")}
                    </span>
                  )}
                  <div className="w-0.5 h-4 bg-primary/40" />
                </div>
                <div className="rounded-lg border-2 border-border bg-secondary/40 px-4 py-2.5 text-center min-w-[180px]">
                  <p className="text-sm font-medium text-foreground">{sub.nickname || sub.panelType || "Subpanel"}</p>
                  {(sub.totalAmp || sub.propertyLocation) && (
                    <p className="text-[10px] text-muted-foreground">
                      {[sub.totalAmp ? `${sub.totalAmp}A` : null, sub.propertyLocation || null].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>
              </Fragment>
            ))}
          </Fragment>
        ))}
        {/* Disconnected subs */}
        {subPanels.filter((s) => !s.connectedTo && mainPanels.length !== 1).map((sub) => (
          <div key={sub.id} className="rounded-lg border-2 border-dashed border-border bg-secondary/20 px-4 py-2.5 text-center min-w-[180px] mt-2">
            <p className="text-sm font-medium text-muted-foreground">{sub.nickname || sub.panelType || "Panel"}</p>
            <p className="text-[9px] text-muted-foreground italic">Not connected — set "Connected To"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single Panel Card ───
function PanelCard({ panel, allPanels, index, expanded, onToggle, onChange, onDelete }: {
  panel: PanelData; allPanels: PanelData[]; index: number; expanded: boolean;
  onToggle: () => void; onChange: (p: PanelData) => void; onDelete: () => void;
}) {
  const [editingBreaker, setEditingBreaker] = useState<number | null>(null);
  const set = <K extends keyof PanelData>(k: K, v: PanelData[K]) => onChange({ ...panel, [k]: v });
  const isDangerous = panel.brand === "Federal Pacific" || panel.brand === "Zinsco";
  const labeledCount = panel.breakers.filter((b) => b.label).length;
  const leftBreakers = panel.breakers.filter((_, i) => i % 2 === 0);
  const rightBreakers = panel.breakers.filter((_, i) => i % 2 === 1);
  const isSubpanel = panel.panelType === "Subpanel" || panel.panelType === "Disconnect" || panel.panelType === "Generator Panel";
  const mainPanels = allPanels.filter((p) => p.id !== panel.id && (p.panelType === "Main Panel" || !p.panelType));
  const statusColor = isDangerous ? "bg-destructive" : labeledCount === panel.breakers.length ? "bg-primary" : labeledCount > 0 ? "bg-health-yellow" : "bg-muted-foreground/40";

  const handleBreakerCount = (n: number) => {
    const c = Math.max(2, Math.min(60, n));
    const breakers = c > panel.breakers.length
      ? [...panel.breakers, ...makeBreakerDefaults(c - panel.breakers.length).map((b, i) => ({ ...b, number: panel.breakers.length + i + 1 }))]
      : panel.breakers.slice(0, c);
    onChange({ ...panel, breakerCount: c, breakers });
  };

  const saveBreaker = (b: Breaker) => {
    set("breakers", panel.breakers.map((x) => x.number === b.number ? b : x));
    setEditingBreaker(null);
  };

  const fp = (file: File, setter: (v: string | null) => void) => { const r = new FileReader(); r.onload = (e) => setter(e.target?.result as string); r.readAsDataURL(file); };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColor)} />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{panel.nickname || `Panel ${index + 1}`}</p>
          {(panel.panelType || panel.propertyLocation || panel.totalAmp) && (
            <p className="text-[10px] text-muted-foreground">
              {[panel.panelType || null, panel.propertyLocation || null, panel.totalAmp ? `${panel.totalAmp}A` : null].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Panel Info */}
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Panel Nickname</label><input value={panel.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="e.g. Main House Panel, Garage Subpanel" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Panel Type</label><select value={panel.panelType} onChange={(e) => set("panelType", e.target.value)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Select...</option>{PANEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Location on Property</label><select value={panel.propertyLocation} onChange={(e) => set("propertyLocation", e.target.value)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Select...</option>{PROPERTY_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Panel Brand</label><select value={panel.brand} onChange={(e) => set("brand", e.target.value)} className={cn("w-full rounded-lg bg-secondary/60 border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring", isDangerous ? "border-destructive" : "border-border")}><option value="">Select...</option>{PANEL_BRANDS.map((b) => <option key={b.name} value={b.name}>{b.warning ? `⚠️ ${b.name}` : b.name}</option>)}</select>{isDangerous && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Known safety hazard — replacement strongly recommended</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Total Amperage</label><select value={panel.totalAmp} onChange={(e) => set("totalAmp", e.target.value)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"><option value="">—</option>{TOTAL_AMP_OPTIONS.map((a) => <option key={a} value={a}>{a}A</option>)}</select></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Breaker Count</label><input type="number" value={panel.breakerCount} onChange={(e) => handleBreakerCount(parseInt(e.target.value) || 24)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
            </div>
          </div>

          {/* Connected To (subpanels only) */}
          {isSubpanel && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Connected To</h4>
              <select value={panel.connectedTo} onChange={(e) => set("connectedTo", e.target.value)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Select main panel...</option>{mainPanels.map((m) => <option key={m.id} value={m.nickname || m.id}>{m.nickname || `Panel ${allPanels.indexOf(m) + 1}`}</option>)}</select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-muted-foreground mb-1 block">Feeder Breaker #</label><input value={panel.feederBreaker} onChange={(e) => set("feederBreaker", e.target.value)} placeholder="e.g. 24" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Feeder Amp</label><select value={panel.feederAmp} onChange={(e) => set("feederAmp", e.target.value)} className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-ring"><option value="">—</option>{["30", "40", "50", "60", "100"].map((a) => <option key={a} value={a}>{a}A</option>)}</select></div>
              </div>
              {panel.connectedTo && <p className="text-[10px] text-primary">Fed from {panel.connectedTo}{panel.feederBreaker ? ` — Breaker ${panel.feederBreaker}` : ""}{panel.feederAmp ? ` — ${panel.feederAmp} amp feeder` : ""}</p>}
            </div>
          )}

          {/* Photos */}
          <div className="flex gap-3">
            <PhotoSlot label="Full Panel Photo" preview={panel.panelPhoto} onUpload={(f) => fp(f, (v) => set("panelPhoto", v))} />
            <PhotoSlot label="Panel Label Close-up" preview={panel.labelPhoto} onUpload={(f) => fp(f, (v) => set("labelPhoto", v))} />
          </div>

          {/* Inspection */}
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Last Inspection Date</label>
              <Popover><PopoverTrigger asChild><button className={cn("w-full rounded-lg bg-secondary/60 border border-border text-sm px-3 py-2.5 text-left", panel.inspectionDate ? "text-foreground" : "text-muted-foreground")}>{panel.inspectionDate ? format(panel.inspectionDate, "PPP") : "Select date..."}</button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={panel.inspectionDate} onSelect={(d) => set("inspectionDate", d)} className="p-3 pointer-events-auto" /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">Inspector Name</label><input value={panel.inspectorName} onChange={(e) => set("inspectorName", e.target.value)} placeholder="Name" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">License #</label><input value={panel.inspectorLicense} onChange={(e) => set("inspectorLicense", e.target.value)} placeholder="License #" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring" /></div>
            </div>
          </div>

          {/* Location */}
          <ElectricalPanelLocation data={panel.locationData} onChange={(d) => set("locationData", d)} />

          {/* Emergency */}
          <div className="rounded-xl border-2 border-health-amber/40 bg-health-amber/5 p-4">
            <div className="flex items-center gap-2 mb-2"><Navigation className="h-4 w-4 text-health-amber" /><h4 className="text-sm font-semibold text-health-amber">Emergency Shutoff Notes</h4></div>
            <textarea value={panel.emergency} onChange={(e) => set("emergency", e.target.value)} rows={2} placeholder="e.g. Main breaker switch is the large red handle at the top of the panel" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          {/* Breaker Map */}
          <div>
            <div className="flex items-center justify-between mb-3"><h4 className="text-foreground font-semibold">Breaker Map</h4><span className="text-xs text-muted-foreground">{labeledCount}/{panel.breakers.length} labeled</span></div>
            <div className="rounded-xl bg-[hsl(210,13%,10%)] border-2 border-[hsl(210,10%,25%)] p-3 space-y-2">
              <div className="mx-auto w-3/4 rounded-lg bg-secondary border-2 border-primary/50 py-3 text-center mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Main Breaker</p>
                <select value={panel.mainBreakerAmp} onChange={(e) => set("mainBreakerAmp", e.target.value)} className="bg-transparent border-none text-primary font-bold text-lg focus:outline-none text-center appearance-none"><option value="" className="bg-card">—</option>{TOTAL_AMP_OPTIONS.map((a) => <option key={a} value={a} className="bg-card">{a}A</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {Array.from({ length: Math.max(leftBreakers.length, rightBreakers.length) }).map((_, row) => (
                  <Fragment key={row}>
                    {leftBreakers[row] ? <BreakerSlot breaker={leftBreakers[row]} onClick={() => setEditingBreaker(leftBreakers[row].number)} /> : <div />}
                    {rightBreakers[row] ? <BreakerSlot breaker={rightBreakers[row]} onClick={() => setEditingBreaker(rightBreakers[row].number)} /> : <div />}
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary border border-border" /> Unlabeled</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 border border-primary" /> On</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/80 border border-muted-foreground/30" /> Off</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive" /> Tripped</span>
            </div>
          </div>

          {/* Breaker Reference Table */}
          {labeledCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2"><h4 className="text-foreground font-semibold text-sm">Breaker Reference</h4><button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80"><Printer className="h-3.5 w-3.5" /> Print</button></div>
              <table className="w-full text-sm">
                <thead><tr className="text-muted-foreground text-xs border-b border-border"><th className="text-left py-2 font-medium">#</th><th className="text-left py-2 font-medium">Amps</th><th className="text-left py-2 font-medium">Controls</th><th className="text-left py-2 font-medium">Status</th></tr></thead>
                <tbody>{panel.breakers.filter((b) => b.label).map((b) => (
                  <tr key={b.number} className="border-b border-border/50">
                    <td className="py-2 text-foreground font-medium">{b.number}</td>
                    <td className="py-2 text-muted-foreground">{b.amperage || "—"}A</td>
                    <td className="py-2 text-foreground">{b.label}</td>
                    <td className="py-2"><span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", b.status === "on" && "bg-primary/20 text-primary", b.status === "off" && "bg-secondary text-muted-foreground", b.status === "tripped" && "bg-destructive/20 text-destructive")}>{b.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          <div><label className="text-xs text-muted-foreground mb-1 block">Special Notes</label><textarea value={panel.specialNotes} onChange={(e) => set("specialNotes", e.target.value)} rows={2} placeholder="e.g. Breaker 12 trips frequently when dishwasher and microwave run simultaneously" className="w-full rounded-lg bg-secondary/60 border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none" /></div>

          {/* Delete panel */}
          <button onClick={onDelete} className="w-full text-xs text-destructive hover:text-destructive/80 py-2">Remove this panel</button>

          {/* Breaker edit modal */}
          {editingBreaker !== null && (
            <BreakerEditModal breaker={panel.breakers.find((b) => b.number === editingBreaker)!} onSave={saveBreaker} onClose={() => setEditingBreaker(null)} />
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
const BreakerPanelMapper = () => {
  const [panels, setPanels] = useState<PanelData[]>([makeNewPanel("panel-1")]);
  const [expandedId, setExpandedId] = useState<string>("panel-1");
  const [showShare, setShowShare] = useState(false);

  const addPanel = () => {
    const id = `panel-${Date.now()}`;
    setPanels((prev) => [...prev, makeNewPanel(id)]);
    setExpandedId(id);
  };

  const updatePanel = (id: string, updated: PanelData) => {
    setPanels((prev) => prev.map((p) => p.id === id ? updated : p));
  };

  const deletePanel = (id: string) => {
    if (panels.length <= 1) return;
    setPanels((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(panels[0]?.id || "");
  };

  const totalBreakers = panels.reduce((s, p) => s + p.breakers.length, 0);
  const totalLabeled = panels.reduce((s, p) => s + p.breakers.filter((b) => b.label).length, 0);

  return (
    <div className="space-y-4">
      {/* ─── Panel Overview ─── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Panel Overview</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="rounded-lg bg-secondary/60 p-2.5 text-center"><p className="text-lg font-bold text-primary">{panels.length}</p><p className="text-[10px] text-muted-foreground">Panels</p></div>
          <div className="rounded-lg bg-secondary/60 p-2.5 text-center"><p className="text-lg font-bold text-foreground">{totalBreakers}</p><p className="text-[10px] text-muted-foreground">Breakers</p></div>
          <div className="rounded-lg bg-secondary/60 p-2.5 text-center"><p className="text-lg font-bold text-foreground">{totalLabeled}</p><p className="text-[10px] text-muted-foreground">Labeled</p></div>
        </div>
        <button onClick={addPanel} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Add Another Panel
        </button>
      </div>

      {/* ─── Connection Diagram ─── */}
      <ConnectionDiagram panels={panels} />

      {/* ─── Individual Panel Cards ─── */}
      {panels.map((panel, i) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          allPanels={panels}
          index={i}
          expanded={expandedId === panel.id}
          onToggle={() => setExpandedId(expandedId === panel.id ? "" : panel.id)}
          onChange={(p) => updatePanel(panel.id, p)}
          onDelete={() => deletePanel(panel.id)}
        />
      ))}

      {/* ─── Share & Report ─── */}
      <div className="space-y-2">
        <button onClick={() => setShowShare(true)} className="w-full rounded-xl border border-border bg-card py-3.5 flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:bg-secondary/60 transition-colors">
          <Share2 className="h-4 w-4" /> Share Panel Map
        </button>
        <button onClick={() => window.print()} className="w-full rounded-xl border border-primary bg-primary/10 py-3.5 flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:bg-primary/15 transition-colors">
          <FileText className="h-4 w-4" /> Full Property Electrical Report
        </button>
      </div>

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-5 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-foreground font-semibold">Share Panel Map</h3>
            <p className="text-sm text-muted-foreground">Send a read-only view of all {panels.length} panel{panels.length > 1 ? "s" : ""} to an electrician or contractor.</p>
            <div className="space-y-2">
              <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Copy Share Link</button>
              <button className="w-full py-2.5 rounded-lg bg-secondary text-foreground font-semibold text-sm border border-border">Email to Electrician</button>
            </div>
            <button onClick={() => setShowShare(false)} className="w-full text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakerPanelMapper;
