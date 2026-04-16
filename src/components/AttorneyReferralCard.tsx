import { Scale, ExternalLink, Phone } from "lucide-react";

interface AttorneyReferralProps {
  attorneyType: string;
  state: string;
  referralServiceName: string;
  referralUrl?: string;
  referralPhone?: string;
  legalAidName?: string;
  legalAidUrl?: string;
  legalAidPhone?: string;
  notes?: string;
}

const AttorneyReferralCard = ({
  attorneyType,
  state,
  referralServiceName,
  referralUrl,
  referralPhone,
  legalAidName,
  legalAidUrl,
  legalAidPhone,
  notes,
}: AttorneyReferralProps) => (
  <div className="rounded-xl bg-secondary/60 border border-border p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Scale className="h-5 w-5 text-primary" />
      <p className="text-sm font-semibold text-foreground">Finding the Right Help</p>
    </div>

    <p className="text-xs text-foreground/80">
      For this type of situation, you'd typically work with a <span className="font-semibold text-foreground">{attorneyType}</span>.
    </p>

    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Find one in {state}</p>

      <div className="rounded-lg bg-card p-3 space-y-1">
        <div className="flex items-center gap-2">
          {referralUrl ? (
            <a href={referralUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              {referralServiceName} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs font-medium text-foreground">{referralServiceName}</span>
          )}
        </div>
        {referralPhone && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" /> {referralPhone}
          </p>
        )}
        {notes && <p className="text-[10px] text-muted-foreground">{notes}</p>}
      </div>

      {legalAidName && (
        <div className="rounded-lg bg-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            {legalAidUrl ? (
              <a href={legalAidUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-400 hover:underline flex items-center gap-1">
                {legalAidName} (free for qualifying) <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-xs font-medium text-foreground">{legalAidName}</span>
            )}
          </div>
          {legalAidPhone && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {legalAidPhone}
            </p>
          )}
        </div>
      )}
    </div>

    <p className="text-[10px] text-muted-foreground/60">
      ComingHomeIQ does not endorse specific attorneys. These resources connect you with licensed professionals in your state.
    </p>
  </div>
);

export default AttorneyReferralCard;
