import { useState, useRef } from "react";
import { Camera, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeImageFile, fileToDataUrl } from "@/lib/imageUpload";
import { savePhotoAiResult } from "@/lib/photoAiSave";

interface ScannedFields {
  brand: string | null;
  model: string | null;
  serial: string | null;
  manufactureDate: string | null;
}

interface ApplianceScannerProps {
  systemName: string;
  onFieldsScanned: (fields: ScannedFields) => void;
  /** When provided, scanned fields are persisted to system_details with PHOTO_AI tag. */
  propertyId?: string;
  userId?: string;
}

export default function ApplianceScanner({ systemName, onFieldsScanned, propertyId, userId }: ApplianceScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedFields, setScannedFields] = useState<ScannedFields | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (cameraRef.current) cameraRef.current.value = "";
    if (!raw) return;

    setScanning(true);
    setError(null);
    setScannedFields(null);

    try {
      const file = await normalizeImageFile(raw);
      const base64 = await fileToDataUrl(file);

      const { data, error: fnError } = await supabase.functions.invoke("ai-scan", {
        body: { mode: "label_scan", imageBase64: base64 },
      });

      if (fnError) throw new Error(fnError.message);

      const result = data?.result;
      if (!result || (!result.brand && !result.model && !result.serial)) {
        setError("Couldn't read label — please enter manually.");
        return;
      }

      const fields: ScannedFields = {
        brand: result.brand || null,
        model: result.model || null,
        serial: result.serial || null,
        manufactureDate: result.manufactureDate || null,
      };

      setScannedFields(fields);
      onFieldsScanned(fields);
      if (propertyId && userId) {
        savePhotoAiResult({
          propertyId,
          userId,
          systemName,
          result,
        }).catch((err) => console.error("[ApplianceScanner] PHOTO_AI save failed", err));
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err?.message || "Couldn't read label — please enter manually.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-foreground font-semibold text-lg">AI Appliance Scanner</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Point your camera at the {systemName.toLowerCase()} label or barcode to auto-fill details.
      </p>

      <button
        onClick={() => cameraRef.current?.click()}
        disabled={scanning}
        className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {scanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Scanning Label…
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" /> Scan Appliance
          </>
        )}
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleCapture}
      />

      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {scannedFields && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Fields Auto-Filled</span>
          </div>
          {scannedFields.brand && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Brand</span>
              <span className="text-foreground font-medium">{scannedFields.brand}</span>
            </div>
          )}
          {scannedFields.model && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Model</span>
              <span className="text-foreground font-medium">{scannedFields.model}</span>
            </div>
          )}
          {scannedFields.serial && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Serial #</span>
              <span className="text-foreground font-medium">{scannedFields.serial}</span>
            </div>
          )}
          {scannedFields.manufactureDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Manufacture Date</span>
              <span className="text-foreground font-medium">{scannedFields.manufactureDate}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
