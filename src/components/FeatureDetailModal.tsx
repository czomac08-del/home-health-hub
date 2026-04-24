import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, TrendingUp, FileText, Check, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureKey = "protect" | "value" | "transfer" | "verified" | "network" | "ai";

type FeatureContent = {
  title: string;
  icon: LucideIcon;
  tagline: string;
  bullets: string[];
};

const FEATURE_CONTENT: Record<FeatureKey, FeatureContent> = {
  protect: {
    title: "Protect Your Investment",
    icon: Shield,
    tagline: "Your home is likely worth more than everything else you own combined. Treat it that way.",
    bullets: [
      "Track every major system — roof, HVAC, electrical, plumbing, well, septic, chimney, appliances — with condition notes, service dates, and documented history all in one place",
      "Get ahead of failures before they become emergencies. A $200 HVAC tune-up documented today could prevent a $6,000 replacement surprise next summer",
      "See your property's full public risk profile: flood zone, FEMA disaster history, EPA environmental flags, drought status, and permit records pulled from government sources",
      "Upload warranties, inspection reports, and manuals — our AI reads them and logs the details automatically",
      "Everything you track here builds a documented record that protects you if you ever need to make an insurance claim",
    ],
  },
  value: {
    title: "Increase Home Value",
    icon: TrendingUp,
    tagline: "A home with a story sells. A home with proof sells faster and for more.",
    bullets: [
      "Buyers and their agents are increasingly asking for maintenance history before making offers — ComingHomeIQ gives you a verified, organized answer",
      "Document every upgrade, repair, and system replacement with dates and receipts. That paper trail translates directly into negotiating power",
      "Generate a professional Home IQ Report at any time — a shareable document showing your home's full health, history, and risk profile",
      "Homes with complete, documented histories have been shown to sell faster and with fewer inspection-driven price reductions",
      "We'll publish our own platform data on this as it grows — check back for real numbers from real ComingHomeIQ users",
    ],
  },
  transfer: {
    title: "Seamless Transfers",
    icon: FileText,
    tagline: "When you sell, everything you've built here transfers — not to the internet, to the next owner.",
    bullets: [
      "When you're ready to sell, generate a transfer package for the buyer: full system history, maintenance records, warranty documents, and verified inspection data",
      "You control what transfers and what stays private — the buyer gets the home's history, not your personal account",
      "The new owner gets a head start on protecting their investment from day one, with a pre-populated ComingHomeIQ profile ready to go",
      "No more lost manuals, forgotten service dates, or \"I think it was replaced around 2019\" conversations at closing",
      "Realtors can use the transfer package as a listing differentiator — a fully documented home is a competitive advantage in any market",
    ],
  },
  verified: {
    title: "Verified Data",
    icon: Check,
    tagline: "We tell you where every piece of information came from. No guessing, no faking.",
    bullets: [
      "Every data point on your property is labeled by source: government record, user-entered, AI-extracted from an uploaded document, or professionally verified by a licensed inspector or contractor",
      "We never fabricate information. If we don't have data for a field, we say so — and we tell you where you could find it",
      "When a licensed home inspector or certified contractor logs findings on your property, those entries receive a Verified Professional badge — the highest trust level on the platform",
      "Government data (FEMA, NOAA, EPA, Census, county permits) is pulled directly from official sources and timestamped so you know how current it is",
      "You can flag any data point as disputed if something doesn't match what you know — we take accuracy seriously",
    ],
  },
  network: {
    title: "Professional Network",
    icon: Users,
    tagline: "When something needs fixing, you'll know who to trust.",
    bullets: [
      "ComingHomeIQ connects homeowners with inspectors and contractors who are already active on the platform and familiar with how it works",
      "Pros who contribute verified data to your property profile are flagged as trusted — you can see their work history on your own home",
      "Search by trade, service area, and verified platform activity — not just anonymous reviews",
      "Contractors can log completed work directly to your property record, giving you automatic documentation without any extra effort on your part",
      "Coming soon: Contractor profiles with service area maps, specialties, and homeowner ratings from verified ComingHomeIQ jobs",
    ],
  },
  ai: {
    title: "AI-Powered Insights",
    icon: Zap,
    tagline: "Smart recommendations based on your actual home — not generic advice from the internet.",
    bullets: [
      "Our AI reads your home's documented history and surfaces maintenance recommendations timed to your specific systems — not a generic checklist",
      "Upload any home document — inspection report, warranty, permit, insurance policy — and AI extracts the relevant details and adds them to your profile automatically",
      "The AI flags when something looks overdue based on your records, industry service intervals, and your home's age and location",
      "Every AI recommendation is sourced — it tells you what data it used to make the suggestion so you can verify it yourself",
      "AI never invents information. If your well has no documented service history, it says that — it does not estimate or assume",
      "Powered by Google Gemini via secure edge functions. Your data is never used to train external AI models.",
    ],
  },
};

interface FeatureDetailModalProps {
  featureKey: FeatureKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeatureDetailModal = ({ featureKey, open, onOpenChange }: FeatureDetailModalProps) => {
  if (!featureKey) return null;
  const content = FEATURE_CONTENT[featureKey];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 sm:max-h-[85vh] gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-heading font-black text-foreground">
                {content.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{content.tagline}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-3">
          {content.bullets.map((b, i) => (
            <div key={i} className="flex gap-3">
              <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
              <p className="text-sm text-foreground leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureDetailModal;
