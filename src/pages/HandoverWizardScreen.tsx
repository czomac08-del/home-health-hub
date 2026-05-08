import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Star, QrCode, Mail, FileText, Download, Trash2, Sparkles, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { generatePassportPdf } from "@/utils/passportPdf";
import { supabase } from "@/integrations/supabase/client";

const STEPS = ["What's Staying", "Scrub Info", "Rate Systems", "Welcome Note", "Generate", "Transfer"];

type ItemDisposition = "staying" | "taking" | "unsure" | null;

interface SystemEntry {
  name: string;
  category: "core" | "appliance";
  health: number;
  lastService: string;
}

const systems: SystemEntry[] = [
  { name: "HVAC", category: "core", health: 92, lastService: "Mar 2024" },
  { name: "Well / Water Source", category: "core", health: 85, lastService: "Jan 2024" },
  { name: "Electrical Panel", category: "core", health: 65, lastService: "Nov 2023" },
  { name: "Plumbing", category: "core", health: 78, lastService: "Jan 2024" },
  { name: "Roof", category: "core", health: 55, lastService: "Sep 2023" },
  { name: "Septic / Sewer", category: "core", health: 80, lastService: "Apr 2023" },
  { name: "Water Heater", category: "core", health: 70, lastService: "Jun 2023" },
  { name: "Refrigerator", category: "appliance", health: 90, lastService: "N/A" },
  { name: "Washer / Dryer", category: "appliance", health: 88, lastService: "N/A" },
  { name: "Dishwasher", category: "appliance", health: 85, lastService: "N/A" },
  { name: "Garage Door Opener", category: "appliance", health: 75, lastService: "N/A" },
];

const HandoverWizardScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1
  const [dispositions, setDispositions] = useState<Record<string, ItemDisposition>>(() => {
    const init: Record<string, ItemDisposition> = {};
    systems.forEach((s) => {
      init[s.name] = s.category === "core" ? "staying" : null;
    });
    return init;
  });

  // Step 2
  const [scrubToggles, setScrubToggles] = useState<Record<string, boolean>>({
    insurance: true, accounts: true, personalNotes: true,
    serviceContacts: false, maintenanceHistory: false, permits: false, warranties: false, costs: true,
  });

  // Step 3
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [ratingNotes, setRatingNotes] = useState<Record<string, string>>({});
  const [ratingsConfirmed, setRatingsConfirmed] = useState(false);

  // Step 4
  const [welcomeNote, setWelcomeNote] = useState("");
  const [plumber, setPlumber] = useState("");
  const [hvacContact, setHvacContact] = useState("");
  const [trashDay, setTrashDay] = useState("");
  const [hoa, setHoa] = useState("");
  const [quirks, setQuirks] = useState("");

  // Step 6
  const [email, setEmail] = useState("");
  const [transferDone, setTransferDone] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const stayingItems = systems.filter((s) => dispositions[s.name] === "staying");
  const scrubCount = Object.values(scrubToggles).filter(Boolean).length;
  const shareCount = systems.length - Object.values(dispositions).filter((d) => d === "taking").length;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const setDisposition = (name: string, d: ItemDisposition) => {
    setDispositions((prev) => ({ ...prev, [name]: d }));
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepStaying systems={systems} dispositions={dispositions} setDisposition={setDisposition} />;
      case 1: return <StepScrub toggles={scrubToggles} setToggles={setScrubToggles} shareCount={shareCount} scrubCount={scrubCount} />;
      case 2: return <StepRatings stayingItems={stayingItems} ratings={ratings} setRatings={setRatings} ratingNotes={ratingNotes} setRatingNotes={setRatingNotes} confirmed={ratingsConfirmed} setConfirmed={setRatingsConfirmed} />;
      case 3: return <StepWelcome welcomeNote={welcomeNote} setWelcomeNote={setWelcomeNote} plumber={plumber} setPlumber={setPlumber} hvacContact={hvacContact} setHvacContact={setHvacContact} trashDay={trashDay} setTrashDay={setTrashDay} hoa={hoa} setHoa={setHoa} quirks={quirks} setQuirks={setQuirks} />;
      case 4: return <StepGenerate stayingItems={stayingItems} welcomeNote={welcomeNote} onGenerate={next} />;
      case 5: return <StepTransfer email={email} setEmail={setEmail} transferDone={transferDone} setTransferDone={setTransferDone} showRemoveConfirm={showRemoveConfirm} setShowRemoveConfirm={setShowRemoveConfirm} navigate={navigate} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <button onClick={() => step === 0 ? navigate("/property") : prev()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Back to Property" : "Previous Step"}
      </button>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
          <span className="text-xs font-bold text-primary">{STEPS[step]}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
      </div>

      {renderStep()}

      {/* Navigation buttons */}
      {step < 4 && (
        <button onClick={next} className="w-full mt-6 rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/* ═══ Step 1: What's Staying ═══ */
const DispositionPill = ({ label, active, color, onClick }: { label: string; active: boolean; color: "teal" | "grey" | "outline"; onClick: () => void }) => {
  const base = "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all border";
  const styles = {
    teal: active ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-primary border-primary/30 hover:bg-primary/10",
    grey: active ? "bg-secondary text-foreground border-secondary" : "bg-transparent text-muted-foreground border-border hover:bg-secondary/50",
    outline: active ? "bg-muted text-foreground border-muted-foreground/50" : "bg-transparent text-muted-foreground border-border hover:bg-muted/30",
  };
  return <button onClick={onClick} className={`${base} ${styles[color]}`}>{label}</button>;
};

const StepStaying = ({ systems, dispositions, setDisposition }: { systems: SystemEntry[]; dispositions: Record<string, ItemDisposition>; setDisposition: (n: string, d: ItemDisposition) => void }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground mb-1">What's Staying With the Home?</h2>
    <p className="text-xs text-muted-foreground mb-4">Items marked <span className="text-primary font-semibold">Staying</span> will transfer to the new owner's Home Passport Report. Items you're taking will be removed from the home record.</p>
    <div className="space-y-2">
      {systems.map((s) => (
        <div key={s.name} className="rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-medium text-foreground mb-2">{s.name} <span className="text-[10px] text-muted-foreground ml-1">{s.category === "core" ? "Infrastructure" : "Appliance"}</span></p>
          <div className="flex gap-1.5">
            <DispositionPill label="Staying" active={dispositions[s.name] === "staying"} color="teal" onClick={() => setDisposition(s.name, "staying")} />
            <DispositionPill label="I'm taking it" active={dispositions[s.name] === "taking"} color="grey" onClick={() => setDisposition(s.name, "taking")} />
            <DispositionPill label="Not sure" active={dispositions[s.name] === "unsure"} color="outline" onClick={() => setDisposition(s.name, "unsure")} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ═══ Step 2: Scrub Info ═══ */
const scrubItems = [
  { key: "insurance", label: "Insurance Policy Numbers", default: true, desc: "Will be removed" },
  { key: "accounts", label: "Account Numbers / Utility IDs", default: true, desc: "Will be removed" },
  { key: "personalNotes", label: "Personal Notes", default: true, desc: "Will be removed" },
  { key: "serviceContacts", label: "Service Company Contact Info", default: false, desc: "Helps the new owner" },
  { key: "maintenanceHistory", label: "Maintenance History & Dates", default: false, desc: "Adds value" },
  { key: "permits", label: "Permit Documents", default: false, desc: "New owner needs these" },
  { key: "warranties", label: "Warranty Documents", default: false, desc: "New owner needs these" },
  { key: "costs", label: "Purchase Prices / Costs", default: true, desc: "Your choice" },
];

const StepScrub = ({ toggles, setToggles, shareCount, scrubCount }: { toggles: Record<string, boolean>; setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; shareCount: number; scrubCount: number }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground mb-1">Scrub Your Private Info</h2>
    <p className="text-xs text-muted-foreground mb-4">The following personal information will be removed before transfer — review and confirm.</p>
    <div className="space-y-1">
      {scrubItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm text-foreground font-medium">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{toggles[item.key] ? "Will be removed" : item.desc}</p>
          </div>
          <Switch checked={toggles[item.key]} onCheckedChange={(v) => setToggles((p) => ({ ...p, [item.key]: v }))} />
        </div>
      ))}
    </div>
    <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
      <p className="text-sm text-primary font-medium">Your report will share <span className="font-bold">{shareCount} items</span> and protect <span className="font-bold">{scrubCount} private fields</span>.</p>
    </div>
  </div>
);

/* ═══ Step 3: Ratings ═══ */
const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={() => onChange(s)}>
        <Star className={`h-5 w-5 transition-colors ${s <= value ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const StepRatings = ({ stayingItems, ratings, setRatings, ratingNotes, setRatingNotes, confirmed, setConfirmed }: { stayingItems: SystemEntry[]; ratings: Record<string, number>; setRatings: React.Dispatch<React.SetStateAction<Record<string, number>>>; ratingNotes: Record<string, string>; setRatingNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; confirmed: boolean; setConfirmed: (v: boolean) => void }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground mb-1">Rate Your Home's Systems</h2>
    <p className="text-xs text-muted-foreground mb-4">Honest ratings build trust and protect you legally.</p>
    <div className="space-y-2">
      {stayingItems.map((s) => (
        <div key={s.name} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{s.name}</p>
            <StarRating value={ratings[s.name] || 0} onChange={(v) => setRatings((p) => ({ ...p, [s.name]: v }))} />
          </div>
          <input
            type="text"
            value={ratingNotes[s.name] || ""}
            onChange={(e) => setRatingNotes((p) => ({ ...p, [s.name]: e.target.value }))}
            placeholder="Optional notes about condition..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      ))}
    </div>
    <label className="flex items-center gap-3 mt-4 cursor-pointer">
      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${confirmed ? "bg-primary border-primary" : "border-muted-foreground/40"}`} onClick={() => setConfirmed(!confirmed)}>
        {confirmed && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <span className="text-xs text-foreground">I confirm these ratings are accurate to the best of my knowledge</span>
    </label>
  </div>
);

/* ═══ Step 4: Welcome Note ═══ */
const StepWelcome = ({ welcomeNote, setWelcomeNote, plumber, setPlumber, hvacContact, setHvacContact, trashDay, setTrashDay, hoa, setHoa, quirks, setQuirks }: { welcomeNote: string; setWelcomeNote: (v: string) => void; plumber: string; setPlumber: (v: string) => void; hvacContact: string; setHvacContact: (v: string) => void; trashDay: string; setTrashDay: (v: string) => void; hoa: string; setHoa: (v: string) => void; quirks: string; setQuirks: (v: string) => void }) => (
  <div>
    <h2 className="text-lg font-bold text-foreground mb-1">Add a Welcome Note</h2>
    <p className="text-xs text-muted-foreground mb-4">Leave a personal message and helpful tips for the new owner.</p>
    <textarea
      value={welcomeNote}
      onChange={(e) => setWelcomeNote(e.target.value)}
      placeholder="Welcome to your new home! A few things I want you to know..."
      rows={5}
      className="w-full rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
    />
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Helpful Contacts & Tips</h3>
    <div className="space-y-3">
      <SmallField label="Best Local Plumber" value={plumber} onChange={setPlumber} placeholder="Name & phone" />
      <SmallField label="Best Local HVAC Contact" value={hvacContact} onChange={setHvacContact} placeholder="Name & phone" />
      <SmallField label="Trash Pickup Day" value={trashDay} onChange={setTrashDay} placeholder="e.g. Tuesday mornings" />
      <SmallField label="HOA Contact (if applicable)" value={hoa} onChange={setHoa} placeholder="Name, phone, or email" />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hidden Quirks or Tips</label>
        <textarea
          value={quirks}
          onChange={(e) => setQuirks(e.target.value)}
          placeholder="e.g. The back door sticks in humidity — lift the handle slightly when closing"
          rows={3}
          className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>
    </div>
  </div>
);

const SmallField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
  </div>
);

/* ═══ Step 5: Generate ═══ */
const StepGenerate = ({ stayingItems, welcomeNote, onGenerate }: { stayingItems: SystemEntry[]; welcomeNote: string; onGenerate: () => void }) => {
  const { activeProperty } = useAuth();
  return (
  <div>
    <h2 className="text-lg font-bold text-foreground mb-1">Generate Your Home Passport Report</h2>
    <p className="text-xs text-muted-foreground mb-4">Review what the new owner will receive.</p>

    <div className="rounded-xl border border-primary/30 bg-card p-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center"><Home className="h-6 w-6 text-primary" /></div>
        <div>
          <p className="font-bold text-foreground">{activeProperty?.address || "Your Home"}</p>
          <p className="text-xs text-muted-foreground">
            {activeProperty?.year_built ? `Built ${activeProperty.year_built} · ` : ""}
            Overall Health: {activeProperty?.health_score != null ? `${activeProperty.health_score}%` : "—"}
          </p>
        </div>
      </div>

      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Systems Included ({stayingItems.length})</h3>
      <div className="space-y-1.5 mb-4">
        {stayingItems.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <span className="text-foreground">{s.name}</span>
            <span className="text-muted-foreground">{s.health}% · Last: {s.lastService}</span>
          </div>
        ))}
      </div>

      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</h3>
      <p className="text-xs text-muted-foreground mb-4">Warranties, permits, service records, owner's manuals</p>

      {welcomeNote && (
        <>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seller's Welcome Note</h3>
          <p className="text-xs text-muted-foreground italic line-clamp-3">"{welcomeNote}"</p>
        </>
      )}
    </div>

    <button onClick={onGenerate} className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
      <Sparkles className="h-5 w-5" /> Generate Transfer Package
    </button>
  </div>
  );
};

/* ═══ Step 6: Transfer Method ═══ */
const StepTransfer = ({ email, setEmail, transferDone, setTransferDone, showRemoveConfirm, setShowRemoveConfirm, navigate }: { email: string; setEmail: (v: string) => void; transferDone: boolean; setTransferDone: (v: boolean) => void; showRemoveConfirm: boolean; setShowRemoveConfirm: (v: boolean) => void; navigate: (p: string) => void }) => {
  const { activeProperty } = useAuth();
  if (transferDone) {
    return (
      <div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center mb-6">
          <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3"><Check className="h-7 w-7 text-primary" /></div>
          <h2 className="text-lg font-bold text-foreground mb-2">Transfer Prepared!</h2>
          <p className="text-xs text-muted-foreground">Your Home Passport Report has been prepared for transfer. Your personal information has been protected. The new owner will receive an invitation to claim the home.</p>
        </div>

        {!showRemoveConfirm ? (
          <button onClick={() => setShowRemoveConfirm(true)} className="w-full rounded-xl border border-destructive/50 bg-destructive/10 py-3.5 font-semibold text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" /> Remove This Property From My Account
          </button>
        ) : (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-foreground mb-1">Are you sure?</p>
            <p className="text-xs text-muted-foreground mb-4">This will remove {activeProperty?.address || "this property"} from your account. The Home Passport Report will remain available for the new owner to claim.</p>
            <div className="flex gap-2">
              <button onClick={() => { toast.success("Property removed from your account."); navigate("/profile"); }} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground">Yes, Remove</button>
              <button onClick={() => setShowRemoveConfirm(false)} className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-1">Transfer Method</h2>
      <p className="text-xs text-muted-foreground mb-4">Choose how to deliver the Home Passport Report to the new owner.</p>

      <div className="space-y-3">
        {/* Email */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center"><Mail className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Transfer by Email</p>
              <p className="text-[10px] text-muted-foreground">New owner receives an invite to claim</p>
            </div>
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="New owner's email address"
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mb-2" />
          <button onClick={() => { toast.success("Invitation sent!"); setTransferDone(true); }} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Send Invitation
          </button>
        </div>

        {/* QR Code */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center"><QrCode className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Generate QR Code</p>
              <p className="text-[10px] text-muted-foreground">Print and leave in the home for new owner</p>
            </div>
          </div>
          <button onClick={() => { toast.success("QR Code generated!"); setTransferDone(true); }} className="w-full rounded-lg bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Generate QR Code
          </button>
        </div>

        {/* PDF */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-foreground">Generate PDF Report</p>
              <p className="text-[10px] text-muted-foreground">Download a complete report to hand over</p>
            </div>
          </div>
          <button onClick={async () => {
            try {
              const { data: codeRow } = await supabase
                .from("referral_codes")
                .select("code")
                .maybeSingle();
              await generatePassportPdf({
                propertyId: activeProperty?.id || "unknown",
                address: activeProperty?.address || "Your Home",
                yearBuilt: (activeProperty as any)?.year_built ?? null,
                healthScore: (activeProperty as any)?.health_score ?? null,
                systems: [],
                referralCode: codeRow?.code ?? null,
              });
              toast.success("PDF downloaded!");
              setTransferDone(true);
            } catch (e: any) {
              toast.error(e?.message || "Could not generate PDF");
            }
          }} className="w-full rounded-lg bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoverWizardScreen;
