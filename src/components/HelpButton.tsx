import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLocation } from "react-router-dom";

const helpContent: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your Home IQ overview. See all your systems at a glance, check health scores, and get alerts about upcoming maintenance.",
  },
  "/systems": {
    title: "Systems",
    description: "Browse all the systems in your home — HVAC, electrical, plumbing, and more. Tap any system to view details or configure it.",
  },
  "/guides": {
    title: "DIY Guides",
    description: "Step-by-step maintenance guides you can do yourself. Filter by system type and difficulty level.",
  },
  "/profile": {
    title: "Profile",
    description: "Manage your properties, subscription, notification preferences, and photo privacy settings.",
  },
  "/scanning": {
    title: "AI Scanner",
    description: "Use your camera to scan appliance labels. The AI will identify the brand, model, and serial number automatically.",
  },
  "/documents": {
    title: "Document Vault",
    description: "All your manuals, warranties, receipts, and permits in one place. Search across all documents or filter by type.",
  },
  "/welcome": {
    title: "Welcome",
    description: "Enter your home address to get started. We'll set up your ComingHomeIQ from here.",
  },
  "/property": {
    title: "Property Details",
    description: "View and edit details about your property including address, year built, and square footage.",
  },
};

const HelpButton = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const pathKey = Object.keys(helpContent).find(
    (k) => location.pathname === k || location.pathname.startsWith(k + "/")
  );
  const content = pathKey ? helpContent[pathKey] : { title: "Help", description: "Navigate using the bottom tabs to explore your ComingHomeIQ." };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-24 z-40 h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors shadow-lg"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 mb-16 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-foreground font-bold">{content.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{content.description}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
