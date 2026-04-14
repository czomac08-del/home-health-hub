import { Award, TrendingUp, Target, CheckCircle2, ChevronRight } from "lucide-react";

interface DiscountPotentialProps {
  healthScore: number;
  profileCompleteness: number;
  totalSystems: number;
  configuredSystems: number;
}

const DiscountPotentialSection = ({ healthScore, profileCompleteness, totalSystems, configuredSystems }: DiscountPotentialProps) => {
  const isCertified = healthScore >= 85 && profileCompleteness >= 80;
  const scoreNeeded = Math.max(0, 85 - healthScore);
  const completenessNeeded = Math.max(0, 80 - profileCompleteness);
  const tasksToComplete = totalSystems - configuredSystems;

  const savingsLow = 8;
  const savingsHigh = 12;

  return (
    <div className="mb-6">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Your Maintenance Discount Potential</h2>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {/* Score Progress */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border-4 border-brain-blue/30 flex items-center justify-center shrink-0 relative">
            <svg className="absolute inset-0" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-border" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="currentColor"
                className="text-brain-blue"
                strokeWidth="4"
                strokeDasharray={`${(healthScore / 100) * 176} 176`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="text-lg font-heading font-bold text-foreground">{healthScore}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-heading font-bold text-foreground">Current Home IQ Score</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCertified
                ? "You qualify for ComingHomeIQ Certification!"
                : `${scoreNeeded > 0 ? `Need ${scoreNeeded} more points` : "Score qualifies!"} · ${completenessNeeded > 0 ? `${completenessNeeded}% more completeness needed` : "Completeness qualifies!"}`}
            </p>
          </div>
          {isCertified && (
            <div className="h-10 w-10 rounded-full bg-brain-blue/20 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-brain-blue" />
            </div>
          )}
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Health Score</span>
              <span className="font-heading font-bold text-foreground">{healthScore}/85 needed</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${healthScore >= 85 ? "bg-brain-blue" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (healthScore / 85) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Profile Completeness</span>
              <span className="font-heading font-bold text-foreground">{profileCompleteness}%/80% needed</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${profileCompleteness >= 80 ? "bg-brain-blue" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (profileCompleteness / 80) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks remaining */}
        {!isCertified && tasksToComplete > 0 && (
          <div className="rounded-xl bg-bg-secondary border border-border p-3 flex items-center gap-3">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{tasksToComplete} more systems to configure</p>
              <p className="text-xs text-muted-foreground">Complete your system profiles to increase your score</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Savings estimate */}
        <div className="rounded-xl bg-brain-blue/10 border border-brain-blue/20 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-brain-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-heading font-bold text-foreground">
                Estimated Premium Savings: {savingsLow}–{savingsHigh}%
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Homeowners with certified maintenance records save an average of {savingsLow} to {savingsHigh} percent on home insurance. 
                {isCertified
                  ? " You qualify — share your certification with your insurance agent to discuss discounts."
                  : " Complete your home profile to unlock potential savings."}
              </p>
            </div>
          </div>
        </div>

        {isCertified && (
          <div className="flex items-center gap-2 pt-1">
            <CheckCircle2 className="h-4 w-4 text-brain-blue" />
            <p className="text-xs text-brain-blue font-medium">ComingHomeIQ Certified — Share your report with your insurer for potential discounts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountPotentialSection;
