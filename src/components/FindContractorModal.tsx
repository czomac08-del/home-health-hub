import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, HardHat, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short description of what needs fixing — used to seed the search query. */
  findingTitle: string;
  /** Optional system/category hint (e.g. "HVAC", "plumbing"). */
  category?: string | null;
  /** Homeowner's city, used to localize the search. */
  city?: string | null;
  /** Homeowner's state, used to localize the search. */
  state?: string | null;
}

/**
 * Lightweight referral modal. We are not affiliated with Angi or HomeAdvisor —
 * we just deep-link a search query so the homeowner can compare quotes.
 * Inspection-derived findings are the only data ever leaving the app here.
 */
export default function FindContractorModal({
  open,
  onOpenChange,
  findingTitle,
  category,
  city,
  state,
}: Props) {
  const locale = [city, state].filter(Boolean).join(", ");
  const q = [category, findingTitle].filter(Boolean).join(" ").trim() || "home repair";
  const queryWithLocale = locale ? `${q} ${locale}` : q;

  const angi = `https://www.angi.com/companylist.htm?searchTerm=${encodeURIComponent(q)}${
    locale ? `&zip=${encodeURIComponent(state || "")}` : ""
  }`;
  const homeAdvisor = `https://www.homeadvisor.com/c.html?type=${encodeURIComponent(q)}${
    locale ? `&zip=${encodeURIComponent(state || "")}` : ""
  }`;
  const google = `https://www.google.com/search?q=${encodeURIComponent(`${queryWithLocale} contractor`)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            Find a Contractor
          </DialogTitle>
          <DialogDescription>
            ComingHomeIQ is not affiliated with these directories — they're starting points
            for getting bids. Always verify license &amp; reviews before hiring.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <p className="text-muted-foreground mb-1">Pre-filled search</p>
          <p className="text-foreground font-medium break-words">{queryWithLocale}</p>
        </div>

        <div className="space-y-2 mt-2">
          <Button asChild variant="outline" className="w-full justify-between">
            <a href={angi} target="_blank" rel="noopener noreferrer">
              Search Angi <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <a href={homeAdvisor} target="_blank" rel="noopener noreferrer">
              Search HomeAdvisor <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <a href={google} target="_blank" rel="noopener noreferrer">
              Search Google <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild className="w-full justify-between">
            <Link to="/contractor">
              Browse ComingHomeIQ Contractors <Search className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}