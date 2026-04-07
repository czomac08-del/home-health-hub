import { useState, useRef, useCallback } from "react";
import { Camera, X, Sparkles, ScanLine, QrCode, Package, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export type ScanMode = "label_scan" | "barcode" | "full_unit" | "receipt";

export interface ScanResult {
  mode: ScanMode;
  imagePreview: string;
  data: Record<string, any>;
  timestamp?: number;
}

interface AiPhotoPickerProps {
  open: boolean;
  onClose: () => void;
  onPhotoSelected: (file: File, preview: string) => void;
  onScanComplete: (result: ScanResult) => void;
  showReceiptMode?: boolean;
}

// ─── Bottom Sheet Picker ───
export function AiPhotoPicker({ open, onClose, onPhotoSelected, onScanComplete, showReceiptMode }: AiPhotoPickerProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("label_scan");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onPhotoSelected(file, ev.target?.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (showScanner) {
    return (
      <AiCameraOverlay
        mode={scanMode}
        onModeChange={setScanMode}
        onClose={() => { setShowScanner(false); onClose(); }}
        onScanComplete={(r) => { setShowScanner(false); onScanComplete(r); onClose(); }}
        showReceiptMode={showReceiptMode}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="bg-card border-t border-border rounded-t-2xl w-full max-w-lg p-5 pb-8 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        <h3 className="text-foreground font-semibold text-center mb-3">Add Photo</h3>

        <button onClick={() => cameraRef.current?.click()} className="w-full flex items-center gap-3 rounded-xl bg-secondary/60 border border-border px-4 py-3.5 hover:bg-secondary transition-colors">
          <Camera className="h-5 w-5 text-primary" />
          <span className="text-sm text-foreground font-medium">Take Photo</span>
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 rounded-xl bg-secondary/60 border border-border px-4 py-3.5 hover:bg-secondary transition-colors">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">Upload from Library</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <button onClick={() => { setScanMode("label_scan"); setShowScanner(true); }} className="w-full flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3.5 hover:bg-primary/15 transition-colors">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="text-left">
            <span className="text-sm text-primary font-semibold block">AI Scan — Identify Product</span>
            <span className="text-[10px] text-primary/60">Auto-detect brand, model, serial & more</span>
          </div>
        </button>

        {showReceiptMode && (
          <button onClick={() => { setScanMode("receipt"); setShowScanner(true); }} className="w-full flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3.5 hover:bg-primary/15 transition-colors">
            <FileText className="h-5 w-5 text-primary" />
            <div className="text-left">
              <span className="text-sm text-primary font-semibold block">Scan Receipt / Invoice</span>
              <span className="text-[10px] text-primary/60">Auto-extract service details</span>
            </div>
          </button>
        )}

        <button onClick={onClose} className="w-full text-sm text-muted-foreground py-2 mt-2">Cancel</button>
      </div>
    </div>
  );
}

// ─── Camera Overlay with 4-mode pills ───
function AiCameraOverlay({ mode, onModeChange, onClose, onScanComplete, showReceiptMode }: {
  mode: ScanMode;
  onModeChange: (m: ScanMode) => void;
  onClose: () => void;
  onScanComplete: (r: ScanResult) => void;
  showReceiptMode?: boolean;
}) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setScanning(true);

      try {
        const { data, error } = await supabase.functions.invoke("ai-scan", {
          body: { mode, imageBase64: base64 },
        });
        if (error) throw error;
        onScanComplete({ mode, imagePreview: base64, data: data.result || {}, timestamp: Date.now() });
      } catch (err) {
        console.error("AI scan failed:", err);
        onScanComplete({ mode, imagePreview: base64, data: { error: "Scan failed — please try again" }, timestamp: Date.now() });
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const modeLabels: Record<ScanMode, string> = {
    label_scan: "Point at the product label",
    barcode: "Point at barcode or QR code",
    full_unit: "Point at the full unit",
    receipt: "Point at receipt or invoice",
  };

  const modes: { key: ScanMode; icon: typeof ScanLine; label: string }[] = [
    { key: "label_scan", icon: ScanLine, label: "Read Label" },
    { key: "barcode", icon: QrCode, label: "Scan Barcode" },
    { key: "full_unit", icon: Package, label: "Identify Product" },
  ];

  if (showReceiptMode) {
    modes.push({ key: "receipt", icon: FileText, label: "Scan Receipt" });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(210,13%,8%)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose}><X className="h-6 w-6 text-foreground" /></button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary/60" />
          <span className="text-[10px] text-muted-foreground/60 font-medium">Powered by AI</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm text-foreground text-center mb-4 font-medium">{modeLabels[mode]}</p>

      {/* Camera viewfinder area */}
      <div className="flex-1 mx-4 relative rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center border border-primary/10">
        {preview ? (
          <img src={preview} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <div className="relative w-64 h-64">
            {/* Animated scanning reticle corners */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg animate-pulse" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg animate-pulse" style={{ animationDelay: "0.15s" }} />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg animate-pulse" style={{ animationDelay: "0.3s" }} />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-primary rounded-br-lg animate-pulse" style={{ animationDelay: "0.45s" }} />

            {/* Scanning line */}
            <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {mode === "barcode" ? <QrCode className="h-12 w-12 text-primary/30" /> :
               mode === "receipt" ? <FileText className="h-12 w-12 text-primary/30" /> :
               mode === "full_unit" ? <Package className="h-12 w-12 text-primary/30" /> :
               <Camera className="h-12 w-12 text-primary/30" />}
            </div>
          </div>
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-primary/30 animate-ping absolute inset-0" />
              <Loader2 className="h-16 w-16 text-primary animate-spin relative" />
            </div>
            <p className="text-sm text-primary font-semibold">AI is analyzing...</p>
            <p className="text-xs text-muted-foreground">Extracting product information</p>
          </div>
        )}
      </div>

      {/* Mode pill tabs */}
      <div className="flex justify-center gap-2 px-4 py-4 flex-wrap">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => { onModeChange(m.key); setPreview(null); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all",
              mode === m.key
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-secondary text-muted-foreground border border-border hover:border-primary/40"
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Capture button */}
      <div className="flex justify-center pb-8 pt-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="h-18 w-18 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/40 relative"
          style={{ height: 72, width: 72 }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" style={{ animationDuration: "2s" }} />
          <Camera className="h-8 w-8 text-primary-foreground relative" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
      </div>
    </div>
  );
}

// ─── AI Scan Review Screen ───
interface AiScanReviewProps {
  result: ScanResult;
  onConfirm: (fields: Record<string, string>) => void;
  onClose: () => void;
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: "bg-primary/15 text-primary border-primary/30",
    medium: "bg-[hsl(var(--health-yellow))]/15 text-[hsl(var(--health-yellow))] border-[hsl(var(--health-yellow))]/30",
    low: "bg-[hsl(var(--health-amber))]/15 text-[hsl(var(--health-amber))] border-[hsl(var(--health-amber))]/30",
  };
  return (
    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-bold uppercase", colors[level] || colors.low)}>
      {level}
    </span>
  );
}

export function AiScanReview({ result, onConfirm, onClose }: AiScanReviewProps) {
  const confidence = result.data.confidence || {};
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const [k, v] of Object.entries(result.data)) {
      if (k !== "confidence" && k !== "visibleIssues" && k !== "recommendations" && k !== "partsReplaced" && typeof v === "string" && v) {
        f[k] = v;
      }
    }
    return f;
  });

  const fieldLabels: Record<string, string> = {
    brand: "Brand / Manufacturer",
    model: "Model Number",
    serial: "Serial Number",
    manufactureDate: "Manufacture Date",
    voltage: "Voltage",
    amperage: "Amperage",
    btu: "BTU Rating",
    gallonCapacity: "Gallon Capacity",
    filterSize: "Filter Size",
    additionalInfo: "Additional Info",
    unitType: "Unit Type",
    estimatedAge: "Estimated Age",
    condition: "Condition",
    summary: "AI Assessment",
    labelLocation: "Label Location",
    barcodeValue: "Barcode Value",
    productName: "Product Name",
    manufacturer: "Manufacturer",
    serviceCompany: "Service Company",
    servicePhone: "Phone Number",
    serviceDate: "Service Date",
    workPerformed: "Work Performed",
    totalCost: "Total Cost",
    technicianName: "Technician",
  };

  const unverifiedFields = Object.entries(fields).filter(([k]) => {
    const c = confidence[k];
    return c === "low" || !c;
  });

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">AI Scan Results</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Photo preview */}
        <div className="rounded-xl overflow-hidden border border-border mb-4 max-h-48">
          <img src={result.imagePreview} alt="Scanned" className="w-full object-contain max-h-48" />
        </div>

        {/* Summary for full_unit mode */}
        {result.mode === "full_unit" && result.data.summary && (
          <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI Assessment</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.data.summary}</p>
          </div>
        )}

        {/* Visible issues */}
        {result.data.visibleIssues?.length > 0 && (
          <div className="rounded-xl border border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5 p-4 mb-4">
            <h4 className="text-sm font-semibold text-[hsl(var(--health-amber))] mb-2">Visible Issues Detected</h4>
            <ul className="space-y-1">
              {result.data.visibleIssues.map((issue: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-[hsl(var(--health-amber))] mt-0.5">•</span>{issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unverified fields warning */}
        {unverifiedFields.length > 0 && (
          <div className="rounded-xl border border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5 p-3 mb-4 flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--health-amber))] font-medium">
              {unverifiedFields.length} field{unverifiedFields.length > 1 ? "s" : ""} need verification — marked in amber
            </span>
          </div>
        )}

        {/* Extracted fields */}
        <div className="space-y-2 mb-6">
          {Object.entries(fields).map(([key, value]) => {
            const conf = confidence[key] || (value ? "medium" : "low");
            const isLow = conf === "low";
            return (
              <div key={key} className={cn("rounded-xl border p-3", isLow ? "border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5" : "border-border bg-card")}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fieldLabels[key] || key}</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[8px] font-bold text-primary uppercase">
                      <Sparkles className="h-2 w-2" /> AI
                    </span>
                  </div>
                  <ConfidenceBadge level={conf} />
                </div>
                <input
                  value={value}
                  onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-transparent text-sm text-foreground border-b border-border/50 pb-0.5 focus:outline-none focus:border-primary"
                />
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {result.data.error && (
          <div className="rounded-xl border border-[hsl(var(--health-amber))]/40 bg-[hsl(var(--health-amber))]/5 p-4 mb-4">
            <p className="text-sm text-[hsl(var(--health-amber))]">{result.data.error}</p>
          </div>
        )}

        {/* Barcode manual status */}
        {result.mode === "barcode" && (
          <div className={cn("rounded-xl p-3 mb-4 flex items-center gap-2", result.data.manualAvailable ? "bg-primary/10 border border-primary/30" : "bg-[hsl(var(--health-amber))]/10 border border-[hsl(var(--health-amber))]/30")}>
            {result.data.manualAvailable ? (
              <span className="text-xs text-primary font-semibold">✓ Manual Found — Add to Passport</span>
            ) : (
              <span className="text-xs text-[hsl(var(--health-amber))]">No manual found — upload manually</span>
            )}
          </div>
        )}

        <button
          onClick={() => onConfirm(fields)}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" /> Save All to Passport
        </button>
      </div>
    </div>
  );
}

// ─── Inline AI Camera Button for text fields ───
interface AiFieldScanButtonProps {
  fieldName: string;
  onResult: (value: string) => void;
}

export function AiFieldScanButton({ fieldName, onResult }: AiFieldScanButtonProps) {
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const { data, error } = await supabase.functions.invoke("ai-scan", {
          body: { mode: "label_scan", imageBase64: base64 },
        });
        if (error) throw error;
        const result = data.result || {};
        const value = result[fieldName] || result.brand || result.model || result.serial || "";
        if (value) onResult(value);
      } catch (err) {
        console.error("Field scan failed:", err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={scanning}
        className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50"
        title={`AI scan for ${fieldName}`}
      >
        {scanning ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
    </>
  );
}

// ─── Floating AI Scan Button ───
export function FloatingAiScanButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 hover:opacity-90 transition-all group"
    >
      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "3s" }} />
      <div className="relative flex items-center justify-center">
        <Camera className="h-6 w-6 text-primary-foreground" />
        <Sparkles className="h-3 w-3 text-primary-foreground absolute -top-1 -right-1" />
      </div>
    </button>
  );
}

// ─── Scan History Card ───
export function ScanHistory({ scans }: { scans: ScanResult[] }) {
  if (scans.length === 0) return null;
  const recent = scans.slice(-3).reverse();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> Recent AI Scans
      </h3>
      <div className="flex gap-3 overflow-x-auto">
        {recent.map((scan, i) => (
          <div key={i} className="shrink-0 w-24">
            <div className="h-20 w-24 rounded-lg overflow-hidden border border-border mb-1.5">
              <img src={scan.imagePreview} alt="Scan" className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {scan.data.brand || scan.data.unitType || scan.mode}
            </p>
            <p className="text-[9px] text-muted-foreground/60">
              {scan.timestamp ? new Date(scan.timestamp).toLocaleDateString() : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
