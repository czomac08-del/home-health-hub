import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import AIConfidenceStrip from "@/components/AIConfidenceStrip";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const CHIPS = [
  "What is covered under my warranty?",
  "How do I file a warranty claim?",
  "Is labor included or just parts?",
  "What voids my warranty?",
  "Does this cover accidental damage?",
  "Can I transfer this warranty if I sell my home?",
];

export default function WarrantyAIChat({ warrantyContext, systemContext, systemInfo }: {
  warrantyContext: string;
  systemContext: string;
  systemInfo?: { system_name: string; brand?: string | null } | null;
}) {
  const brand = systemInfo?.brand || "your";
  const name = systemInfo?.system_name || "appliance";
  const hasWarranty = warrantyContext.trim().length > 0;

  const opening = hasWarranty
    ? `I have read your ${brand} ${name} warranty information. ${warrantyContext.includes("Active") ? "Your warranty is currently active." : "Some warranties may be expired."} What would you like to know?`
    : `I do not have your warranty document on file. Upload it and I can answer specific questions about your coverage. In the meantime, here is general information about typical warranties for this type of ${name}.`;

  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: opening }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setStreaming(true);

    try {
      const response = await supabase.functions.invoke("warranty-chat", {
        body: { messages: updated.map(m => ({ role: m.role, content: m.content })), warrantyContext, systemContext },
      });

      if (response.error) throw response.error;

      const reader = response.data instanceof ReadableStream
        ? response.data.getReader()
        : new Response(response.data).body?.getReader();

      if (!reader) throw new Error("No reader");

      let assistantContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: assistantContent }]);
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setStreaming(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Warranty AI — Ask about your warranty</span>
      </div>
      <div className="max-h-72 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Chips */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {CHIPS.map(c => (
            <button key={c} onClick={() => send(c)} className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your warranty..."
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        />
        <button onClick={() => send(input)} disabled={streaming || !input.trim()} className="bg-primary text-primary-foreground p-2 rounded-lg disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
