import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, X, Upload, FileText, Sparkles, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { getSpecFields, type SpecField } from "@/data/systemSpecFields";
import { getAiData, type AiAutoFillData } from "@/data/aiAutoFillData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WaterHeaterLocation, HvacLocation, WaterSystemLocation } from "@/components/SystemLocationTracking";
import { AiPhotoPicker, AiScanReview, AiFieldScanButton, type ScanResult } from "@/components/AiPhotoScanner";
import { useManualSearch, ManualSearchIndicator, ManualFoundBanner, WarrantyStatusBadge, WarrantyInfoCard, RecallAlertBanner, SystemDocumentVault, type ManualSearchResult, type WarrantyInfo, type RecallInfo } from "@/components/ManualFinder";
import { WaterSourceTypeSelector, AdditionalWaterSources, UtilityContactCard } from "@/components/WaterSourceSelector";
import { SewerTypeSelector, MultipleSepticSystems, type SepticSystem } from "@/components/SewerSelector";
import { AnalyzePhotoButton, BatchAnalyzeButton, AiReviewedBadge, UnanalyzedPhotosBanner, analyzePhoto, type AnalyzablePhoto, type PhotoReviewResult } from "@/components/PhotoAiAnalyzer";
import { WaterFiltrationSection } from "@/components/WaterFiltrationSection";
import { HvacFilterSection } from "@/components/HvacFilterSection";
import ChimneyIntelligence from "@/components/ChimneyIntelligence";
import RecordsStatusSelector from "@/components/RecordsStatusSelector";
import SaveButtonMessage from "@/components/SaveButtonMessage";
import RefreshButton from "@/components/RefreshButton";
import type { RefreshScope } from "@/hooks/useDataRefresh";

const PHOTO_LABELS = ["Unit Photo", "Model Label", "Serial Number", "Installation", "Warranty Card"];
const DOC_TYPES = ["Owner's Manual", "Warranty Document", "Purchase Receipt", "Service Records", "Permit Documents", "Property Survey"];

// Defined at module scope so the component identity stays stable between
// renders. Defining it inside SystemConfigScreen caused inputs nested inside
// to remount on every keystroke, dropping focus.
const CollapsibleSectionView = ({ isOpen, title, onToggle, children }: {
  isOpen: boolean; title: string; onToggle: () => void; children: React.ReactNode;
}) => (
  <div className="mb-4 overflow-hidden">
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between py-2 mb-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
    </button>
    <div className={`transition-all duration-300 ease-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
      {children}
    </div>
  </div>
);

interface PhotoItem { url: string; label: string; storagePath?: string; id?: string; ai_analyzed?: boolean; }
interface DocItem { name: string; date: string; storagePath?: string; url?: string; }
interface AiSuggestion { key: string; label: string; value: string; target: "brand" | "model" | "serial" | "installDate" | "notes" | "spec"; specKey?: string; }

// Small teal badge
const AiBadge = () => (
  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 border border-primary/30 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide leading-none">
    <Sparkles className="h-2.5 w-2.5" /> AI
  </span>
);

const SystemConfigScreen = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const displayName = decodeURIComponent(name || "");
  const { user, activeProperty } = useAuth();
  const aiData = useMemo(() => getAiData(displayName), [displayName]);

  // Track which fields were filled by AI and confirmed
  const [aiFilledKeys, setAiFilledKeys] = useState<Set<string>>(new Set());
  const [aiApplied, setAiApplied] = useState(false);
  const [aiConfirmed, setAiConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPhotoBanner, setAiPhotoBanner] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [analyzingPhotoIds, setAnalyzingPhotoIds] = useState<Set<string>>(new Set());

  // Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoLabel, setPhotoLabel] = useState(PHOTO_LABELS[0]);

  // Basic info
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Service & Warranty
  const [warrantyExp, setWarrantyExp] = useState("");
  const [warrantyProvider, setWarrantyProvider] = useState("");
  const [extendedWarranty, setExtendedWarranty] = useState(false);
  const [lastService, setLastService] = useState("");
  const [nextService, setNextService] = useState("");
  const [serviceCompany, setServiceCompany] = useState("");
  const [servicePhone, setServicePhone] = useState("");

  // Specs
  const [specs, setSpecs] = useState<Record<string, string | boolean | string[]>>({});
  const [sourceTags, setSourceTags] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, DocItem | null>>({});
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [locationTracking, setLocationTracking] = useState<Record<string, string>>({});
  const [showAiPicker, setShowAiPicker] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualResult, setManualResult] = useState<ManualSearchResult | null>(null);
  const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
  const [recallInfo, setRecallInfo] = useState<RecallInfo | null>(null);

  // Water/Sewer type selection state
  const isWaterSource = displayName.toLowerCase().includes("water source");
  const isSewerWaste = displayName.toLowerCase().includes("sewer");
  const [waterType, setWaterType] = useState<"city" | "well" | "">("");
  const [sewerType, setSewerType] = useState<"city" | "septic" | "">("");
  const [additionalWaterSources, setAdditionalWaterSources] = useState<Array<{ type: string; location: string; pumpDetails: string; serviceContact: string }>>([]);
  const [septicSystems, setSepticSystems] = useState<SepticSystem[]>([{ name: "Main Septic", tankSize: "", tankMaterial: "", lastPumped: "", accessLocation: "", pumpCompany: "", pumpPhone: "", location: "", notes: "" }]);
  const [utilityContacts, setUtilityContacts] = useState<Record<string, string>>({});
  const [hvacHouseholdFactors, setHvacHouseholdFactors] = useState<string[]>([]);
  const [systemDetailId, setSystemDetailId] = useState<string | null>(null);

  const { searching: manualSearching, search: searchManual } = useManualSearch({
    brand, model, onResult: setManualResult,
  });

  const triggerManualSearch = useCallback(() => {
    if (brand || model) {
      searchManual();
      supabase.functions.invoke("manual-finder", { body: { brand, model, action: "extract_warranty" } })
        .then(({ data }) => { if (data?.result) setWarrantyInfo(data.result); });
      supabase.functions.invoke("manual-finder", { body: { brand, model, action: "check_recall" } })
        .then(({ data }) => { if (data?.result) setRecallInfo(data.result); });
    }
  }, [brand, model, searchManual]);

  const specFields = useMemo(() => {
    if (isWaterSource && waterType === "city") return getSpecFields("city water");
    if (isWaterSource && waterType === "well") return getSpecFields("well");
    if (isSewerWaste && sewerType === "city") return getSpecFields("sewer");
    if (isSewerWaste && sewerType === "septic") return getSpecFields("septic");
    return getSpecFields(displayName);
  }, [displayName, isWaterSource, isSewerWaste, waterType, sewerType]);

  const setSpec = (key: string, value: string | boolean | string[]) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const isEmptyValue = (value: unknown) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  const getConfidence = (result: PhotoReviewResult, keys: string[]) => {
    const confidence = result.confidence || {};
    for (const key of keys) {
      const value = confidence[key];
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  };
  const isHighConfidence = (result: PhotoReviewResult, keys: string[]) => {
    const confidence = getConfidence(result, keys);
    if (typeof confidence === "number") return confidence >= 0.8;
    return confidence?.toString().toLowerCase() === "high";
  };
  const stringifyList = (items?: string[] | null) => Array.isArray(items) ? items.filter(Boolean).join(", ") : "";
  const upsertSuggestion = (suggestion: AiSuggestion) => {
    setAiSuggestions((prev) => prev.some((s) => s.key === suggestion.key) ? prev : [...prev, suggestion]);
  };

  // Reload saved photos (used after AI analysis to refresh ai_analyzed flag).
  const reloadPhotos = useCallback(async () => {
    if (!systemDetailId) return;
    const { data } = await supabase
      .from("system_photos")
      .select("id, url, label, storage_path, ai_analyzed")
      .eq("system_detail_id", systemDetailId);
    if (data) setPhotos(data.map((p: any) => ({
      id: p.id, url: p.url, label: p.label, storagePath: p.storage_path, ai_analyzed: !!p.ai_analyzed,
    })));
  }, [systemDetailId]);

  // Apply AI data
  const applyAiData = useCallback(() => {
    if (!aiData) return;
    const keys = new Set<string>();
    if (aiData.brand) { setBrand(aiData.brand); keys.add("brand"); }
    if (aiData.model) { setModel(aiData.model); keys.add("model"); }
    if (aiData.serial) { setSerial(aiData.serial); keys.add("serial"); }
    if (aiData.installDate) { setInstallDate(aiData.installDate); keys.add("installDate"); }
    if (aiData.purchaseDate) { setPurchaseDate(aiData.purchaseDate); keys.add("purchaseDate"); }
    if (aiData.warrantyExp) { setWarrantyExp(aiData.warrantyExp); keys.add("warrantyExp"); }
    if (aiData.warrantyProvider) { setWarrantyProvider(aiData.warrantyProvider); keys.add("warrantyProvider"); }
    if (aiData.lastService) { setLastService(aiData.lastService); keys.add("lastService"); }
    if (aiData.nextService) { setNextService(aiData.nextService); keys.add("nextService"); }
    if (aiData.serviceCompany) { setServiceCompany(aiData.serviceCompany); keys.add("serviceCompany"); }
    if (aiData.servicePhone) { setServicePhone(aiData.servicePhone); keys.add("servicePhone"); }
    if (aiData.location) { setLocation(aiData.location); keys.add("location"); }
    if (aiData.specs) {
      setSpecs((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(aiData.specs!)) {
          next[k] = v;
          keys.add(`spec:${k}`);
        }
        return next;
      });
    }
    setAiFilledKeys(keys);
    setAiApplied(true);
    toast.success("AI data applied — review and confirm below.");
  }, [aiData]);

  const confirmAllAi = () => {
    setAiConfirmed(true);
    toast.success("All AI-sourced data confirmed!");
  };

  const handleScanResult = (result: ScanResult) => {
    setScanResult(result);
  };

  const handleScanConfirm = (fields: Record<string, string>) => {
    if (fields.brand) setBrand(fields.brand);
    if (fields.model) setModel(fields.model);
    if (fields.serial) setSerial(fields.serial);
    if (fields.manufacturer) setBrand(fields.manufacturer);
    if (fields.voltage) setSpec("voltage", fields.voltage);
    if (fields.amperage) setSpec("amperage", fields.amperage);
    if (fields.btu) setSpec("btu", fields.btu);
    if (fields.gallonCapacity) setSpec("gallonCapacity", fields.gallonCapacity);
    if (fields.filterSize) setSpec("filterSize", fields.filterSize);
    if (fields.serviceCompany) setServiceCompany(fields.serviceCompany);
    if (fields.servicePhone) setServicePhone(fields.servicePhone);
    setScanResult(null);
    toast.success("AI scan data saved to form!");
  };

  const analyzeUploadedPhoto = async (photo: AnalyzablePhoto) => {
    setAnalyzingPhotoIds((prev) => new Set(prev).add(photo.id));
    try {
      const result = await analyzePhoto(photo);
      const high: Record<string, any> = {};
      const nextSpecs = { ...specs };
      const nextTags = { ...sourceTags };
      const add = (target: AiSuggestion["target"], key: string, label: string, value: string | null | undefined, confidenceKeys: string[], specKey?: string) => {
        if (!value) return;
        const current = target === "brand" ? brand : target === "model" ? model : target === "serial" ? serial : target === "installDate" ? installDate : target === "notes" ? notes : specKey ? specs[specKey] : undefined;
        if (!isEmptyValue(current)) return;
        if (isHighConfidence(result, confidenceKeys)) {
          if (target === "brand") { high.brand = value; setBrand(value); nextTags.brand = "AI_INFERRED"; }
          if (target === "model") { high.model = value; setModel(value); nextTags.model = "AI_INFERRED"; }
          if (target === "serial") { high.serial_number = value; setSerial(value); nextTags.serial = "AI_INFERRED"; }
          if (target === "installDate") { high.install_date = value; setInstallDate(value); nextTags.installDate = "AI_INFERRED"; }
          if (target === "spec" && specKey) { nextSpecs[specKey] = value; nextTags[`spec:${specKey}`] = "AI_INFERRED"; }
        } else {
          upsertSuggestion({ key: `${photo.id}:${key}`, label, value, target, specKey });
        }
      };

      add("brand", "brand", "Brand / Manufacturer", result.manufacturer || result.brand, ["manufacturer", "brand"]);
      add("model", "model", "Model", result.modelNumber || result.model || result.modelName, ["modelNumber", "model", "modelName"]);
      add("serial", "serial", "Serial Number", result.serialNumber || result.serial, ["serialNumber", "serial"]);
      add("installDate", "manufactureYear", "Manufacture Year", result.manufactureYear, ["manufactureYear"]);
      add("spec", "fuelType", "Fuel Type", result.fuelType, ["fuelType"], "fuelType");
      add("spec", "capacity", "Capacity / Size", result.capacity || result.size, ["capacity", "size"], displayName.toLowerCase().includes("hvac") ? "hvacCapacity" : "capacity");

      const observations = [result.condition && `Condition: ${result.condition}`, stringifyList(result.warningLabels) && `Warning labels: ${stringifyList(result.warningLabels)}`, stringifyList(result.visibleIssues) && `Visible issues: ${stringifyList(result.visibleIssues)}`].filter(Boolean).join(" • ");
      if (observations && !notes) { high.notes = `[AI photo review] ${observations}`; setNotes(high.notes); nextTags.notes = "AI_INFERRED"; }

      const { error: photoErr } = await supabase.from("system_photos" as any).update({ ai_analyzed: true, ai_analyzed_at: new Date().toISOString(), ai_analysis_result: result } as any).eq("id", photo.id);
      if (photoErr) throw photoErr;
      setSpecs(nextSpecs); setSourceTags(nextTags); setAiPhotoBanner(true);
      if (photo.systemDetailId) {
        const { error: detailErr } = await supabase.from("system_details").update({ ...high, specs: nextSpecs as any, source_tags: nextTags as any }).eq("id", photo.systemDetailId);
        if (detailErr) throw detailErr;
      }
      setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, ai_analyzed: true } : p));
    } catch (e) {
      console.error("[SystemConfig] background photo AI failed", e);
    } finally {
      setAnalyzingPhotoIds((prev) => { const next = new Set(prev); next.delete(photo.id); return next; });
    }
  };

  const isAiField = (key: string) => aiApplied && !aiConfirmed && aiFilledKeys.has(key);
  const hasAiSource = (key: string) => isAiField(key) || sourceTags[key] === "AI_INFERRED";

  const applyAiSuggestion = (suggestion: AiSuggestion) => {
    if (suggestion.target === "brand") setBrand(suggestion.value);
    if (suggestion.target === "model") setModel(suggestion.value);
    if (suggestion.target === "serial") setSerial(suggestion.value);
    if (suggestion.target === "installDate") setInstallDate(suggestion.value);
    if (suggestion.target === "notes") setNotes((prev) => prev ? `${prev}\n\n${suggestion.value}` : suggestion.value);
    if (suggestion.target === "spec" && suggestion.specKey) setSpec(suggestion.specKey, suggestion.value);
    setAiSuggestions((prev) => prev.filter((s) => s.key !== suggestion.key));
  };

  const dismissAiSuggestion = (key: string) => setAiSuggestions((prev) => prev.filter((s) => s.key !== key));

  // Completeness
  const completeness = useMemo(() => {
    let filled = 0, total = 0;
    [brand, model, serial, installDate, purchaseDate].forEach((v) => { total++; if (v) filled++; });
    [warrantyExp, warrantyProvider, lastService, nextService, serviceCompany, servicePhone].forEach((v) => { total++; if (v) filled++; });
    total++; filled++;
    specFields.forEach((f) => { total++; const val = specs[f.key]; if (val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) filled++; });
    total += 4;
    if (photos.length > 0) filled++;
    if (Object.values(docs).some((d) => d !== null && d !== undefined)) filled++;
    if (notes) filled++;
    if (location) filled++;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [brand, model, serial, installDate, purchaseDate, warrantyExp, warrantyProvider, lastService, nextService, serviceCompany, servicePhone, specFields, specs, photos, docs, notes, location]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    for (const file of Array.from(files)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("system-photos").upload(path, file);
      if (error) { toast.error("Photo upload failed"); continue; }
      const { data: signedData } = await supabase.storage.from("system-photos").createSignedUrl(path, 3600);
      if (!signedData?.signedUrl) { toast.error("Failed to get photo URL"); continue; }
      setPhotos((prev) => [...prev, { url: signedData.signedUrl, label: photoLabel, storagePath: path }]);
    }
  };

  const handleDocUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("system-documents").upload(path, file);
    if (error) { toast.error("Document upload failed"); return; }
    const { data: signedData } = await supabase.storage.from("system-documents").createSignedUrl(path, 3600);
    if (!signedData?.signedUrl) { toast.error("Failed to get document URL"); return; }
    setDocs((prev) => ({ ...prev, [docType]: { name: file.name, date: new Date().toLocaleDateString(), storagePath: path, url: signedData.signedUrl } }));
  };

  const deletePhoto = async (photo: PhotoItem, index: number) => {
    // Unsaved (no DB id) — just remove from local state.
    if (!photo.id) {
      if (photo.storagePath) {
        await supabase.storage.from("system-photos").remove([photo.storagePath]).catch(() => {});
      }
      setPhotos((prev) => prev.filter((_, idx) => idx !== index));
      return;
    }
    try {
      const { error: dbErr } = await supabase.from("system_photos").delete().eq("id", photo.id);
      if (dbErr) throw dbErr;
      if (photo.storagePath) {
        const { error: stErr } = await supabase.storage.from("system-photos").remove([photo.storagePath]);
        if (stErr) console.warn("[SystemConfig] storage remove failed", stErr);
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success("Photo deleted");
    } catch (e: any) {
      console.error("[SystemConfig] photo delete failed", e);
      toast.error("Couldn't delete photo. Please try again.");
    }
  };

  const buildSystemPayload = (overrideSpecs: Record<string, string | boolean | string[]> = {}) => ({
    property_id: activeProperty!.id,
    user_id: user!.id,
    system_name: displayName,
    brand: brand || null,
    model: model || null,
    serial_number: serial || null,
    install_date: installDate || null,
    purchase_date: purchaseDate || null,
    warranty_exp: warrantyExp || null,
    warranty_provider: warrantyProvider || null,
    extended_warranty: extendedWarranty,
    last_service: lastService || null,
    next_service: nextService || null,
    service_company: serviceCompany || null,
    service_phone: servicePhone || null,
    specs: { ...specs, ...overrideSpecs } as any,
    notes: notes || null,
    location_in_home: location || null,
    source_tags: sourceTags as any,
    status: "configured",
  });

  const saveSystemDetails = async (overrideSpecs: Record<string, string | boolean | string[]> = {}) => {
    const payload = buildSystemPayload(overrideSpecs);
    console.info("[SystemConfig] system_details write payload", { table: "system_details", property_id: payload.property_id, system_name: payload.system_name, payload });

    const { data: existing, error: lookupErr } = await supabase
      .from("system_details")
      .select("id, property_id, user_id, system_name")
      .eq("property_id", activeProperty!.id)
      .eq("system_name", displayName)
      .maybeSingle();
    console.info("[SystemConfig] system_details lookup response", { queried_property_id: activeProperty!.id, data: existing, error: lookupErr });
    if (lookupErr) throw lookupErr;

    if (existing) {
      const response = await supabase.from("system_details").update(payload).eq("id", existing.id).select("id, property_id, user_id, system_name").single();
      console.info("[SystemConfig] system_details update response", response);
      if (response.error) throw response.error;
      setSystemDetailId(response.data.id);
      return response.data.id;
    }

    const response = await supabase.from("system_details").insert(payload).select("id, property_id, user_id, system_name").single();
    console.info("[SystemConfig] system_details insert response", response);
    if (response.error) throw response.error;
    setSystemDetailId(response.data.id);
    return response.data.id;
  };

  const handleSave = async (opts?: { silent?: boolean; overrideSpecs?: Record<string, string | boolean | string[]> }) => {
    if (!user || !activeProperty) {
      toast.error("No active property. Please add a property first.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
    const savedSystemDetailId = await saveSystemDetails(opts?.overrideSpecs || {});

    // Save new photos (skip already-saved ones loaded from DB)
    for (const photo of photos) {
      if (photo.storagePath && !photo.url.includes("already-saved")) {
        const { data: existing } = await supabase.from("system_photos").select("id").eq("storage_path", photo.storagePath).maybeSingle();
        if (!existing) {
          await supabase.from("system_photos").insert({
            system_detail_id: savedSystemDetailId,
            user_id: user.id,
            storage_path: photo.storagePath,
            label: photo.label,
            url: photo.url,
          });
        }
      }
    }

    // Save new docs
    for (const [docType, doc] of Object.entries(docs)) {
      if (doc && doc.storagePath) {
        const { data: existing } = await supabase.from("system_documents").select("id").eq("storage_path", doc.storagePath).maybeSingle();
        if (!existing) {
          await supabase.from("system_documents").insert({
            system_detail_id: savedSystemDetailId,
            user_id: user.id,
            storage_path: doc.storagePath,
            doc_type: docType,
            file_name: doc.name,
            url: doc.url || "",
          });
        }
      }
    }

    if (opts?.silent) {
      toast.success("Filter setup saved");
    } else {
      toast.success(`${displayName} details saved to your ComingHomeIQ profile!`);
      navigate("/systems");
    }
    } catch (e: any) {
      console.error("[SystemConfig] save failed", e);
      toast.error(opts?.silent ? "Couldn't save your information — please try again." : "Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load existing data on mount
  useEffect(() => {
    if (!user || !activeProperty) return;
    const load = async () => {
      const { data } = await supabase
        .from("system_details")
        .select("*")
        .eq("property_id", activeProperty.id)
        .eq("system_name", displayName)
        .maybeSingle();
      if (!data) return;
      setSystemDetailId(data.id);
      if (data.brand) setBrand(data.brand);
      if (data.model) setModel(data.model);
      if (data.serial_number) setSerial(data.serial_number);
      if (data.install_date) setInstallDate(data.install_date);
      if (data.purchase_date) setPurchaseDate(data.purchase_date);
      if (data.warranty_exp) setWarrantyExp(data.warranty_exp);
      if (data.warranty_provider) setWarrantyProvider(data.warranty_provider);
      if (data.extended_warranty) setExtendedWarranty(data.extended_warranty);
      if (data.last_service) setLastService(data.last_service);
      if (data.next_service) setNextService(data.next_service);
      if (data.service_company) setServiceCompany(data.service_company);
      if (data.service_phone) setServicePhone(data.service_phone);
      if (data.specs && typeof data.specs === "object") setSpecs(data.specs as Record<string, string | boolean | string[]>);
      if ((data as any).source_tags && typeof (data as any).source_tags === "object") setSourceTags((data as any).source_tags as Record<string, string>);
      // Restore water type from specs if saved
      if (displayName.toLowerCase().includes("water source")) {
        const s = data.specs as Record<string, any>;
        if (s?.waterType) setWaterType(s.waterType);
      }
      if (data.notes) setNotes(data.notes);
      if (data.location_in_home) setLocation(data.location_in_home);

      // Load photos
      const { data: photoData } = await supabase
        .from("system_photos")
        .select("id, url, label, storage_path, ai_analyzed")
        .eq("system_detail_id", data.id);
      if (photoData) setPhotos(photoData.map((p: any) => ({
        id: p.id, url: p.url, label: p.label, storagePath: p.storage_path, ai_analyzed: !!p.ai_analyzed,
      })));

      // Load docs
      const { data: docData } = await supabase
        .from("system_documents")
        .select("*")
        .eq("system_detail_id", data.id);
      if (docData) {
        const docMap: Record<string, DocItem> = {};
        docData.forEach((d: any) => { docMap[d.doc_type] = { name: d.file_name, date: new Date(d.created_at).toLocaleDateString(), storagePath: d.storage_path, url: d.url }; });
        setDocs(docMap);
      }
    };
    load();
  }, [user, activeProperty, displayName]);

  // Whether we need a type selection first (progressive disclosure)
  const needsTypeSelection = isWaterSource || isSewerWaste;
  const typeSelected = (isWaterSource && !!waterType) || (isSewerWaste && !!sewerType) || !needsTypeSelection;
  const hideBasicInfo = isWaterSource || isSewerWaste;

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["specs"]));
  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };


  return (
    <div className="min-h-screen pb-32 max-w-lg lg:max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => navigate("/systems")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Systems
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
        <RefreshButton scope={(displayName.toLowerCase().includes("well") ? "well" : displayName.toLowerCase().includes("septic") || displayName.toLowerCase().includes("sewer") ? "septic" : displayName.toLowerCase().includes("hvac") ? "hvac" : displayName.toLowerCase().includes("roof") ? "roof" : displayName.toLowerCase().includes("electrical") ? "electrical" : displayName.toLowerCase().includes("plumbing") ? "plumbing" : displayName.toLowerCase().includes("water heater") ? "water_heater" : "full") as RefreshScope} variant="compact" />
      </div>
      <p className="text-xs text-muted-foreground mb-4">Add details about this system to your passport.</p>

      {/* Progress Bar — always visible */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Completeness</span>
          <span className="text-xs font-bold text-primary">{completeness}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      {/* AI Auto-Fill Banner — always visible */}
      {aiData && !aiApplied && (
        <button onClick={applyAiData} className="w-full mb-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-center gap-3 hover:bg-primary/15 transition-colors text-left">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">AI found data for this system</p>
            <p className="text-xs text-primary/70">Tap to review and confirm</p>
          </div>
        </button>
      )}
      {aiData && aiApplied && !aiConfirmed && (
        <div className="mb-2 space-y-2">
          <button onClick={confirmAllAi} className="w-full rounded-xl bg-primary/15 border border-primary/30 px-4 py-3 flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Confirm All AI Data</span>
          </button>
        </div>
      )}
      {aiData && (
        <p className="text-[10px] text-muted-foreground/60 mb-6 italic">Data sourced from public records and permit history. Always verify with original documentation.</p>
      )}
      {aiPhotoBanner && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-primary">We identified some details from your photo — review them below.</p>
        </div>
      )}
      {aiSuggestions.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">AI suggestions to review</p>
          {aiSuggestions.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="flex-1 text-muted-foreground"><strong className="text-foreground">{s.label}:</strong> {s.value}</span>
              <button type="button" onClick={() => applyAiSuggestion(s)} className="text-primary font-semibold">Accept</button>
              <button type="button" onClick={() => dismissAiSuggestion(s.key)} className="text-muted-foreground">Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* Records Status & Recovery Guide */}
      <RecordsStatusSelector
        systemName={displayName}
        hasDocuments={Object.values(docs).some(d => d !== null && d !== undefined)}
      />

      {/* ═══ WATER SOURCE — TYPE SELECTOR ═══ */}
      {isWaterSource && (
        <div className="mb-6">
          <WaterSourceTypeSelector onSelect={(t) => { setWaterType(t); setExpandedSections(new Set(["specs"])); }} selected={waterType || undefined} />
          {waterType && (
            <button onClick={() => setWaterType("")} className="text-xs text-primary hover:underline mt-3 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Change water source type
            </button>
          )}
        </div>
      )}

      {/* ═══ SEWER — TYPE SELECTOR ═══ */}
      {isSewerWaste && (
        <div className="mb-6">
          <SewerTypeSelector onSelect={(t) => { setSewerType(t); setExpandedSections(new Set(["specs"])); }} selected={sewerType || undefined} />
          {sewerType && (
            <button onClick={() => setSewerType("")} className="text-xs text-primary hover:underline mt-3 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Change sewer type
            </button>
          )}
        </div>
      )}

      {/* ═══ ALL FIELDS — ONLY SHOWN AFTER TYPE SELECTION (or for non-water/sewer systems) ═══ */}
      {typeSelected && (
        <div className="animate-fade-in">

          {/* ── Water Source: type-specific content ── */}
          {isWaterSource && waterType === "city" && (
            <div className="mb-6">
              <UtilityContactCard title="Water Utility Contact Information" values={utilityContacts} onChange={setUtilityContacts} />
            </div>
          )}

          {/* ── Sewer: type-specific content ── */}
          {isSewerWaste && sewerType === "city" && (
            <div className="mb-6">
              <UtilityContactCard title="Sewer Utility Contact Information" values={utilityContacts} onChange={setUtilityContacts} />
            </div>
          )}
          {isSewerWaste && sewerType === "septic" && (
            <div className="mb-6">
              <MultipleSepticSystems systems={septicSystems} onChange={setSepticSystems} />
            </div>
          )}

          {/* ── Water Filtration Section ── */}
          {isWaterSource && waterType && (
            <WaterFiltrationSection waterType={waterType as "city" | "well"} householdFactors={hvacHouseholdFactors} />
          )}

          {/* ── HVAC Filter & Air Quality Section ── */}
          {displayName.toLowerCase().includes("hvac") && (
            <HvacFilterSection
              filterSize={(specs["filterSize"] as string) || ""}
              onFilterSizeChange={(size) => setSpec("filterSize", size)}
              onHouseholdFactorsChange={setHvacHouseholdFactors}
              onRecommendationChange={({ filterType, changeFrequency }) => {
                if (!specs["filterType"]) setSpec("filterType", filterType);
                if (!specs["changeFrequency"]) setSpec("changeFrequency", changeFrequency);
              }}
              onSetupComplete={async ({ filterSize, householdFactors, filterType, changeFrequency }) => {
                const wizardSpecs = { ...specs, filterSize, householdFactors, filterType, changeFrequency, setup_complete: true };
                setSpecs(wizardSpecs);
                setHvacHouseholdFactors(householdFactors);
                try {
                  await saveSystemDetails(wizardSpecs);
                  toast.success("Filter setup saved");
                  return true;
                } catch (e) {
                  console.error("[SystemConfig] HVAC wizard save failed", e);
                  toast.error("Couldn't save your information — please try again.");
                  return false;
                }
              }}
            />
          )}

          {/* ── Chimney & Fireplace Intelligence ── */}
          {(displayName.toLowerCase().includes("chimney") || displayName.toLowerCase().includes("fireplace")) && (
            <ChimneyIntelligence specs={specs} homeYearBuilt={activeProperty?.year_built} />
          )}

          {/* ── Specifications (contextual fields based on type) — hidden for city water ── */}
          {specFields.length > 0 && !(isWaterSource && waterType === "city") && (
            <CollapsibleSectionView isOpen={expandedSections.has("specs")} title="Specifications" onToggle={() => toggleSection("specs")}>
              <div className="space-y-3">
                {specFields.map((field) => (
                  <SpecFieldInput key={field.key} field={field} value={specs[field.key]} onChange={(v) => setSpec(field.key, v)} ai={hasAiSource(`spec:${field.key}`)} />
                ))}
              </div>
            </CollapsibleSectionView>
          )}

          {/* ── Photos ── */}
          <CollapsibleSectionView isOpen={expandedSections.has("photos")} title="Photos" onToggle={() => toggleSection("photos")}>
            {systemDetailId && photos.some((p) => p.id && !p.ai_analyzed) && !brand && !model && !serial && (
              <UnanalyzedPhotosBanner
                unanalyzedCount={photos.filter((p) => p.id && !p.ai_analyzed).length}
                onAnalyze={() => {
                  // Scroll to the batch button; user clicks it from there.
                  document.getElementById("batch-analyze-btn")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            )}
            <div className="mb-2">
              <select value={photoLabel} onChange={(e) => setPhotoLabel(e.target.value)}
                className="rounded-lg border border-border bg-card py-2 px-3 text-xs text-foreground w-full mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {PHOTO_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={() => setShowAiPicker(true)} className="w-full">
                <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Photos</span>
                  <span className="text-xs text-primary/70 flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Scan available — tap to identify product</span>
                </div>
              </button>
            </div>
            {photos.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
                  {photos.map((p, i) => (
                    <div key={p.id || i} className="rounded-lg border border-border bg-card/50 overflow-hidden">
                       <div className="relative w-full aspect-square">
                         <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                         <button onClick={() => deletePhoto(p, i)} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                           <X className="h-3 w-3 text-foreground" />
                         </button>
                       </div>
                      <div className="p-2 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground truncate">{p.label}</p>
                        {p.id ? (
                          p.ai_analyzed ? (
                            <AiReviewedBadge />
                          ) : (
                            <AnalyzePhotoButton
                              photo={{ id: p.id, systemDetailId: systemDetailId!, url: p.url, storagePath: p.storagePath, label: p.label, bucket: "system-photos", systemName: displayName } as AnalyzablePhoto}
                              onAnalyzed={reloadPhotos}
                            />
                          )
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic">Save first to enable AI review</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {systemDetailId && (
                  <div id="batch-analyze-btn">
                    <BatchAnalyzeButton
                      photos={photos
                        .filter((p) => p.id && !p.ai_analyzed)
                        .map((p) => ({ id: p.id!, systemDetailId: systemDetailId, url: p.url, storagePath: p.storagePath, label: p.label, bucket: "system-photos", systemName: displayName } as AnalyzablePhoto))}
                      onAllDone={reloadPhotos}
                    />
                  </div>
                )}
              </>
            )}
          </CollapsibleSectionView>

          {/* ── Basic Info — hidden for Water/Sewer ── */}
          {!hideBasicInfo && (
            <CollapsibleSectionView isOpen={expandedSections.has("basic")} title="Basic Info" onToggle={() => toggleSection("basic")}>
              <div className="space-y-3">
                <FieldWithScan label="Brand / Manufacturer" value={brand} onChange={setBrand} placeholder="e.g. Carrier, Rheem, LG" ai={isAiField("brand")} scanField="brand" />
                <FieldWithScan label="Model Number" value={model} onChange={setModel} placeholder="e.g. 24ACC636A003" ai={isAiField("model")} scanField="model" />
                <FieldWithScan label="Serial Number" value={serial} onChange={setSerial} placeholder="e.g. 2921G12345" ai={isAiField("serial")} scanField="serial" />
                <Field label="Install Date" value={installDate} onChange={setInstallDate} type="date" ai={isAiField("installDate")} />
                <Field label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} type="date" ai={isAiField("purchaseDate")} />
                {(brand || model) && (
                  <button onClick={triggerManualSearch} disabled={manualSearching}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50">
                    <Sparkles className="h-3.5 w-3.5" /> {manualSearching ? "Searching..." : "Find Manual & Check Recalls"}
                  </button>
                )}
                <ManualSearchIndicator searching={manualSearching} />
              </div>
            </CollapsibleSectionView>
          )}

          {/* Manual Search Result */}
          {manualResult && (
            <div className="mb-6">
              <ManualFoundBanner
                result={manualResult}
                onView={() => { if (manualResult.manualUrl) window.open(manualResult.manualUrl, "_blank"); }}
                onDownload={() => toast.success("Manual saved to your document vault!")}
              />
            </div>
          )}

          {/* Recall Alert */}
          {recallInfo && (
            <div className="mb-6">
              <RecallAlertBanner info={recallInfo} />
            </div>
          )}

          {/* ── Service & Warranty ── */}
          <CollapsibleSectionView isOpen={expandedSections.has("service")} title="Service & Warranty" onToggle={() => toggleSection("service")}>
            <div className="space-y-3">
              <Field label="Warranty Expiration Date" value={warrantyExp} onChange={setWarrantyExp} type="date" ai={isAiField("warrantyExp")} />
              <Field label="Warranty Provider" value={warrantyProvider} onChange={setWarrantyProvider} ai={isAiField("warrantyProvider")} />
              <ToggleRow label="Extended Warranty" checked={extendedWarranty} onChange={setExtendedWarranty} />
              <Field label="Last Service Date" value={lastService} onChange={setLastService} type="date" ai={isAiField("lastService")} />
              <Field label="Next Service Due" value={nextService} onChange={setNextService} type="date" ai={isAiField("nextService")} />
              <Field label="Service Company Name" value={serviceCompany} onChange={setServiceCompany} ai={isAiField("serviceCompany")} />
              <Field label="Service Company Phone" value={servicePhone} onChange={setServicePhone} placeholder="(555) 123-4567" ai={isAiField("servicePhone")} />
              <WarrantyStatusBadge warrantyExp={warrantyExp} />
            </div>
          </CollapsibleSectionView>

          {/* AI Warranty Info */}
          {warrantyInfo && (
            <div className="mb-6">
              <WarrantyInfoCard info={warrantyInfo} />
            </div>
          )}

          {/* ── Documents ── */}
          <CollapsibleSectionView isOpen={expandedSections.has("docs")} title="Documents & Manuals" onToggle={() => toggleSection("docs")}>
            <div className="space-y-2">
              {DOC_TYPES.map((docType) => {
                const doc = docs[docType];
                return (
                  <div key={docType} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{docType}</p>
                      {doc ? <p className="text-xs text-muted-foreground truncate">{doc.name} — {doc.date}</p> : <p className="text-xs text-muted-foreground/50 italic">No file uploaded</p>}
                    </div>
                    <label className="cursor-pointer shrink-0">
                      <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => handleDocUpload(docType, e)} />
                      <Upload className="h-4 w-4 text-primary hover:text-primary/80 transition-colors" />
                    </label>
                  </div>
                );
              })}
            </div>
          </CollapsibleSectionView>

          {/* ── Location ── */}
          <CollapsibleSectionView isOpen={expandedSections.has("location")} title="Location in Home" onToggle={() => toggleSection("location")}>
            <div>
              <div className="relative">
                {isAiField("location") && <div className="absolute right-3 top-1/2 -translate-y-1/2"><AiBadge /></div>}
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Northeast corner of basement behind water heater"
                  className={`w-full rounded-xl border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${isAiField("location") ? "border-primary/40 pr-16" : "border-border"}`} />
              </div>
            </div>
            {displayName.toLowerCase().includes("water heater") && <WaterHeaterLocation data={locationTracking} onChange={setLocationTracking} />}
            {(displayName.toLowerCase().includes("hvac") || displayName.toLowerCase().includes("heating")) && <HvacLocation data={locationTracking} onChange={setLocationTracking} />}
            {(displayName.toLowerCase().includes("well") || displayName.toLowerCase().includes("water source") || displayName.toLowerCase().includes("plumbing")) && <WaterSystemLocation data={locationTracking} onChange={setLocationTracking} />}
          </CollapsibleSectionView>

          {/* ── Notes ── */}
          <CollapsibleSectionView isOpen={expandedSections.has("notes")} title="Notes" onToggle={() => toggleSection("notes")}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details, service provider info, etc." rows={3}
              className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </CollapsibleSectionView>

          {/* ── Additional Water Sources (collapsed by default) ── */}
          {isWaterSource && waterType && (
            <CollapsibleSectionView isOpen={expandedSections.has("additional-water")} title="Additional Water Sources" onToggle={() => toggleSection("additional-water")}>
              <AdditionalWaterSources sources={additionalWaterSources} onChange={setAdditionalWaterSources} />
            </CollapsibleSectionView>
          )}

          {/* ═══ SAVE BUTTONS ═══ */}
          <div className="space-y-3 mt-6">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" /> {saving ? "Saving…" : "Save to Passport"}
            </button>
            <SaveButtonMessage />
            <button onClick={() => navigate("/systems")} className="w-full rounded-xl bg-secondary py-3.5 font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Type not selected yet — show prompt */}
      {needsTypeSelection && !typeSelected && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Select a type above to configure your {displayName.toLowerCase()}.</p>
        </div>
      )}

      {/* AI Photo Picker */}
      <AiPhotoPicker
        open={showAiPicker}
        onClose={() => setShowAiPicker(false)}
        onPhotoSelected={async (file, preview) => {
          if (!user || !activeProperty) return;
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("system-photos").upload(path, file);
          if (error) { toast.error("Photo upload failed"); return; }
          const { data: signedData } = await supabase.storage.from("system-photos").createSignedUrl(path, 3600);
          if (!signedData?.signedUrl) { toast.error("Failed to get photo URL"); return; }
          try {
            const detailId = systemDetailId || await saveSystemDetails();
            const { data: photoRow, error: photoErr } = await supabase.from("system_photos").insert({
              system_detail_id: detailId,
              user_id: user.id,
              storage_path: path,
              label: photoLabel,
              url: signedData.signedUrl,
            }).select("id, url, label, storage_path, ai_analyzed").single();
            if (photoErr) throw photoErr;
            const nextPhoto = { id: photoRow.id, url: photoRow.url, label: photoRow.label, storagePath: photoRow.storage_path, ai_analyzed: !!photoRow.ai_analyzed };
            setPhotos((prev) => [...prev, nextPhoto]);
            void analyzeUploadedPhoto({ id: photoRow.id, systemDetailId: detailId, url: photoRow.url, storagePath: photoRow.storage_path, label: photoRow.label, bucket: "system-photos", systemName: displayName });
          } catch (e) {
            console.error("[SystemConfig] photo metadata save failed", e);
            toast.error("Photo uploaded, but couldn't save it to this system.");
          }
        }}
        onScanComplete={handleScanResult}
        showReceiptMode
      />

      {/* AI Scan Review */}
      {scanResult && (
        <AiScanReview
          result={scanResult}
          onConfirm={handleScanConfirm}
          onClose={() => setScanResult(null)}
        />
      )}
    </div>
  );
};

/* ─── Subcomponents ─── */

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-2">{title}</h2>
);

const HONEST_EMPTY_PLACEHOLDER = "Unknown — tap to add";

const Field = ({ label, value, onChange, placeholder, type = "text", ai = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; ai?: boolean;
}) => {
  // Honest empty: when no value and no AI source, show "Unknown — tap to add"
  const effectivePlaceholder = !value && !ai ? HONEST_EMPTY_PLACEHOLDER : placeholder;
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {label} {ai && <AiBadge />}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={effectivePlaceholder}
        className={`w-full rounded-xl border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${ai ? "border-primary/40" : "border-border"}`} />
    </div>
  );
};

const FieldWithScan = ({ label, value, onChange, placeholder, ai = false, scanField }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; ai?: boolean; scanField: string;
}) => {
  const effectivePlaceholder = !value && !ai ? HONEST_EMPTY_PLACEHOLDER : placeholder;
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {label} {ai && <AiBadge />}
      </label>
      <div className="flex gap-2">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={effectivePlaceholder}
          className={`flex-1 rounded-xl border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 ${ai ? "border-primary/40" : "border-border"}`} />
        <AiFieldScanButton fieldName={scanField} onResult={onChange} />
      </div>
    </div>
  );
};

const ToggleRow = ({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
    <span className="text-sm text-foreground">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SpecFieldInput = ({ field, value, onChange, ai = false }: {
  field: SpecField; value: string | boolean | string[] | undefined; onChange: (v: string | boolean | string[]) => void; ai?: boolean;
}) => {
  const borderClass = ai ? "border-primary/40" : "border-border";
  const labelEl = (
    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
      {field.label}{field.suffix ? ` (${field.suffix})` : ""} {ai && <AiBadge />}
    </label>
  );

  switch (field.type) {
    case "text":
    case "number":
      {
        const strVal = (value as string) || "";
        const ph = !strVal && !ai ? HONEST_EMPTY_PLACEHOLDER : field.placeholder;
        return (
          <div>
            {labelEl}
            <input type={field.type === "number" ? "number" : "text"} value={strVal} onChange={(e) => onChange(e.target.value)} placeholder={ph}
              className={`w-full rounded-xl border ${borderClass} bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50`} />
          </div>
        );
      }
    case "date":
      return (
        <div>
          {labelEl}
          <input type="date" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border ${borderClass} bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`} />
        </div>
      );
    case "select": {
      const strVal = (value as string) || "";
      const warning = field.warning?.[strVal];
      return (
        <div>
          {labelEl}
          <select value={strVal} onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border ${borderClass} bg-card py-2.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}>
            <option value="">Select…</option>
            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {warning && (
            <div className="mt-1.5 rounded-lg bg-destructive/15 border border-destructive/30 px-3 py-2 text-xs text-destructive font-medium">{warning}</div>
          )}
        </div>
      );
    }
    case "toggle":
      return (
        <div className={`flex items-center justify-between rounded-xl border ${borderClass} bg-card px-4 py-3`}>
          <span className="text-sm text-foreground flex items-center gap-1.5">{field.label} {ai && <AiBadge />}</span>
          <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} />
        </div>
      );
    case "checkboxes": {
      const selected = (value as string[]) || [];
      return (
        <div>
          {labelEl}
          <div className={`rounded-xl border ${borderClass} bg-card px-4 py-3 space-y-2.5`}>
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...selected, opt]);
                    else onChange(selected.filter((s) => s !== opt));
                  }} />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
};

export default SystemConfigScreen;
