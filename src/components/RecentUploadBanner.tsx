import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, X, FileText } from "lucide-react";

interface StoredUpload {
  id: string;
  name: string;
  uploadedAt: string;
  category: string;
  url?: string | null;
}

const KEY = "chiq_recent_upload";
const TTL_MS = 24 * 60 * 60 * 1000;

export function recordRecentUpload(upload: StoredUpload) {
  try {
    localStorage.setItem(KEY, JSON.stringify(upload));
  } catch {}
}

export default function RecentUploadBanner() {
  const navigate = useNavigate();
  const [upload, setUpload] = useState<StoredUpload | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed: StoredUpload = JSON.parse(raw);
      if (Date.now() - +new Date(parsed.uploadedAt) > TTL_MS) {
        localStorage.removeItem(KEY);
        return;
      }
      setUpload(parsed);
    } catch {}
  }, []);

  if (!upload) return null;

  const dismiss = () => {
    localStorage.removeItem(KEY);
    setUpload(null);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center gap-3">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          <span className="font-semibold">{upload.name}</span> uploaded successfully
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {upload.url && (
            <button
              onClick={() => window.open(upload.url!, "_blank")}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              View Document
            </button>
          )}
          <button
            onClick={() => navigate("/documents")}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            Review Findings
          </button>
          <button
            onClick={() => navigate("/documents?import=" + encodeURIComponent(upload.id))}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            Add to Profile
          </button>
        </div>
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}