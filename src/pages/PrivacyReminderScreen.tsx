import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PrivacyReminderScreen = () => {
  const navigate = useNavigate();
  const { properties } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto text-center">
      {/* Shield Icon */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-health-green flex items-center justify-center border-4 border-background">
          <Lock className="h-4 w-4 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-3">
        Your ComingHomeIQ Profile is Private by Default
      </h1>

      <p className="text-muted-foreground text-base leading-relaxed mb-8">
        Only you can see your home data unless you choose to share it. You control exactly what realtors, contractors, and buyers can see.
      </p>

      {/* Privacy features */}
      <div className="w-full space-y-3 mb-10">
        {[
          { icon: Lock, text: "All photos and documents are private by default" },
          { icon: Eye, text: "You decide who sees what — per category" },
          { icon: Users, text: "Share selectively with contractors or realtors" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(properties.length > 0 ? "/dashboard" : "/onboarding", { replace: true })}
        className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Continue
      </button>
    </div>
  );
};

export default PrivacyReminderScreen;
