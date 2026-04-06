import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const messages = [
  "Scanning county records...",
  "Checking building permits...",
  "Analyzing system age...",
];

const ScanningScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1200);

    const timeout = setTimeout(() => navigate("/dashboard"), 4000);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-10">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-40 w-40 rounded-full border-2 border-primary/30 animate-pulse-ring" />
        <div className="absolute h-28 w-28 rounded-full border-2 border-primary/20 animate-pulse-ring [animation-delay:0.5s]" />
        <div className="h-20 w-20 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center animate-scan-rotate">
          <div className="h-3 w-3 rounded-full bg-primary" />
        </div>
      </div>

      <p className="text-foreground text-lg font-medium animate-pulse min-h-[28px]">
        {messages[msgIndex]}
      </p>
    </div>
  );
};

export default ScanningScreen;
