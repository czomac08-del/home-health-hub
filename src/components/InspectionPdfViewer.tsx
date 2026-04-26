import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure the worker from a CDN. react-pdf exposes the pdfjs version it bundles.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InspectionPdfViewerProps {
  /** Direct URL to the PDF (Supabase Storage signed/public URL). */
  fileUrl: string | null;
  /** External page jump request — when this changes, the viewer scrolls to that page. */
  jumpToPage?: number | null;
}

export default function InspectionPdfViewer({ fileUrl, jumpToPage }: InspectionPdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Watch wrapper width for responsive page sizing.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Respond to external jump requests (e.g. clicking "Find in Report" on a finding).
  useEffect(() => {
    if (jumpToPage && numPages && jumpToPage >= 1 && jumpToPage <= numPages) {
      setPageNumber(jumpToPage);
    }
  }, [jumpToPage, numPages]);

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-sm text-muted-foreground">
        <p>The original report PDF isn't available for this inspection.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <p className="text-sm text-muted-foreground">
          We couldn't embed the PDF in your browser.
        </p>
        <Button asChild variant="default" size="sm">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open Original Report
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-foreground tabular-nums min-w-[70px] text-center">
          {numPages ? `${pageNumber} / ${numPages}` : "–"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
          disabled={!numPages || pageNumber >= numPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button asChild variant="ghost" size="sm" className="h-8">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open Full Report</span>
          </a>
        </Button>
      </div>

      {/* Document */}
      <div ref={wrapperRef} className="flex-1 overflow-auto p-4 flex justify-center">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setLoadError(null);
          }}
          onLoadError={(err) => {
            console.error("PDF load error", err);
            setLoadError(err?.message || "Failed to load PDF");
          }}
          loading={
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading report…
            </div>
          }
          error={
            <div className="text-sm text-muted-foreground p-8">Could not load the PDF.</div>
          }
        >
          {numPages ? (
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={containerWidth > 32 ? containerWidth - 32 : undefined}
              renderAnnotationLayer={false}
              renderTextLayer
            />
          ) : null}
        </Document>
      </div>
    </div>
  );
}
