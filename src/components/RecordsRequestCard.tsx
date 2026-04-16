import { useState } from "react";
import { Send, FileText, Clock, CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STATE_RECORDS_LAWS: Record<string, { name: string; days: number }> = {
  NC: { name: "NC General Statute § 132-1", days: 5 },
  SC: { name: "SC Freedom of Information Act", days: 15 },
  GA: { name: "Georgia Open Records Act", days: 3 },
  VA: { name: "Virginia Freedom of Information Act", days: 5 },
  FL: { name: "Florida Public Records Law", days: 10 },
  TX: { name: "Texas Public Information Act", days: 10 },
  TN: { name: "Tennessee Public Records Act", days: 7 },
  NY: { name: "NY Freedom of Information Law", days: 5 },
  PA: { name: "PA Right-to-Know Law", days: 5 },
  OH: { name: "Ohio Public Records Act", days: 10 },
};

const SYSTEM_RECORD_REQUESTS: Record<string, string[]> = {
  well: ["Well construction completion report", "Well permit", "Water quality test results", "Pump installation records"],
  septic: ["Septic system permit", "As-built drawing", "Inspection records", "Pump-out history"],
  electrical: ["Original building permit", "Certificate of occupancy", "Electrical subpermits", "Renovation permits"],
  plumbing: ["Original building permit", "Certificate of occupancy", "Plumbing subpermits", "Renovation permits"],
  hvac: ["Original building permit", "Certificate of occupancy", "HVAC subpermits", "Renovation permits"],
};

interface Props {
  propertyId: string;
  systemType: string;
  address: string;
  county: string;
  state: string;
  userName: string;
  userEmail: string;
  onRequestSent?: () => void;
}

const RecordsRequestCard = ({ propertyId, systemType, address, county, state, userName, userEmail, onRequestSent }: Props) => {
  const { user } = useAuth();
  const [showRequest, setShowRequest] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const stateInfo = STATE_RECORDS_LAWS[state] || { name: "applicable state public records law", days: 10 };
  const recordsList = SYSTEM_RECORD_REQUESTS[systemType.toLowerCase()] || SYSTEM_RECORD_REQUESTS.electrical;
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + stateInfo.days + (stateInfo.days > 5 ? 4 : 2)); // add weekends

  const generateLetter = () => {
    return `${today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

${county} County Environmental Health / Building Inspections
${county} County, ${state}

RE: Public Records Request — Property Records Search
Property Address: ${address}

Dear Records Administrator,

I am the owner of the property listed above and I am requesting copies of any records your office holds related to the following for this property:

${recordsList.map(r => `- ${r}`).join("\n")}

I understand that some records for this property may predate digital record-keeping systems and may exist only in paper or microfiche format. I request that staff search both digital and physical archives.

This request is made pursuant to ${stateInfo.name}.

Please respond within the timeframe required by law. I can be reached at ${userEmail}.

Thank you for your assistance.

Sincerely,
${userName}
${userEmail}
ComingHomeIQ Home Records Platform`;
  };

  const handleSendRequest = async () => {
    if (!user) return;
    setSending(true);
    try {
      const letter = generateLetter();
      const countyFips = `${state}-${county.toLowerCase().replace(/\s/g, "-")}`;

      const { error } = await supabase.from("records_requests").insert({
        property_id: propertyId,
        user_id: user.id,
        county_fips: countyFips,
        agency_type: systemType === "well" || systemType === "septic" ? "environmental_health" : "building_inspections",
        system_type: systemType,
        status: "pending",
        response_due_date: dueDate.toISOString(),
        request_letter_text: letter,
        notes: `Auto-generated for ${address}`,
      });
      if (error) throw error;

      setSent(true);
      toast.success("Records request saved! Download the letter below.");
      onRequestSent?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setSending(false);
    }
  };

  const downloadLetter = () => {
    const letter = generateLetter();
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Records-Request-${county}-${systemType}-${today.toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-[hsl(var(--brain-blue))]/30 bg-[hsl(var(--brain-blue))]/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-[hsl(var(--brain-blue))]" />
          <span className="text-sm font-semibold text-foreground">📬 Records Request Created</span>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>Prepared for {county} County on {today.toLocaleDateString()}</p>
          <p>Response due by: <span className="text-foreground font-medium">{dueDate.toLocaleDateString()}</span></p>
          <p>Status: <span className="text-primary font-medium">⏳ Pending</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadLetter} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <Download className="h-3.5 w-3.5" /> Download Letter
          </button>
          <button onClick={() => setSent(false)} className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">
            <FileText className="h-3.5 w-3.5" /> View
          </button>
        </div>
      </div>
    );
  }

  if (!showRequest) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Send className="h-5 w-5 text-[hsl(var(--brain-blue))] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Want us to request these records for you?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              ComingHomeIQ can generate a formal public records request to your county on your behalf — at no cost. We'll prepare the letter for you to send or mail.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowRequest(true)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                Yes, Generate Request →
              </button>
              <button onClick={() => {}} className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground">
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--brain-blue))]/30 bg-[hsl(var(--brain-blue))]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[hsl(var(--brain-blue))]" />
        <span className="text-sm font-semibold text-foreground">Records Request Preview</span>
      </div>
      <div className="rounded-lg bg-card border border-border p-3 max-h-48 overflow-y-auto">
        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
          {generateLetter()}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3 inline mr-1" />
        {state} law requires a response within {stateInfo.days} business days
      </p>
      <div className="flex gap-2">
        <button onClick={handleSendRequest} disabled={sending} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90">
          {sending ? "Creating..." : "Create Request & Download"}
        </button>
        <button onClick={() => setShowRequest(false)} className="rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RecordsRequestCard;
