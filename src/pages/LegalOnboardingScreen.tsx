import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, FileText, Scale, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
};

const LegalOnboardingScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [cardTimers, setCardTimers] = useState([false, false, false]);
  const [stateSelected, setStateSelected] = useState("");
  const [checks, setChecks] = useState({ terms: false, privacy: false, disclaimer: false, age: false });
  const [civicConsent, setCivicConsent] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // Card timers — 3 seconds each
  useEffect(() => {
    if (step === 1) {
      const timers = [0, 1, 2].map((i) =>
        setTimeout(() => setCardTimers((p) => { const n = [...p]; n[i] = true; return n; }), 3000)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [step]);

  const allCardsRead = cardTimers.every(Boolean);
  const allChecked = checks.terms && checks.privacy && checks.disclaimer && checks.age;

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("legal_acknowledgments").upsert({
        user_id: user.id,
        terms_accepted: true,
        privacy_accepted: true,
        professional_disclaimer_accepted: true,
        age_confirmed: true,
        civic_consent: civicConsent === true,
        state_selected: stateSelected,
        accepted_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      navigate("/home");
    } catch {
      setSaving(false);
    }
  };

  const cards = [
    { icon: Home, title: "We're a record-keeping platform, not a licensed professional service.", body: "ComingHomeIQ helps you find, organize, and preserve records about your home. We use AI to research public records and analyze documents. We are not home inspectors, attorneys, real estate agents, or government officials. Always verify important decisions with licensed professionals." },
    { icon: FileText, title: "Our data comes from public records and AI analysis — verify what matters.", body: "Government databases have gaps. AI can misread documents. Records can be outdated. We tell you exactly where every piece of data came from and how confident we are. For anything that affects your safety, finances, or legal obligations, confirm with original sources." },
    { icon: Scale, title: "Knowing something about your home may create legal obligations.", body: "In most states, if you learn about a material defect or condition through our platform, you may be legally required to disclose it when selling your home. We'll flag these situations as they arise. We recommend consulting a real estate attorney in your state before selling." },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex gap-2">
          {[1,2,3,4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">👋 Welcome to ComingHomeIQ</h2>
            <p className="text-sm text-muted-foreground">Before you get started, we want to be upfront about a few things — because honesty is the foundation of everything we do.</p>
            {cards.map((c, i) => (
              <div key={i} className="rounded-xl border border-[hsl(var(--sidebar-accent))]/30 bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <c.icon className="h-4 w-4 text-[hsl(var(--sidebar-accent))]" />
                  <p className="text-sm font-semibold text-foreground">{c.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                {cardTimers[i] && <div className="flex items-center gap-1 text-[10px] text-green-400"><Check className="h-3 w-3" /> Read</div>}
              </div>
            ))}
            <Button onClick={() => setStep(2)} disabled={!allCardsRead} className="w-full">Continue</Button>
            {!allCardsRead && <p className="text-[10px] text-muted-foreground text-center">Please read each card above (takes a few seconds)</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">What state is your primary property in?</h2>
            <p className="text-sm text-muted-foreground">This allows us to show you the correct disclosure requirements and legal resources for your state.</p>
            <Select value={stateSelected} onValueChange={setStateSelected}>
              <SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => <SelectItem key={s} value={s}>{STATE_NAMES[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setStep(3)} disabled={!stateSelected} className="w-full">Continue</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Legal Agreements</h2>
            <p className="text-sm text-muted-foreground">Please review and accept the following:</p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={checks.terms} onCheckedChange={(v) => setChecks(p => ({ ...p, terms: !!v }))} className="mt-0.5" />
                <span className="text-sm text-foreground">I have read and agree to the <Link to="/terms" target="_blank" className="text-primary underline">Terms of Service</Link></span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={checks.privacy} onCheckedChange={(v) => setChecks(p => ({ ...p, privacy: !!v }))} className="mt-0.5" />
                <span className="text-sm text-foreground">I have read and agree to the <Link to="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link></span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={checks.disclaimer} onCheckedChange={(v) => setChecks(p => ({ ...p, disclaimer: !!v }))} className="mt-0.5" />
                <span className="text-sm text-foreground">I understand that ComingHomeIQ is not a law firm, licensed inspector, or government agency, and that I should consult licensed professionals for legal, inspection, and financial decisions.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={checks.age} onCheckedChange={(v) => setChecks(p => ({ ...p, age: !!v }))} className="mt-0.5" />
                <span className="text-sm text-foreground">I am 18 years of age or older.</span>
              </label>
            </div>

            <Button onClick={() => setStep(4)} disabled={!allChecked} className="w-full">Continue</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">🏛️ Help modernize public property records?</h2>
            <p className="text-sm text-muted-foreground">ComingHomeIQ can share verified records you upload with county and state agencies — anonymously, without your name. This helps governments update databases with records they're missing.</p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors">
                <input type="radio" name="civic" checked={civicConsent === true} onChange={() => setCivicConsent(true)} className="mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">Yes, I'd like to contribute to public record modernization</p>
                  <p className="text-[10px] text-muted-foreground">Recommended — helps your community</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors">
                <input type="radio" name="civic" checked={civicConsent === false} onChange={() => setCivicConsent(false)} className="mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">No thanks, keep my uploads private</p>
                </div>
              </label>
            </div>

            <p className="text-[10px] text-muted-foreground">This can be changed anytime in Settings.</p>

            <Button onClick={handleComplete} disabled={civicConsent === null || saving} className="w-full">
              {saving ? "Setting up..." : "Create My Account"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalOnboardingScreen;
