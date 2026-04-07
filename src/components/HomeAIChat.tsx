import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickReplies = [
  "When should I change my HVAC filter?",
  "What does my well pump need?",
  "Is my roof going to be okay this winter?",
  "What maintenance is due soon?",
];

const aiResponses: Record<string, string> = {
  "When should I change my HVAC filter?":
    "Based on your **16x25x1 pleated filter** and the fact it was last changed on **November 12, 2024**, you're now 5 months in. With your system running year-round in your climate zone, I recommend **changing it this week**.\n\nYour filter is a **Filtrete 1500** — here's a direct link to buy the exact one. Want me to add a reminder to your calendar?",
  "Is my roof going to be okay this winter?":
    "Your roof was installed in **2012** with 30-year architectural shingles — so it's **14 years into a 30-year life**. However, your last inspection in **September 2023** noted shingle wear on the south-facing slope.\n\nGiven your area gets significant winter weather, I recommend getting a **professional inspection before November**. Want me to find a roofer who has worked on similar homes in your area?",
  "What does my well pump need?":
    "Your well pump is a **Goulds J10S submersible** installed in 2010 — that's **16 years old**. Average lifespan is 15-25 years, so you're in the middle zone.\n\nYour last water quality test was **February 2024** (passed). I recommend:\n\n• Annual water quality test (due Feb 2025)\n• Pressure tank check — your 40/60 PSI setting should be verified\n• Check for any drop in water pressure\n\nWant me to schedule a well service checkup?",
  "What maintenance is due soon?":
    "Here's what's coming up for **123 Main St**:\n\n🔴 **This week:** HVAC filter replacement (5 months since last change)\n🟡 **Within 30 days:** Water softener salt refill\n🟡 **Before November:** Roof inspection (shingle wear noted)\n🟢 **February 2025:** Annual well water test\n🟢 **Spring 2025:** Gutter cleaning\n\nWant me to create a maintenance calendar with reminders for all of these?",
};

const defaultResponse = "That's a great question! Based on your home data at 123 Main St, let me look into that for you. I have access to all your system records, service history, and maintenance schedules. Could you be a bit more specific so I can give you the most accurate answer?";

const greetingMessage: Message = {
  role: "assistant",
  content:
    "Hi! 👋 I know your home at **123 Main St** inside and out. Your HVAC filter size is **16x25x1** and was last changed 4 months ago — coming up on time to replace it. Your roof is showing **55% health** and needs attention soon.\n\nWhat would you like to know?",
};

const HomeAIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greetingMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setShowChips(false);
    const userMsg: Message = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = aiResponses[text] || defaultResponse;
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
      setTyping(false);
    }, 1200);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity glow-teal-strong"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:inset-auto md:bottom-24 md:right-4 md:w-[380px] md:h-[600px] md:rounded-2xl md:border md:border-border md:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">Home AI</p>
              <span className="text-[9px] text-muted-foreground">— Knows your home</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-health-green" />
              <span className="text-[10px] text-muted-foreground">Online · Ask me anything about 123 Main St</span>
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "assistant"
                  ? "bg-primary/5 border-l-2 border-primary text-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {renderMarkdown(msg.content)}
            </div>
          </div>
        ))}

        {/* Quick Reply Chips */}
        {showChips && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] text-primary font-medium hover:bg-primary/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-primary/5 border-l-2 border-primary rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0 hover:bg-secondary/80">
            <Mic className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about your home..."
            className="flex-1 rounded-full border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* Simple bold markdown renderer */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default HomeAIChat;
