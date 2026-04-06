import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { toast } from "sonner";

const SystemConfigScreen = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const displayName = decodeURIComponent(name || "");

  const [photo, setPhoto] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [lastService, setLastService] = useState("");
  const [warrantyExp, setWarrantyExp] = useState("");
  const [notes, setNotes] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
    }
  };

  const handleSave = () => {
    toast.success(`${displayName} details saved to your Home Passport!`);
    navigate("/systems");
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate("/systems")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Systems
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">{displayName}</h1>
      <p className="text-sm text-muted-foreground mb-6">Add details about this system to your passport.</p>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Photo</label>
        <label className="cursor-pointer block">
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          {photo ? (
            <div className="relative rounded-xl overflow-hidden border border-border h-48">
              <img src={photo} alt={displayName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-foreground" />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border bg-card h-48 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tap to upload a photo</span>
            </div>
          )}
        </label>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 mb-8">
        <FormField label="Brand" value={brand} onChange={setBrand} placeholder="e.g. Carrier, Rheem, LG" />
        <FormField label="Model Number" value={model} onChange={setModel} placeholder="e.g. 24ACC636A003" />
        <FormField label="Serial Number" value={serial} onChange={setSerial} placeholder="e.g. 2921G12345" />
        <FormField label="Install Date" value={installDate} onChange={setInstallDate} type="date" />
        <FormField label="Last Service Date" value={lastService} onChange={setLastService} type="date" />
        <FormField label="Warranty Expiration" value={warrantyExp} onChange={setWarrantyExp} type="date" />
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details, service provider info, etc."
            rows={3}
            className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2"
      >
        <Save className="h-5 w-5" /> Save to Passport
      </button>
    </div>
  );
};

const FormField = ({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </div>
);

export default SystemConfigScreen;
