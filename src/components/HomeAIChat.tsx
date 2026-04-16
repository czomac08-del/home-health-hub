import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, Send, Mic } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SystemDetailRecord {
  system_name: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  purchase_date: string | null;
  last_service: string | null;
  next_service: string | null;
  notes: string | null;
  location_in_home: string | null;
  specs: Record<string, unknown> | null;
}

const quickReplies = [
  "When should I change my HVAC filter?",
  "What does my well pump need?",
  "Is my roof going to be okay this winter?",
  "What maintenance is due soon?",
];

const TOPICS = {
  hvac: {
    label: "HVAC",
    setupRoute: "/system-config/HVAC",
    aliases: ["hvac", "air", "ac", "heat", "filter", "thermostat"],
    matches: (name: string) => name.includes("hvac"),
  },
  well: {
    label: "Well / Water Source",
    setupRoute: "/well-water",
    aliases: ["well", "pump", "well water", "water source"],
    matches: (name: string) => name.includes("well") || name.includes("water source"),
  },
  roof: {
    label: "Roof",
    setupRoute: "/system-config/Roof",
    aliases: ["roof", "shingle", "gutter"],
    matches: (name: string) => name.includes("roof"),
  },
  electrical: {
    label: "Electrical Panel",
    setupRoute: "/system-config/Electrical%20Panel",
    aliases: ["electrical", "panel", "breaker", "gfci", "outlet"],
    matches: (name: string) => name.includes("electrical"),
  },
  plumbing: {
    label: "Plumbing",
    setupRoute: "/system-config/Plumbing",
    aliases: ["plumbing", "pipe", "leak", "shutoff"],
    matches: (name: string) => name.includes("plumbing"),
  },
  waterHeater: {
    label: "Water Heater",
    setupRoute: "/system-config/Water%20Heater",
    aliases: ["water heater", "heater", "tankless", "anode"],
    matches: (name: string) => name.includes("water heater"),
  },
} as const;

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
};

const formatDate = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const countRealDataPoints = (record: SystemDetailRecord | null) => {
  if (!record) return 0;
  const values = [
    record.brand,
    record.model,
    record.install_date,
    record.purchase_date,
    record.last_service,
    record.next_service,
    record.notes,
    record.location_in_home,
  ];

  let count = values.filter(hasValue).length;

  if (record.specs && typeof record.specs === "object") {
    count += Object.values(record.specs).filter(hasValue).length;
  }

  return count;
};

const buildMissingResponse = (label: string, setupRoute: string) =>
  `I don't have any information about your **${label}** yet.\n\nHere's how you can add it:\n1. Open **${setupRoute === "/well-water" ? "Well Water" : "Systems"}**\n2. ${setupRoute === "/well-water" ? "Document your well type, water tests, or uploaded records" : `Open **${label}** and add details manually`}\n3. Upload a photo, receipt, inspection report, or service document if you have one\n\nI won't guess about age, condition, or risk until that information is documented.`;

const HomeAIChat = () => {
  const [open, setOpen] = useState(false);
  const { user, activeProperty } = useAuth();
  const addr = activeProperty?.address || "your home";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [systemDetails, setSystemDetails] = useState<SystemDetailRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!open || !user || !activeProperty) return;

    let ignore = false;
    setLoadingData(true);

    supabase
      .from("system_details")
      .select("system_name, brand, model, install_date, purchase_date, last_service, next_service, notes, location_in_home, specs")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!ignore && data) setSystemDetails(data as SystemDetailRecord[]);
      })
      .finally(() => {
        if (!ignore) setLoadingData(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, user, activeProperty]);

  const documentedSystems = useMemo(
    () => systemDetails.filter((record) => countRealDataPoints(record) > 0),
    [systemDetails],
  );

  const greeting = useMemo(() => {
    if (loadingData) {
      return `Hi! 👋 I'm your Home IQ Assistant for **${addr}**. I'm loading your documented home data now.`;
    }

    if (documentedSystems.length === 0) {
      return `Hi! 👋 I'm your Home IQ Assistant for **${addr}**.\n\nI only answer using information you've documented, uploaded, or that comes from verified data sources. Right now, I don't have any documented system details yet.\n\nAsk me about a system and I'll tell you exactly what's missing and how to add it.`;
    }

    return `Hi! 👋 I'm your Home IQ Assistant for **${addr}**.\n\nI only use documented information — never guesses. Right now, I have some documented details for **${documentedSystems.map((record) => record.system_name).join(", ")}**.\n\nAsk me about a system and I'll tell you what I know — and what I don't.`;
  }, [addr, documentedSystems, loadingData]);

  useEffect(() => {
    if (open) {
      setMessages([{ role: "assistant", content: greeting }]);
      setShowChips(true);
      setInput("");
    }
  }, [open, greeting]);

  const findTopicKey = (text: string) => {
    const lower = text.toLowerCase();
    return (Object.keys(TOPICS) as Array<keyof typeof TOPICS>).find((key) =>
      TOPICS[key].aliases.some((alias) => lower.includes(alias)),
    );
  };

  const findRecordForTopic = (topicKey: keyof typeof TOPICS) => {
    return documentedSystems.find((record) => TOPICS[topicKey].matches(record.system_name.toLowerCase())) || null;
  };

  const buildEvidenceLines = (record: SystemDetailRecord) => {
    const lines: string[] = [];
    const equipment = [record.brand, record.model].filter(Boolean).join(" ").trim();
    if (equipment) lines.push(`equipment documented: **${equipment}**`);
    if (record.install_date) lines.push(`installation date documented: **${formatDate(record.install_date)}**`);
    if (record.purchase_date) lines.push(`purchase date documented: **${formatDate(record.purchase_date)}**`);
    if (record.last_service) lines.push(`last service documented: **${formatDate(record.last_service)}**`);
    if (record.next_service) lines.push(`next service documented: **${formatDate(record.next_service)}**`);

    if (record.specs && typeof record.specs === "object") {
      Object.entries(record.specs)
        .filter(([, value]) => hasValue(value))
        .slice(0, 2)
        .forEach(([key, value]) => {
          lines.push(`${key}: **${String(value)}**`);
        });
    }

    return lines;
  };

  const buildAssistantReply = (text: string) => {
    const lower = text.toLowerCase();

    if (lower.includes("maintenance") || lower.includes("due soon")) {
      const dueItems = documentedSystems.filter((record) => hasValue(record.next_service));

      if (dueItems.length === 0) {
        return `I don't have any documented upcoming service dates yet.\n\nI only surface maintenance items when they're based on a real date you've entered or a document you've uploaded.\n\nTo get this working:\n1. Open a system\n2. Add its last or next service date\n3. Upload service invoices or inspection reports`;
      }

      return `Here are the maintenance items I can verify from your documented system data:\n\n${dueItems
        .map((record) => `- **${record.system_name}** — next service: **${formatDate(record.next_service) || record.next_service}**`)
        .join("\n")}\n\nI left out any systems that aren't documented well enough yet.`;
    }

    const topicKey = findTopicKey(text);
    if (!topicKey) {
      return `I can help, but I won't invent details that aren't documented.\n\nAsk me about a specific system like **HVAC, roof, electrical, plumbing, well, or water heater**, and I'll tell you exactly what information is documented and what's still missing.`;
    }

    const topic = TOPICS[topicKey];
    const record = findRecordForTopic(topicKey);

    if (!record) {
      return buildMissingResponse(topic.label, topic.setupRoute);
    }

    const dataPointCount = countRealDataPoints(record);
    const evidenceLines = buildEvidenceLines(record);

    if (dataPointCount < 2) {
      return `I have **partial information** about your **${topic.label}**, but not enough data to give an accurate health score or condition recommendation.\n\n**What I have:**\n${evidenceLines.map((line) => `- ${line}`).join("\n")}\n\n**Needs your input:** add at least one more real data point — like a service date, replacement date, uploaded photo, or inspection document.`;
    }

    const recommendation = record.next_service
      ? `Based on your documented **next service date (${formatDate(record.next_service)})**, that's the next maintenance item I can verify for this system.`
      : record.last_service
        ? `Based on your documented **last service date (${formatDate(record.last_service)})**, I can summarize what you have, but I still need a current inspection, photo, or next service date before I can make a stronger recommendation.`
        : `Based on the documented details below, I can help interpret what you've saved — but I still won't guess about condition or risk without a dated inspection or service record.`;

    return `I have documented information about your **${topic.label}**.\n\n**Based on:**\n${evidenceLines.map((line) => `- ${line}`).join("\n")}\n\n${recommendation}\n\nIf you add another photo, receipt, or inspection report, I can give a more specific answer based on that source.`;
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setShowChips(false);
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = buildAssistantReply(text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setTyping(false);
    }, 500);
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">Home IQ Assistant</p>
              <span className="text-[9px] text-muted-foreground">— Honest by default</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-health-green" />
              <span className="text-[10px] text-muted-foreground">Online · Answers only from documented data</span>
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

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
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

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

      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0 hover:bg-secondary/80">
            <Mic className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about documented home data..."
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

export default HomeAIChat;
