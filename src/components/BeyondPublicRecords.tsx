import { BarChart3, CheckCircle2, XCircle } from "lucide-react";

interface RecordComparison {
  label: string;
  publicStatus: string | null;
  chiqStatus: string;
  isCorrected?: boolean;
}

interface BeyondPublicRecordsProps {
  comparisons: RecordComparison[];
}

const BeyondPublicRecords = ({ comparisons }: BeyondPublicRecordsProps) => {
  const beyondCount = comparisons.filter(c => !c.publicStatus || c.isCorrected).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">ComingHomeIQ vs. Public Records</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Record</th>
              <th className="text-left py-2 text-muted-foreground font-medium">Public Records</th>
              <th className="text-left py-2 text-muted-foreground font-medium">ComingHomeIQ</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2 text-foreground font-medium">{c.label}</td>
                <td className="py-2">
                  {c.publicStatus ? (
                    <span className="text-muted-foreground">{c.publicStatus}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive/70">
                      <XCircle className="h-3 w-3" /> Not found
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <span className="flex items-center gap-1 text-teal-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {c.chiqStatus}
                    {c.isCorrected && <span className="text-[9px] text-amber-400 ml-1">← corrected</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {beyondCount > 0 && (
        <p className="text-xs text-primary mt-3 font-medium">
          ComingHomeIQ has {beyondCount} record{beyondCount > 1 ? "s" : ""} not in any public database.
        </p>
      )}
    </div>
  );
};

export default BeyondPublicRecords;
