import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save, X, Upload, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { getSpecFields, type SpecField } from "@/data/systemSpecFields";

const PHOTO_LABELS = ["Unit Photo", "Model Label", "Serial Number", "Installation", "Warranty Card"];
const DOC_TYPES = ["Owner's Manual", "Warranty Document", "Purchase Receipt", "Service Records", "Permit Documents", "Property Survey"];

interface PhotoItem {
  url: string;
  label: string;
}

interface DocItem {
  name: string;
  date: string;
}

const SystemConfigScreen = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const displayName = decodeURIComponent(name || "");

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

  // Specs (dynamic key-value)
  const [specs, setSpecs] = useState<Record<string, string | boolean | string[]>>({});

  // Documents
  const [docs, setDocs] = useState<Record<string, DocItem | null>>({});

  // Notes & Location
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  const specFields = useMemo(() => getSpecFields(displayName), [displayName]);

  const setSpec = (key: string, value: string | boolean | string[]) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  // Completeness calculation
  const completeness = useMemo(() => {
    let filled = 0;
    let total = 0;
    // Basic info (5 fields)
    [brand, model, serial, installDate, purchaseDate].forEach((v) => { total++; if (v) filled++; });
    // Service (7 fields)
    [warrantyExp, warrantyProvider, lastService, nextService, serviceCompany, servicePhone].forEach((v) => { total++; if (v) filled++; });
    total++; // extended warranty always counts
    filled++; // toggle always has a value
    // Specs
    specFields.forEach((f) => {
      total++;
      const val = specs[f.key];
      if (val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0)) filled++;
    });
    // Photos, docs, notes, location
    total += 4;
    if (photos.length > 0) filled++;
    if (Object.values(docs).some((d) => d !== null && d !== undefined)) filled++;
    if (notes) filled++;
    if (location) filled++;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [brand, model, serial, installDate, purchaseDate, warrantyExp, warrantyProvider, lastService, nextService, serviceCompany, servicePhone, extendedWarranty, specFields, specs, photos, docs, notes, location]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      label: photoLabel,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDocUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocs((prev) => ({ ...prev, [docType]: { name: file.name, date: new Date().toLocaleDateString() } }));
    }
  };

  const handleSave = () => {
    toast.success(`${displayName} details saved to your Home Passport!`);
    navigate("/systems");
  };

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <button onClick={() => navigate("/systems")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Systems
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">{displayName}</h1>
      <p className="text-xs text-muted-foreground mb-4">Add details about this system to your passport.</p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Completeness</span>
          <span className="text-xs font-bold text-primary">{completeness}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      {/* === PHOTOS === */}
      <SectionHeader title="Photos" />
      <div className="mb-2">
        <select
          value={photoLabel}
          onChange={(e) => setPhotoLabel(e.target.value)}
          className="rounded-lg border border-border bg-card py-2 px-3 text-xs text-foreground w-full mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {PHOTO_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Add Photos</span>
            <span className="text-xs text-muted-foreground/70">Tap to upload or take a photo</span>
          </div>
        </label>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {photos.map((p, i) => (
            <div key={i} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                <X className="h-3 w-3 text-foreground" />
              </button>
              <span className="absolute bottom-0 inset-x-0 bg-background/80 text-[9px] text-center text-foreground truncate px-1">{p.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* === BASIC INFO === */}
      <SectionHeader title="Basic Info" />
      <div className="space-y-3 mb-6">
        <Field label="Brand / Manufacturer" value={brand} onChange={setBrand} placeholder="e.g. Carrier, Rheem, LG" />
        <Field label="Model Number" value={model} onChange={setModel} placeholder="e.g. 24ACC636A003" />
        <Field label="Serial Number" value={serial} onChange={setSerial} placeholder="e.g. 2921G12345" />
        <Field label="Install Date" value={installDate} onChange={setInstallDate} type="date" />
        <Field label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} type="date" />
      </div>

      {/* === SERVICE & WARRANTY === */}
      <SectionHeader title="Service & Warranty" />
      <div className="space-y-3 mb-6">
        <Field label="Warranty Expiration Date" value={warrantyExp} onChange={setWarrantyExp} type="date" />
        <Field label="Warranty Provider" value={warrantyProvider} onChange={setWarrantyProvider} />
        <ToggleRow label="Extended Warranty" checked={extendedWarranty} onChange={setExtendedWarranty} />
        <Field label="Last Service Date" value={lastService} onChange={setLastService} type="date" />
        <Field label="Next Service Due" value={nextService} onChange={setNextService} type="date" />
        <Field label="Service Company Name" value={serviceCompany} onChange={setServiceCompany} />
        <Field label="Service Company Phone" value={servicePhone} onChange={setServicePhone} placeholder="(555) 123-4567" />
      </div>

      {/* === SPECIFICATIONS (dynamic) === */}
      <SectionHeader title="Specifications" />
      <div className="space-y-3 mb-6">
        {specFields.map((field) => (
          <SpecFieldInput key={field.key} field={field} value={specs[field.key]} onChange={(v) => setSpec(field.key, v)} />
        ))}
      </div>

      {/* === DOCUMENTS === */}
      <SectionHeader title="Documents & Manuals" />
      <div className="space-y-2 mb-6">
        {DOC_TYPES.map((docType) => {
          const doc = docs[docType];
          return (
            <div key={docType} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{docType}</p>
                {doc ? (
                  <p className="text-xs text-muted-foreground truncate">{doc.name} — {doc.date}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">No file uploaded</p>
                )}
              </div>
              <label className="cursor-pointer shrink-0">
                <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => handleDocUpload(docType, e)} />
                <Upload className="h-4 w-4 text-primary hover:text-primary/80 transition-colors" />
              </label>
            </div>
          );
        })}
      </div>

      {/* === LOCATION === */}
      <SectionHeader title="Location in Home" />
      <div className="mb-6">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Northeast corner of basement behind water heater"
          className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* === NOTES === */}
      <SectionHeader title="Notes" />
      <div className="mb-8">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details, service provider info, etc."
          rows={4}
          className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* === BUTTONS === */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2"
        >
          <Save className="h-5 w-5" /> Save to Passport
        </button>
        <button
          onClick={() => navigate("/systems")}
          className="w-full rounded-xl bg-secondary py-3.5 font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ─── Subcomponents ─── */

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-2">{title}</h2>
);

const Field = ({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </div>
);

const ToggleRow = ({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
    <span className="text-sm text-foreground">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SpecFieldInput = ({ field, value, onChange }: {
  field: SpecField;
  value: string | boolean | string[] | undefined;
  onChange: (v: string | boolean | string[]) => void;
}) => {
  switch (field.type) {
    case "text":
    case "number":
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {field.label}{field.suffix ? ` (${field.suffix})` : ""}
          </label>
          <input
            type={field.type === "number" ? "number" : "text"}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      );
    case "date":
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      );
    case "select": {
      const strVal = (value as string) || "";
      const warning = field.warning?.[strVal];
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
          <select
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select…</option>
            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {warning && (
            <div className="mt-1.5 rounded-lg bg-destructive/15 border border-destructive/30 px-3 py-2 text-xs text-destructive font-medium">
              {warning}
            </div>
          )}
        </div>
      );
    }
    case "toggle":
      return (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-foreground">{field.label}</span>
          <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} />
        </div>
      );
    case "checkboxes": {
      const selected = (value as string[]) || [];
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{field.label}</label>
          <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2.5">
            {field.options?.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) onChange([...selected, opt]);
                      else onChange(selected.filter((s) => s !== opt));
                    }}
                  />
                  <span className="text-sm text-foreground">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
};

export default SystemConfigScreen;
