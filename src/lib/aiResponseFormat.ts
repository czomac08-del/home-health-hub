import type { AIConfidenceLevel } from "@/components/AIConfidenceLabel";

export type AISegment =
  | { kind: "text"; value: string }
  | { kind: "label"; level: AIConfidenceLevel };

const TOKEN_RE = /(🟢\s*VERIFIED|🟡\s*UNVERIFIED|🔴\s*NOT\s*FOUND)/g;

export function parseAIResponse(text: string): AISegment[] {
  if (!text) return [{ kind: "text", value: "" }];
  const out: AISegment[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: "text", value: text.slice(last, start) });
    const t = m[0].toUpperCase();
    const level: AIConfidenceLevel = t.includes("UNVERIFIED")
      ? "unverified"
      : t.includes("NOT") ? "not_found" : "verified";
    out.push({ kind: "label", level });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}