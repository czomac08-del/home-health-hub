import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Home, Check, Shield, Star, ArrowRight, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const includedSystems = [
  { name: "HVAC", health: 92, lastService: "Mar 2024" },
  { name: "Well / Water Source", health: 85, lastService: "Jan 2024" },
  { name: "Electrical Panel", health: 65, lastService: "Nov 2023" },
  { name: "Plumbing", health: 78, lastService: "Jan 2024" },
  { name: "Roof", health: 55, lastService: "Sep 2023" },
  { name: "Water Heater", health: 70, lastService: "Jun 2023" },
];

const ClaimHomeScreen = () => {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const { activeProperty, user } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [newAppliances, setNewAppliances] = useState<string[]>([]);
  const [verifyFirst, setVerifyFirst] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<"zip_county" | "document_ocr" | "">("");
  const [typedAddress, setTypedAddress] = useState("");
  const [zip4, setZip4] = useState("");
  const [countyTyped, setCountyTyped] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);

  const logAttempt = async (
    outcome: "success" | "fail",
    reason: string,
    claimId?: string,
  ) => {
    if (!user || !activeProperty?.id) return;
    await supabase.from("claim_attempt_log").insert({
      claim_id: claimId ?? null,
      property_id: activeProperty.id,
      attempted_by_user_id: user.id,
      outcome,
      reason,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  };

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleVerify = async () => {
    if (!user || !activeProperty?.id || !activeProperty.address) {
      toast.error("No property loaded.");
      return;
    }
    // Step 1: address must match what's on file
    const expected = normalize(activeProperty.address);
    const typed = normalize(typedAddress);
    if (!typed || typed.split(" ").slice(0, 4).join(" ") !== expected.split(" ").slice(0, 4).join(" ")) {
      await logAttempt("fail", "address_mismatch");
      toast.error("Address does not match our records. Please check and try again.");
      return;
    }

    setVerifying(true);
    try {
      // Create the pending claim row
      const { data: claimRow, error: claimErr } = await supabase
        .from("property_claims")
        .insert({
          property_id: activeProperty.id,
          claimant_user_id: user.id,
          typed_address: typedAddress,
          verification_path: verifyMethod || "zip_county",
          zip_last4: verifyMethod === "zip_county" ? zip4 : null,
          county_typed: verifyMethod === "zip_county" ? countyTyped : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          status: "pending",
        })
        .select("id")
        .single();
      if (claimErr) throw claimErr;
      const claimId = claimRow.id;

      let verified = false;
      let reason = "";
      let confidence: number | null = null;

      if (verifyMethod === "zip_county") {
        const propZip = (activeProperty as any).zip_code || (activeProperty as any).zip || "";
        const last4Expected = String(propZip).replace(/\D/g, "").slice(-4);
        const propCounty = String((activeProperty as any).county || "").toLowerCase();
        const matchesZip = last4Expected && zip4.replace(/\D/g, "") === last4Expected;
        const matchesCounty = !!propCounty && propCounty.includes(countyTyped.toLowerCase().trim());
        verified = !!matchesZip && !!matchesCounty;
        reason = verified ? "zip_county_match" : "zip_county_mismatch";
      } else if (verifyMethod === "document_ocr") {
        if (!docFile) {
          await supabase.from("property_claims").update({ status: "rejected" }).eq("id", claimId);
          await logAttempt("fail", "no_document", claimId);
          toast.error("Please upload a document.");
          setVerifying(false);
          return;
        }
        const b64 = await fileToBase64(docFile);
        const { data, error } = await supabase.functions.invoke("verify-claim-document", {
          body: {
            propertyId: activeProperty.id,
            expectedAddress: activeProperty.address,
            imageBase64: b64,
          },
        });
        if (error) throw error;
        verified = !!data?.matched;
        confidence = verified ? 90 : 30;
        reason = verified ? "document_match" : "document_no_match";
      } else {
        reason = "no_method_selected";
      }

      await supabase
        .from("property_claims")
        .update({
          status: verified ? "approved" : "rejected",
          document_match_confidence: confidence,
          reviewed_at: verified ? new Date().toISOString() : null,
        })
        .eq("id", claimId);

      await logAttempt(verified ? "success" : "fail", reason, claimId);

      if (!verified) {
        toast.error("Verification failed. Try the other method or contact support.");
        setVerifying(false);
        return;
      }

      toast.success("Ownership verified.");
      setVerifyOpen(false);
      setClaimed(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Verification error");
      await logAttempt("fail", "exception");
    } finally {
      setVerifying(false);
    }
  };

  const applianceOptions = ["Refrigerator", "Washer", "Dryer", "Dishwasher", "Microwave", "Stove/Oven"];

  if (claimed) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-1">New Owner Setup</h1>
        <p className="text-xs text-muted-foreground mb-6">Let's customize your new ComingHomeIQ profile.</p>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What appliances did you bring?</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {applianceOptions.map((a) => {
                const selected = newAppliances.includes(a);
                return (
                  <button key={a} onClick={() => setNewAppliances((p) => selected ? p.filter((x) => x !== a) : [...p, a])}
                    className={`text-xs font-medium px-3 py-2 rounded-full border transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"}`}>
                    {selected && <Check className="h-3 w-3 inline mr-1" />}{a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What would you like to verify first?</h2>
          <div className="space-y-1.5">
            {["HVAC System", "Electrical Panel", "Roof Condition", "Plumbing", "Water Heater"].map((item) => (
              <button key={item} onClick={() => setVerifyFirst(item)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${verifyFirst === item ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card text-foreground hover:bg-secondary/30"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { toast.success("Your ComingHomeIQ profile is ready!"); navigate("/dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
          Complete Setup <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Home className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Your new home's complete record is ready for you.</h1>
        <p className="text-sm text-muted-foreground">
          The seller built this file using ComingHomeIQ. Claim it and everything stays with you — permits, warranties, maintenance history, government records — permanently.
        </p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6">
        <p className="text-lg font-bold text-foreground mb-0.5">{activeProperty?.address || "Your Home"}</p>
        {activeProperty?.year_built && (
          <p className="text-xs text-muted-foreground mb-3">Built {activeProperty.year_built}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-secondary/40 p-3">
            <p className="text-2xl font-bold text-foreground">{includedSystems.length}</p>
            <p className="text-[11px] text-muted-foreground">Systems documented</p>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3">
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-[11px] text-muted-foreground">Gov't sources (FEMA, NOAA, EPA, USDA, Census)</p>
          </div>
        </div>

        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Included in Passport ({includedSystems.length} systems)</h3>
        <div className="space-y-1.5 mb-4">
          {includedSystems.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${s.health >= 70 ? "text-health-green" : s.health >= 60 ? "text-health-amber" : "text-health-red"}`}>{s.health}%</span>
                <span className="text-muted-foreground">· {s.lastService}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-3">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Also Included</h3>
          <p className="text-xs text-muted-foreground">Warranties, permits, service records, owner's manuals, seller's welcome note</p>
        </div>
      </div>

      {!verifyOpen ? (
        <>
          <button onClick={() => setVerifyOpen(true)}
            className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
            <Check className="h-5 w-5" /> Claim This Home File — Free
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            No credit card. Takes 2 minutes. Your home's record belongs to you.
          </p>
          {propertyId && (
            <p className="text-[10px] text-muted-foreground/70 text-center mt-2">Property reference: {propertyId.slice(0, 8)}…</p>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Verify ownership</h3>
            <p className="text-xs text-muted-foreground">
              We need to confirm you're the owner before unlocking this home file.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Step 1 — Type the full property address
            </label>
            <input
              type="text"
              value={typedAddress}
              onChange={(e) => setTypedAddress(e.target.value)}
              placeholder="e.g., 123 Maple Ave, Springfield, IL 62701"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Type it from memory — do not copy from this page.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Step 2 — Choose a verification method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVerifyMethod("zip_county")}
                className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                  verifyMethod === "zip_county"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FileText className="h-4 w-4 mb-1" />
                <div className="font-semibold text-foreground">ZIP + County</div>
                <div className="text-muted-foreground">Last 4 digits of ZIP + county name</div>
              </button>
              <button
                type="button"
                onClick={() => setVerifyMethod("document_ocr")}
                className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                  verifyMethod === "document_ocr"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Upload className="h-4 w-4 mb-1" />
                <div className="font-semibold text-foreground">Upload Bill</div>
                <div className="text-muted-foreground">Utility, tax, or mortgage</div>
              </button>
            </div>
          </div>

          {verifyMethod === "zip_county" && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={zip4}
                onChange={(e) => setZip4(e.target.value)}
                placeholder="ZIP last 4"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                value={countyTyped}
                onChange={(e) => setCountyTyped(e.target.value)}
                placeholder="County name"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          )}

          {verifyMethod === "document_ocr" && (
            <div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="block text-xs text-muted-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Document is scanned for the address only and is not saved.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setVerifyOpen(false)}
              className="flex-1 rounded-lg border border-border bg-background py-3 text-sm text-foreground"
              disabled={verifying}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying || !verifyMethod || !typedAddress.trim()}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify & Claim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimHomeScreen;
