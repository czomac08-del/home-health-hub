import { ExternalLink, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";

interface FindingSourceLinkProps {
  /** Inspector display name from the report. */
  inspectorName?: string | null;
  /** Inspection date (YYYY-MM-DD or any parseable string). */
  inspectionDate?: string | null;
  /** Direct URL to the original PDF in storage. */
  reportUrl?: string | null;
  /** Property record id (used to build the side-by-side viewer route). */
  propertyRecordId?: string | null;
  /** Page number this finding appears on, if known. */
  pageReference?: number | null;
  /** Optional finding key/id to deep-link the viewer to this finding. */
  findingId?: string | null;
  className?: string;
}

/**
 * Tiny attribution footer rendered at the bottom of every finding card.
 * Always lets the user trace a finding back to the original inspection PDF
 * — and, when we have a saved record id, jump into the side-by-side viewer.
 */
export default function FindingSourceLink({
  inspectorName,
  inspectionDate,
  reportUrl,
  propertyRecordId,
  pageReference,
  findingId,
  className = "",
}: FindingSourceLinkProps) {
  const dateLabel = inspectionDate
    ? (() => {
        try {
          const d = new Date(inspectionDate);
          if (!isNaN(d.getTime())) return d.toLocaleDateString();
        } catch {
          /* noop */
        }
        return inspectionDate;
      })()
    : null;

  const inspectorLabel = inspectorName?.trim() || "Inspector of record";

  // Build the viewer link only if we have a saved record to anchor to.
  const viewerHref = propertyRecordId
    ? `/inspection-review/${propertyRecordId}/viewer${
        findingId ? `?finding=${encodeURIComponent(findingId)}` : ""
      }${pageReference ? `${findingId ? "&" : "?"}page=${pageReference}` : ""}`
    : null;

  return (
    <div
      className={`pt-2 mt-2 border-t border-border/60 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground ${className}`}
    >
      <span>
        Source: <span className="text-foreground/80">{inspectorLabel}</span> Inspection Report
        {dateLabel ? <> · {dateLabel}</> : null}
      </span>

      {viewerHref && (
        <Link
          to={viewerHref}
          className="inline-flex items-center gap-1 text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <FileSearch className="h-3 w-3" />
          {pageReference ? `Find on p. ${pageReference}` : "Find in Report"}
        </Link>
      )}

      {reportUrl && (
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
          View Original
        </a>
      )}
    </div>
  );
}
