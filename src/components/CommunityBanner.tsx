import { useState, useEffect } from "react";
import { Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  countyFips: string;
  systemType: string;
}

const CommunityBanner = ({ countyFips, systemType }: Props) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!countyFips || !systemType) return;
    supabase
      .from("community_requests")
      .select("request_count")
      .eq("county_fips", countyFips)
      .eq("system_type", systemType)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCount(data.request_count);
      });
  }, [countyFips, systemType]);

  if (count < 1) return null;

  const getMessage = () => {
    if (count >= 25) return { emoji: "🚨", text: `Major records gap — ${count} homeowners in this county are affected. ComingHomeIQ has escalated this to the county and state agencies.`, urgent: true };
    if (count >= 10) return { emoji: "👥", text: `This is a known gap — ${count} homeowners in this county are missing these records. A community request has been sent to the county.`, urgent: false };
    if (count >= 3) return { emoji: "👥", text: `You're not alone — ${count} homeowners in this county have also requested this.`, urgent: false };
    return { emoji: "👥", text: `A few other homeowners in this county have the same issue.`, urgent: false };
  };

  const msg = getMessage();

  return (
    <div className={`rounded-xl p-3 flex items-start gap-2.5 ${msg.urgent ? "border border-destructive/30 bg-destructive/5" : "border border-[hsl(var(--navy))]/30 bg-[hsl(var(--navy))]/5"}`}>
      {msg.urgent ? (
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      ) : (
        <Users className="h-4 w-4 text-[hsl(var(--navy))] shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-xs text-foreground leading-relaxed">
          {msg.emoji} {msg.text}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Your request adds to a community signal that may prompt the county to prioritize digitization.
        </p>
      </div>
    </div>
  );
};

export default CommunityBanner;
