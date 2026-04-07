import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, ChevronRight, Crown, Clock, Bell, Mail, CalendarClock, Lock, Sparkles, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const proFeatures = [
  { icon: <Sparkles className="h-4 w-4 text-primary" />, label: "AI-powered maintenance predictions" },
  { icon: <BarChart3 className="h-4 w-4 text-primary" />, label: "Detailed cost analysis reports" },
  { icon: <CalendarClock className="h-4 w-4 text-primary" />, label: "Unlimited properties & history" },
];

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { profile, properties, signOut, user, refreshProperties } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("Vacation Home");
  const [addingProperty, setAddingProperty] = useState(false);

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAddProperty = async () => {
    if (!newAddress.trim() || !user) return;
    setAddingProperty(true);
    const { error } = await supabase.from("properties").insert({
      user_id: user.id,
      address: newAddress.trim(),
      label: newLabel.trim() || "Property",
      is_active: false,
    });
    if (error) {
      toast.error("Failed to add property");
    } else {
      toast.success("Property added!");
      setShowAddProperty(false);
      setNewAddress("");
      setNewLabel("Vacation Home");
      await refreshProperties();
    }
    setAddingProperty(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{profile?.full_name || "User"}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
        </div>
      </div>

      {/* My Properties */}
      <Section title="My Properties">
        <div className="rounded-xl border border-border bg-card">
          {properties.map((prop) => (
            <button key={prop.id} onClick={() => navigate("/property")} className="w-full flex items-center gap-3 p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium text-sm">{prop.address}</p>
                  {prop.is_active && <span className="text-[10px] font-medium text-health-green bg-health-green/15 px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <p className="text-xs text-muted-foreground">{prop.label}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {properties.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground italic">No properties added yet</p>
          )}

          {showAddProperty ? (
            <div className="p-4 space-y-3 border-t border-border/50">
              <input
                type="text"
                placeholder="Property address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Label (e.g. Vacation Home)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <button onClick={handleAddProperty} disabled={addingProperty || !newAddress.trim()} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                  {addingProperty ? "Adding..." : "Add"}
                </button>
                <button onClick={() => setShowAddProperty(false)} className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddProperty(true)} className="w-full flex items-center gap-2 p-4 text-primary text-sm font-medium hover:bg-secondary/30 transition-colors">
              <Plus className="h-4 w-4" /> Add Property
            </button>
          )}
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground font-medium text-sm">Basic Plan</p>
                <p className="text-xs text-muted-foreground">1 property, limited guides</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-primary-foreground bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Upgrade to Pro
            </button>
          </div>
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs text-muted-foreground font-medium mb-2.5 flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Pro features
            </p>
            <div className="flex flex-col gap-2.5">
              {proFeatures.map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {feat.icon}
                  <span className="text-xs text-muted-foreground">{feat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Maintenance History */}
      <Section title="Maintenance History">
        <div className="rounded-xl border border-border bg-card">
          {[
            { date: "Mar 15, 2024", action: "HVAC filter replaced", system: "HVAC" },
            { date: "Jan 8, 2024", action: "Annual plumbing inspection", system: "Plumbing" },
            { date: "Nov 22, 2023", action: "Electrical panel review", system: "Electrical" },
          ].map((entry, i, arr) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${i < arr.length - 1 ? "border-b border-border/50" : ""}`}>
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{entry.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.date} · {entry.system}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <div className="rounded-xl border border-border bg-card p-4">
          <ToggleRow icon={<Bell className="h-4 w-4" />} label="Push Notifications" description="Alerts for urgent system issues" enabled={notifications} onToggle={() => setNotifications(!notifications)} />
          <div className="border-t border-border/50 my-3" />
          <ToggleRow icon={<Mail className="h-4 w-4" />} label="Weekly Health Summary" description="Receive a weekly email report" enabled={weeklyEmail} onToggle={() => setWeeklyEmail(!weeklyEmail)} />
          <div className="border-t border-border/50 my-3" />
          <ToggleRow icon={<CalendarClock className="h-4 w-4" />} label="Maintenance Reminders" description="Get notified when service is due" enabled={reminders} onToggle={() => setReminders(!reminders)} />
        </div>
      </Section>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-3.5 font-semibold text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 mt-2"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
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
      className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${enabled ? "translate-x-5 bg-primary-foreground" : "bg-muted-foreground"}`} />
    </button>
  </div>
);

export default ProfileScreen;
