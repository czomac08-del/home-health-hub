import { useState } from "react";
import { User, Home, Plus, ChevronRight, Crown, Clock, Bell, Mail } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const maintenanceHistory = [
  { date: "Mar 15, 2024", action: "HVAC filter replaced", system: "HVAC" },
  { date: "Jan 8, 2024", action: "Annual plumbing inspection", system: "Plumbing" },
  { date: "Nov 22, 2023", action: "Electrical panel review", system: "Electrical" },
];

const ProfileScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(false);

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">John Homeowner</h1>
        <p className="text-sm text-muted-foreground">john@example.com</p>
      </div>

      {/* My Properties */}
      <Section title="My Properties">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/50">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-foreground font-medium text-sm">123 Main St</p>
              <p className="text-xs text-muted-foreground">Primary Residence</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <button className="flex items-center gap-2 pt-3 text-primary text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Property
          </button>
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription Plan">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground font-medium text-sm">Basic Plan</p>
                <p className="text-xs text-muted-foreground">1 property, limited guides</p>
              </div>
            </div>
            <button className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </Section>

      {/* Maintenance History */}
      <Section title="Maintenance History">
        <div className="rounded-xl border border-border bg-card p-4">
          {maintenanceHistory.map((entry, i) => (
            <div key={i} className={`flex items-start gap-3 py-3 ${i < maintenanceHistory.length - 1 ? "border-b border-border/50" : ""}`}>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground text-sm">{entry.action}</p>
                <p className="text-xs text-muted-foreground">{entry.date} · {entry.system}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <div className="rounded-xl border border-border bg-card p-4">
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label="Push Notifications"
            description="Get alerts for maintenance reminders"
            enabled={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
          <div className="border-t border-border/50 mt-3 pt-3">
            <ToggleRow
              icon={<Mail className="h-4 w-4" />}
              label="Weekly Health Summary"
              description="Receive a weekly email report"
              enabled={weeklyEmail}
              onToggle={() => setWeeklyEmail(!weeklyEmail)}
            />
          </div>
        </div>
      </Section>

      <BottomNav />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">{title}</h2>
    {children}
  </div>
);

const ToggleRow = ({
  icon, label, description, enabled, onToggle,
}: { icon: React.ReactNode; label: string; description: string; enabled: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${enabled ? "translate-x-5" : ""}`} />
    </button>
  </div>
);

export default ProfileScreen;
