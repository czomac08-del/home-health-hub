import { AlertCircle, FileText, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInspectionNotifications } from "@/hooks/useInspectionNotifications";

interface Props {
  /** When set, only show notifications for this property. */
  propertyId?: string | null;
  /**
   * Role-aware copy variant. Default = homeowner.
   * - 'renter' shows habitability-only language and routes nowhere (read-only)
   * - 'realtor' adds disclosure reminder
   * - 'inspector' invites accuracy review
   * - 'contractor' invites finding review on prior work
   */
  variant?: "homeowner" | "renter" | "realtor" | "inspector" | "contractor";
  /** Override the link target. */
  linkTo?: string;
}

const InspectionNotificationBanner = ({ propertyId, variant = "homeowner", linkTo }: Props) => {
  const navigate = useNavigate();
  const { notifications, markRead } = useInspectionNotifications(propertyId);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => {
        const counts = n.payload?.counts ?? {};
        const l1 = counts.level_1 ?? 0;
        const l2 = counts.level_2 ?? 0;
        const date = n.payload?.uploaded_at ? new Date(n.payload.uploaded_at) : new Date(n.sent_at);
        const dateLabel = date.toLocaleDateString();
        const addr = n.property_address ?? "your property";

        const { title, body, cta } = copyFor(variant, { addr, dateLabel, l1, l2, score: n.payload?.overall_score ?? null });

        const handleClick = async () => {
          await markRead(n.id);
          if (variant === "renter") return;
          navigate(linkTo || "/property");
        };

        return (
          <div
            key={n.id}
            className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              {variant === "renter" ? (
                <AlertCircle className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
            <button
              onClick={handleClick}
              className="flex-1 text-left"
              aria-label={title}
            >
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
              {cta && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                  {cta} <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </button>
            <button
              onClick={() => markRead(n.id)}
              className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

function copyFor(
  variant: NonNullable<Props["variant"]>,
  ctx: { addr: string; dateLabel: string; l1: number; l2: number; score: number | null },
): { title: string; body: string; cta: string | null } {
  switch (variant) {
    case "renter":
      return {
        title: `New inspection report uploaded for ${ctx.addr}`,
        body: `Your landlord has uploaded a new inspection report. ${ctx.l1} safety item${ctx.l1 === 1 ? "" : "s"} were noted. Contact your landlord for details.`,
        cta: null,
      };
    case "realtor":
      return {
        title: `New inspection report — ${ctx.addr}`,
        body: `Uploaded ${ctx.dateLabel}. ${ctx.l1} Level-1, ${ctx.l2} Level-2 findings${ctx.score != null ? ` · score ${ctx.score}` : ""}. Review state disclosure requirements before listing.`,
        cta: "Review report",
      };
    case "inspector":
      return {
        title: `Your report for ${ctx.addr} has been processed`,
        body: `AI extracted ${ctx.l1 + ctx.l2}+ findings. Review what was extracted for accuracy.`,
        cta: "Review extraction",
      };
    case "contractor":
      return {
        title: `New inspection report at ${ctx.addr}`,
        body: `An inspection was uploaded for a property where you completed work. Review any findings related to your prior work.`,
        cta: "Review findings",
      };
    case "homeowner":
    default:
      return {
        title: `New Inspection Report Available for ${ctx.addr}`,
        body: `Uploaded ${ctx.dateLabel}${ctx.l1 ? ` · ${ctx.l1} safety item${ctx.l1 === 1 ? "" : "s"} flagged` : ""}.`,
        cta: "Open Inspection Review",
      };
  }
}

export default InspectionNotificationBanner;