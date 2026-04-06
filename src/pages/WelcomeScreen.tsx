import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Home } from "lucide-react";

const WelcomeScreen = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleScan = () => {
    if (address.trim()) {
      navigate("/scanning");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center glow-teal">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Home Passport</h1>
        </div>

        <p className="text-muted-foreground text-lg text-center">Your Home's Digital Passport</p>

        <div className="w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter your home address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={!address.trim()}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed glow-teal-strong"
        >
          Scan My Home
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
