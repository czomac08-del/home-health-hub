import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, X, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnalyzablePhoto {
  id: string;                  // system_photos.id
  systemDetailId: string;      // FK
  systemName?: string | null;
  url: string;                 // signed URL or public
  storagePath?: string | null;
  bucket?: string;             // defaults to system-photos
  label?: string | null;
}

export interface PhotoReviewResult {
  unitType?: string | null;
  manufacturer?: string | null;
  brand?: string | null;
  modelName?: string | null;
  modelNumber?: string | null;
  model?: string | null;
  serial?: string | null;
  serialNumber?: string | null;
  manufactureYear?: string | null;
  estimatedAge?: string | null;
  fuelType?: string | null;
  capacity?: string | null;
  size?: string | null;
  condition?: string | null;
  warningLabels?: string[] | null;
  recalls?: string[] | null;
  visibleIssues?: string[] | null;
  summary?: string | null;
  confidence?: Record<string, string | number> | null;
}

async function imageToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch image");
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getImageDataUrl(photo: AnalyzablePhoto): Promise<string> {
  // Prefer signed URL via storage path so private buckets work.
  if (photo.storagePath) {
    const bucket = photo.bucket || "system-photos";
    const { data } = await supabase.storage.from(bucket).createSignedUrl(photo.storagePath, 300);
    if (data?.signedUrl) return imageToBase64(data.signedUrl);
  }
  return imageToBase64(photo.url);
}

export async function analyzePhoto(photo: AnalyzablePhoto): Promise<PhotoReviewResult> {
  const imageBase64 = await getImageDataUrl(photo);
  const { data, error } = await supabase.functions.invoke("ai-scan", {
    body: { mode: "photo_review", imageBase64 },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.result || {}) as PhotoReviewResult;
}

interface ConfirmModalProps {
  photo: AnalyzablePhoto;
  result: PhotoReviewResult;
  onClose: () => void;
  onSaved: () => void;
}

function ConfirmModal({ photo, result, onClose, onSaved }: ConfirmModalProps) {
  const [unitType, setUnitType] = useState(result.unitType || "");
  const [brand, setBrand] = useState(result.brand || "");
  const [model, setModel] = useState(result.model || "");
  const [serial, setSerial] = useState(result.serial || "");
  const [estimatedAge, setEstimatedAge] = useState(result.estimatedAge || "");
  const [condition, setCondition] = useState(result.condition || "");
  const [saving, setSaving] = useState(false);

  const visibleIssues = Array.isArray(result.visibleIssues) ? result.visibleIssues : [];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mark photo analyzed
      await supabase
        .from("system_photos" as any)
        .update({
          ai_analyzed: true,
          ai_analyzed_at: new Date().toISOString(),
          ai_analysis_result: { ...result, confirmed: { unitType, brand, model, serial, estimatedAge, condition } },
        } as any)
        .eq("id", photo.id);

      // Merge into system_details — only fill empty fields, tag sources
      const { data: row } = await supabase
        .from("system_details")
        .select("id, brand, model, serial_number, notes, specs, source_tags")
        .eq("id", photo.systemDetailId)
        .maybeSingle();
      if (row) {
        const update: any = {};
        const sourceTags: Record<string, string> = (row as any).source_tags || {};
        if (brand && !row.brand) { update.brand = brand; sourceTags.brand = "AI_INFERRED"; }
        if (model && !row.model) { update.model = model; sourceTags.model = "AI_INFERRED"; }
        if (serial && !row.serial_number) { update.serial_number = serial; sourceTags.serial_number = "AI_INFERRED"; }

        const condNote = [
          unitType && `Identified: ${unitType}`,
          condition && `Condition: ${condition}`,
          estimatedAge && `Est. age: ${estimatedAge}`,
          visibleIssues.length ? `Visible issues: ${visibleIssues.join(", ")}` : null,
        ].filter(Boolean).join(" • ");
        if (condNote) {
          const aiNote = `[AI photo review] ${condNote}`;
          update.notes = row.notes ? `${row.notes}\n\n${aiNote}` : aiNote;
          sourceTags.ai_notes = "AI_INFERRED";
        }

        if (Object.keys(update).length > 0) {
          update.source_tags = sourceTags;
          await supabase.from("system_details").update(update).eq("id", row.id);
        } else if (Object.keys(sourceTags).length) {
          await supabase.from("system_details").update({ source_tags: sourceTags } as any).eq("id", row.id);
        }
      }

      toast.success("AI review saved.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, conf }: { label: string; value: string; onChange: (v: string) => void; conf?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
        {label}
        {conf && <span className="text-[9px] uppercase font-bold text-primary/70">{conf} conf</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">AI Photo Review</h3>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="flex gap-3 mb-4">
          <img src={photo.url} alt={photo.label || "photo"} className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
          <p className="text-xs text-muted-foreground">
            We found the following — does this look right? Edit anything you'd like to correct, then save.
          </p>
        </div>

        {result.summary && (
          <p className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-xs text-foreground mb-3">
            {result.summary}
          </p>
        )}

        <div className="space-y-3">
          <Field label="Equipment Type" value={unitType} onChange={setUnitType} conf={result.confidence?.unitType} />
          <Field label="Brand" value={brand} onChange={setBrand} conf={result.confidence?.brand} />
          <Field label="Model" value={model} onChange={setModel} conf={result.confidence?.model} />
          <Field label="Serial" value={serial} onChange={setSerial} conf={result.confidence?.serial} />
          <Field label="Estimated Age" value={estimatedAge} onChange={setEstimatedAge} />
          <Field label="Condition" value={condition} onChange={setCondition} />

          {visibleIssues.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold text-amber-400 flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" /> Visible Issues
              </p>
              <ul className="text-xs text-foreground list-disc list-inside space-y-0.5">
                {visibleIssues.map((iss, i) => <li key={i}>{iss}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Single-photo analyzer button. Renders a small "Analyze with AI" pill. */
export function AnalyzePhotoButton({
  photo,
  onAnalyzed,
  className,
}: {
  photo: AnalyzablePhoto;
  onAnalyzed?: () => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PhotoReviewResult | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const r = await analyzePhoto(photo);
      setResult(r);
    } catch (e: any) {
      toast.error(e?.message || "AI review failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={
          className ||
          "inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
        }
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        {busy ? "Analyzing…" : "Analyze with AI"}
      </button>
      {result && (
        <ConfirmModal photo={photo} result={result} onClose={() => setResult(null)} onSaved={() => onAnalyzed?.()} />
      )}
    </>
  );
}

/** Batch analyzer — runs photos sequentially, opening the confirm modal one at a time. */
export function BatchAnalyzeButton({
  photos,
  onAllDone,
}: {
  photos: AnalyzablePhoto[];
  onAllDone?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<{ photo: AnalyzablePhoto; result: PhotoReviewResult } | null>(null);

  if (photos.length < 2) return null;

  const start = async () => {
    setRunning(true);
    setIndex(0);
    await runOne(0);
  };

  const runOne = async (i: number) => {
    if (i >= photos.length) {
      setRunning(false);
      setCurrent(null);
      onAllDone?.();
      toast.success("All photos reviewed.");
      return;
    }
    setIndex(i);
    try {
      const r = await analyzePhoto(photos[i]);
      setCurrent({ photo: photos[i], result: r });
    } catch (e: any) {
      toast.error(`Photo ${i + 1}: ${e?.message || "failed"}`);
      // small delay to avoid hammering rate limits, then continue
      setTimeout(() => runOne(i + 1), 1200);
    }
  };

  const handleNext = () => {
    setCurrent(null);
    setTimeout(() => runOne(index + 1), 800);
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="w-full mt-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {running ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing {index + 1} of {photos.length}…</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Review All Unanalyzed Photos ({photos.length})</>
        )}
      </button>
      {current && (
        <ConfirmModal
          photo={current.photo}
          result={current.result}
          onClose={() => { setCurrent(null); setRunning(false); }}
          onSaved={handleNext}
        />
      )}
    </>
  );
}

/** Small badge for already-reviewed photos. */
export function AiReviewedBadge({ className }: { className?: string }) {
  return (
    <span className={className || "inline-flex items-center gap-0.5 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary"}>
      <Check className="h-2.5 w-2.5" /> AI Reviewed
    </span>
  );
}

/** Empty-state banner shown on systems with photos but no specs filled in. */
export function UnanalyzedPhotosBanner({
  unanalyzedCount,
  onAnalyze,
}: {
  unanalyzedCount: number;
  onAnalyze: () => void;
}) {
  if (unanalyzedCount === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3">
      <Sparkles className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary">You have {unanalyzedCount} photo{unanalyzedCount > 1 ? "s" : ""} we haven't analyzed yet</p>
        <p className="text-xs text-muted-foreground">Want us to try to identify your equipment?</p>
      </div>
      <Button size="sm" onClick={onAnalyze}>Analyze Photos</Button>
    </div>
  );
}

/** Helper hook: load saved system_photos with their analyzed state. */
export function useSystemPhotosWithAi(systemDetailId: string | null | undefined) {
  const [photos, setPhotos] = useState<Array<AnalyzablePhoto & { ai_analyzed: boolean }>>([]);
  const reload = async () => {
    if (!systemDetailId) { setPhotos([]); return; }
    const { data } = await supabase
      .from("system_photos" as any)
      .select("id, system_detail_id, storage_path, url, label, ai_analyzed")
      .eq("system_detail_id", systemDetailId);
    setPhotos(((data as any[]) || []).map((p) => ({
      id: p.id,
      systemDetailId: p.system_detail_id,
      url: p.url,
      storagePath: p.storage_path,
      label: p.label,
      bucket: "system-photos",
      ai_analyzed: !!p.ai_analyzed,
    })));
  };
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [systemDetailId]);
  return { photos, reload };
}
