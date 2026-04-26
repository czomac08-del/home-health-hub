import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, Wrench, HardHat, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TRADE_TYPES = ["HVAC", "Electrical", "Plumbing", "Roofing", "Structural", "General", "Other"] as const;

const diySchema = z.object({
  description: z.string().trim().min(5, "Tell us briefly what you did").max(1000),
  date_completed: z.date(),
  photos: z.array(z.any()).min(1, "Upload at least one photo of the completed fix").max(5),
});

const proSchema = z.object({
  contractor_name: z.string().trim().min(2, "Contractor name required").max(120),
  contractor_license: z.string().trim().max(60).optional().or(z.literal("")),
  trade_type: z.string().min(1, "Select a trade"),
  date_completed: z.date(),
  documents: z.array(z.any()).min(1, "Upload at least one proof document"),
  photos: z.array(z.any()).max(5),
});

interface PhotoEntry {
  file: File;
  caption: string;
}

interface DocEntry {
  file: File;
  kind: "invoice" | "completion_report" | "permit";
}

export interface FixVerificationModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId: string;
  findingId: string;
  findingTitle: string;
  onSubmitted?: () => void;
}

export default function FixVerificationModal({
  open,
  onOpenChange,
  propertyId,
  findingId,
  findingTitle,
  onSubmitted,
}: FixVerificationModalProps) {
  const [tab, setTab] = useState<"diy" | "professional">("diy");
  const [submitting, setSubmitting] = useState(false);

  // DIY state
  const [diyDate, setDiyDate] = useState<Date | undefined>(new Date());
  const [diyDesc, setDiyDesc] = useState("");
  const [diyPhotos, setDiyPhotos] = useState<PhotoEntry[]>([]);
  const [diyReceipt, setDiyReceipt] = useState<File | null>(null);

  // Pro state
  const [proDate, setProDate] = useState<Date | undefined>(new Date());
  const [proName, setProName] = useState("");
  const [proLicense, setProLicense] = useState("");
  const [proTrade, setProTrade] = useState("");
  const [proDocs, setProDocs] = useState<DocEntry[]>([]);
  const [proPhotos, setProPhotos] = useState<PhotoEntry[]>([]);

  const reset = () => {
    setTab("diy");
    setDiyDate(new Date()); setDiyDesc(""); setDiyPhotos([]); setDiyReceipt(null);
    setProDate(new Date()); setProName(""); setProLicense(""); setProTrade("");
    setProDocs([]); setProPhotos([]);
  };

  const handlePhotoAdd = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<PhotoEntry[]>>,
    max = 5,
  ) => {
    const files = Array.from(e.target.files ?? []);
    setter((prev) => [...prev, ...files.map((f) => ({ file: f, caption: "" }))].slice(0, max));
    e.target.value = "";
  };

  const handleDocAdd = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: DocEntry["kind"],
  ) => {
    const files = Array.from(e.target.files ?? []);
    setProDocs((prev) => [...prev, ...files.map((f) => ({ file: f, kind }))]);
    e.target.value = "";
  };

  const uploadFiles = async (
    userId: string,
    folder: "fix_verification" | "pro_fix",
    items: { file: File; caption?: string; kind?: string }[],
  ) => {
    const out: { storage_path: string; url: string; file_name: string; caption?: string; kind?: string }[] = [];
    for (const item of items) {
      const ext = item.file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${propertyId}/${findingId}/${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("fix-verification").upload(path, item.file, {
        contentType: item.file.type || undefined,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("fix-verification").createSignedUrl
        ? await supabase.storage.from("fix-verification").createSignedUrl(path, 60 * 60 * 24 * 365)
        : { data: { signedUrl: "" } } as any;
      out.push({
        storage_path: path,
        url: (data as any)?.signedUrl ?? "",
        file_name: item.file.name,
        caption: item.caption,
        kind: item.kind,
      });
    }
    return out;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) throw new Error("Not signed in");

      let payload: any;
      let dataQualityFlag:
        | "unverified"
        | "receipt_verified"
        | "pro_verified"
        | "permit_verified" = "unverified";
      let hasPermit = false;

      if (tab === "diy") {
        const parsed = diySchema.safeParse({
          description: diyDesc,
          date_completed: diyDate,
          photos: diyPhotos,
        });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
          setSubmitting(false);
          return;
        }
        const photos = await uploadFiles(userId, "fix_verification", diyPhotos);
        const documents = diyReceipt
          ? await uploadFiles(userId, "fix_verification", [{ file: diyReceipt, kind: "receipt" }])
          : [];
        // Rule 2 — a receipt/invoice photo upgrades DIY to "Receipt Verified".
        const diyFlag: "unverified" | "receipt_verified" =
          diyReceipt ? "receipt_verified" : "unverified";
        payload = {
          user_id: userId,
          property_id: propertyId,
          finding_id: findingId,
          fix_type: "diy",
          date_completed: format(diyDate!, "yyyy-MM-dd"),
          description: diyDesc,
          photos,
          documents,
          data_quality_flag: diyFlag,
          has_permit: false,
        };
        dataQualityFlag = diyFlag as any;
      } else {
        const parsed = proSchema.safeParse({
          contractor_name: proName,
          contractor_license: proLicense,
          trade_type: proTrade,
          date_completed: proDate,
          documents: proDocs,
          photos: proPhotos,
        });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
          setSubmitting(false);
          return;
        }
        const documents = await uploadFiles(userId, "pro_fix", proDocs);
        const photos = proPhotos.length > 0
          ? await uploadFiles(userId, "pro_fix", proPhotos)
          : [];
        hasPermit = proDocs.some((d) => d.kind === "permit");
        dataQualityFlag = hasPermit ? "permit_verified" : "pro_verified";
        payload = {
          user_id: userId,
          property_id: propertyId,
          finding_id: findingId,
          fix_type: "professional",
          date_completed: format(proDate!, "yyyy-MM-dd"),
          contractor_name: proName,
          contractor_license: proLicense || null,
          trade_type: proTrade,
          photos,
          documents,
          data_quality_flag: dataQualityFlag,
          has_permit: hasPermit,
        };
      }

      const { data: fix, error: fixErr } = await supabase
        .from("fix_verifications")
        .insert(payload)
        .select("id")
        .single();
      if (fixErr) throw fixErr;

      const { error: updErr } = await supabase
        .from("inspection_findings")
        .update({
          status: "fixed",
          fix_verification_id: fix.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", findingId);
      if (updErr) throw updErr;

      if (dataQualityFlag === "receipt_verified") {
        toast.success("Your fix record has been upgraded to Receipt Verified");
      } else if (dataQualityFlag === "permit_verified") {
        toast.success("Your fix record has been upgraded to Permit Verified");
      } else if (dataQualityFlag === "pro_verified") {
        toast.success("Your fix record has been upgraded to Pro Verified");
      } else {
        toast.success("Fix saved as Owner Self-Reported");
      }
      onSubmitted?.();
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not save fix verification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Mark as Fixed</DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-medium text-foreground">{findingTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "diy" | "professional")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diy" className="gap-2">
              <Wrench className="h-3.5 w-3.5" /> I Fixed This Myself
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-2">
              <HardHat className="h-3.5 w-3.5" /> A Professional Fixed This
            </TabsTrigger>
          </TabsList>

          {/* ========== DIY ========== */}
          <TabsContent value="diy" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="diy-date">Date completed</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !diyDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {diyDate ? format(diyDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={diyDate}
                    onSelect={setDiyDate}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="diy-desc">What you did</Label>
              <Textarea
                id="diy-desc"
                value={diyDesc}
                onChange={(e) => setDiyDesc(e.target.value.slice(0, 1000))}
                placeholder="I replaced the GFCI outlet in the bathroom"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Photos of the completed fix · {diyPhotos.length}/5 (min 1)</Label>
              <FileGrid
                items={diyPhotos}
                onRemove={(i) => setDiyPhotos((p) => p.filter((_, ix) => ix !== i))}
                onCaption={(i, c) => setDiyPhotos((p) => p.map((it, ix) => (ix === i ? { ...it, caption: c } : it)))}
              />
              {diyPhotos.length < 5 && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 hover:bg-muted/30">
                  <Upload className="h-4 w-4" />
                  Add photos (show the completed fix, not the original problem)
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e, setDiyPhotos, 5)}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Receipt for materials (optional)</Label>
              {diyReceipt ? (
                <div className="flex items-center justify-between text-xs border border-border rounded-lg p-2">
                  <span className="truncate">{diyReceipt.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => setDiyReceipt(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 hover:bg-muted/30">
                  <Upload className="h-4 w-4" />
                  Upload receipt (PDF or image)
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setDiyReceipt(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="rounded-lg border border-[hsl(var(--health-amber))]/30 bg-[hsl(var(--health-amber))]/5 p-3 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-[hsl(var(--health-amber))] mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed">
                DIY fix records are homeowner-submitted and have not been independently verified.
                These records are stored permanently and may be reviewed by future buyers, agents, or inspectors.
              </p>
            </div>
          </TabsContent>

          {/* ========== PRO ========== */}
          <TabsContent value="professional" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pro-name">Contractor name</Label>
                <Input id="pro-name" value={proName} onChange={(e) => setProName(e.target.value.slice(0, 120))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pro-license" className="flex items-center gap-1">
                  License number (optional)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[220px]">
                          Licensed contractors protect your repair record.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input id="pro-license" value={proLicense} onChange={(e) => setProLicense(e.target.value.slice(0, 60))} />
              </div>
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Select value={proTrade} onValueChange={setProTrade}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>
                    {TRADE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date of service</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !proDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {proDate ? format(proDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={proDate}
                      onSelect={setProDate}
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Proof documents · at least one required</Label>
              {proDocs.length > 0 && (
                <div className="space-y-1">
                  {proDocs.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border border-border rounded-lg p-2">
                      <span className="truncate">
                        <span className="text-muted-foreground capitalize mr-1">{d.kind.replace("_", " ")}:</span>
                        {d.file.name}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setProDocs((p) => p.filter((_, ix) => ix !== i))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <DocUploader label="Invoice" onChange={(e) => handleDocAdd(e, "invoice")} />
                <DocUploader label="Completion report" onChange={(e) => handleDocAdd(e, "completion_report")} />
                <DocUploader label="Permit certificate" onChange={(e) => handleDocAdd(e, "permit")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Before / after photos (optional) · {proPhotos.length}/5</Label>
              <FileGrid
                items={proPhotos}
                onRemove={(i) => setProPhotos((p) => p.filter((_, ix) => ix !== i))}
                onCaption={(i, c) => setProPhotos((p) => p.map((it, ix) => (ix === i ? { ...it, caption: c } : it)))}
              />
              {proPhotos.length < 5 && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 hover:bg-muted/30">
                  <Upload className="h-4 w-4" />
                  Add photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e, setProPhotos, 5)}
                  />
                </label>
              )}
            </div>

            <div className="rounded-lg border border-health-green/30 bg-health-green/5 p-3 flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-health-green mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed">
                Professional repair records are stored permanently with your property.
                Buyers and their agents may request to review these during due diligence.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : "Mark as Fixed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FileGrid({
  items,
  onRemove,
  onCaption,
}: {
  items: PhotoEntry[];
  onRemove: (i: number) => void;
  onCaption: (i: number, c: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((p, i) => {
        const url = URL.createObjectURL(p.file);
        return (
          <div key={i} className="relative border border-border rounded-lg overflow-hidden bg-muted/20">
            <img src={url} alt={p.file.name} className="w-full h-24 object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
            >
              <X className="h-3 w-3" />
            </button>
            <Input
              value={p.caption}
              onChange={(e) => onCaption(i, e.target.value.slice(0, 200))}
              placeholder="Describe what this photo shows"
              className="text-[11px] h-7 rounded-none border-0 border-t border-border"
            />
          </div>
        );
      })}
    </div>
  );
}

function DocUploader({ label, onChange }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex items-center justify-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground border border-dashed border-border rounded-lg p-2 hover:bg-muted/30">
      <Upload className="h-3.5 w-3.5" />
      {label}
      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onChange} />
    </label>
  );
}