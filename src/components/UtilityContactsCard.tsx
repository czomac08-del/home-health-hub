import { Phone, Zap, Droplets, Flame, Trash2, Wifi, ChevronRight } from "lucide-react";

interface UtilityContact {
  type: string;
  company: string;
  phone: string;
  emergencyPhone: string;
  icon: any;
}

const defaultUtilities: UtilityContact[] = [
  { type: "Electric", company: "", phone: "", emergencyPhone: "", icon: Zap },
  { type: "Water", company: "", phone: "", emergencyPhone: "", icon: Droplets },
  { type: "Gas", company: "", phone: "", emergencyPhone: "", icon: Flame },
  { type: "Sewer / Waste", company: "", phone: "", emergencyPhone: "", icon: Trash2 },
  { type: "Trash Collection", company: "", phone: "", emergencyPhone: "", icon: Trash2 },
  { type: "Internet", company: "", phone: "", emergencyPhone: "", icon: Wifi },
];

const UtilityContactsCard = ({ onViewAll }: { onViewAll?: () => void }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold text-sm">Utility Contacts</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-primary font-medium flex items-center gap-0.5">
            Edit <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {defaultUtilities.map((u) => (
          <div key={u.type} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <u.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">{u.type}</span>
              <p className="text-[10px] text-muted-foreground italic">Tap to add company & phone</p>
            </div>
            <button className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0 hover:bg-primary/20 transition-colors flex items-center gap-0.5">
              <Phone className="h-2.5 w-2.5" /> Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UtilityContactsCard;
