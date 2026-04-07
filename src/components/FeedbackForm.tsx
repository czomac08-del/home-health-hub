import { useState } from "react";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const categories = [
  "Adding a system",
  "Scanning a product",
  "Finding a manual",
  "Viewing my dashboard",
  "Managing my profile",
  "Using DIY guides",
  "Uploading photos/documents",
  "Other",
];

const FeedbackForm = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [improvement, setImprovement] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0 || !category) {
      toast.error("Please provide a rating and select a category");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback" as any).insert({
      user_id: user.id,
      rating,
      category,
      what_happened: whatHappened.trim(),
      improvement: improvement.trim(),
      page_route: location.pathname,
      user_role: profile?.role || "homeowner",
    } as any);
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Thank you for your feedback!");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Send Feedback</h2>
        <p className="text-xs text-muted-foreground">Help us improve Home Passport</p>
      </div>

      {/* Star Rating */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          How's your experience?
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  n <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          What were you trying to do?
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select an option...</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* What happened */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          What happened?
        </label>
        <textarea
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          placeholder="Describe what happened..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Improvement */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          What would make this better?
        </label>
        <textarea
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
          placeholder="Your suggestion..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || !category}
          className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Sending..." : "Submit Feedback"}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FeedbackForm;
