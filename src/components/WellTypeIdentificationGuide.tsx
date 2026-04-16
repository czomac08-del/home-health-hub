import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, MapPin, Clock, Camera, ExternalLink } from "lucide-react";

interface WellVisualCard {
  id: string;
  name: string;
  whatYouSee: string;
  location: string;
  ageIndicator: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  visualCue: string;
}

const WELL_VISUAL_CARDS: WellVisualCard[] = [
  {
    id: "bored",
    name: "Bored Well",
    whatYouSee: "A large round casing, usually 18–36 inches wide, made of concrete rings or steel, often with a concrete pad around it. May have a metal or plastic cap on top.",
    location: "Usually within 50 feet of the home, sometimes very close to the foundation on older properties.",
    ageIndicator: "Very common on properties built before 1970, especially in the Southeast and rural Appalachia.",
    difficulty: "Easy",
    visualCue: "Looks like a large concrete or steel cylinder sticking a few inches above the ground.",
  },
  {
    id: "drilled",
    name: "Drilled Well",
    whatYouSee: "A narrow pipe, 4–6 inches in diameter, usually PVC or steel, extending 12–24 inches above the ground. Often has a sanitary well cap (a dome-shaped plastic or metal cover) on top. May have a pressure tank visible in the basement or pump house nearby.",
    location: "Anywhere on the property, often 50–100+ feet from the home.",
    ageIndicator: "Most common for homes built after 1960. The most common well type in the US today.",
    difficulty: "Easy",
    visualCue: "Looks like a narrow pipe sticking out of the ground with a cap on top, about the width of a coffee can.",
  },
  {
    id: "dug",
    name: "Dug Well",
    whatYouSee: "A very wide opening (2–4 feet across), often lined with stone, brick, or concrete rings. May be covered with a wooden, concrete, or metal lid. Sometimes looks like a decorative well or cistern. Common in very old properties.",
    location: "Close to the home, sometimes inside a well house or small stone structure.",
    ageIndicator: "Typically pre-1950. Rare on newer properties. Common in New England, Appalachia, and the rural South.",
    difficulty: "Moderate",
    visualCue: "Looks like a traditional wide well opening, often with stone or brick lining. May have a wooden cover or decorative well house over it.",
  },
  {
    id: "driven",
    name: "Driven / Sand Point Well",
    whatYouSee: "A very small diameter pipe (1.25–2 inches) driven directly into the ground, sometimes flush with the surface or only a few inches above it. Easy to miss entirely.",
    location: "Close to the home or basement. Sometimes exits through the basement wall or floor.",
    ageIndicator: "Common pre-1960 in sandy soil areas. Rare in rocky areas like Western NC mountains.",
    difficulty: "Hard",
    visualCue: "Looks like a small pipe barely visible at ground level, about the width of your thumb. Often overlooked.",
  },
  {
    id: "artesian",
    name: "Artesian Well",
    whatYouSee: "Similar appearance to a drilled well (narrow pipe), BUT water may flow continuously without a pump running, or there may be a control valve to regulate flow. Pressure tank may not be needed.",
    location: "Anywhere, but associated with areas known for pressurized aquifers.",
    ageIndicator: "Found across all eras. More common in specific geological areas (coastal plains, certain river valleys).",
    difficulty: "Hard",
    visualCue: "Looks like a drilled well above ground, but water may trickle or flow without the pump running.",
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/20 text-emerald-400",
  Moderate: "bg-amber-500/20 text-amber-400",
  Hard: "bg-red-500/20 text-red-400",
};

const WellTypeIdentificationGuide = ({ onScanPhoto }: { onScanPhoto?: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-card mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">🔍 Not Sure What Type You Have?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Visual identification guide to help you identify your well</p>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {WELL_VISUAL_CARDS.map((card) => (
            <div key={card.id} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
              <button
                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{card.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyColors[card.difficulty]}`}>
                    {card.difficulty} to ID
                  </span>
                </div>
                {expandedCard === card.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {expandedCard === card.id && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {/* Visual Cue Highlight */}
                  <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
                    <p className="text-sm text-foreground italic">"{card.visualCue}"</p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Eye className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">What you'll see</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{card.whatYouSee}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">Location</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{card.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">Age indicator</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{card.ageIndicator}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Professional Help Card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mt-2">
            <h4 className="text-sm font-semibold text-foreground mb-2">Still Not Sure? Get a Professional Opinion</h4>

            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-start gap-2.5">
                <span className="text-xs text-primary font-bold mt-0.5">1</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Licensed Well Contractor</p>
                  <p className="text-xs text-muted-foreground">Can physically assess and identify the well type, measure depth, and assess condition. Cost: $150–$400.</p>
                  <a
                    href="https://www.ngwa.org/get-connected/find-a-member"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium inline-flex items-center gap-1 mt-1 hover:underline"
                  >
                    Find on NGWA <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-xs text-primary font-bold mt-0.5">2</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Send a Photo</p>
                  <p className="text-xs text-muted-foreground">Take a clear photo of the wellhead and any visible casing, email it to a licensed well contractor. Many will identify the type for free.</p>
                </div>
              </div>
            </div>

            {onScanPhoto && (
              <button
                onClick={onScanPhoto}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                <Camera className="h-4 w-4" /> Take a Photo of My Well
              </button>
            )}

            <p className="text-[10px] text-muted-foreground mt-3">
              NC well contractors must be licensed. Verify at{" "}
              <a href="https://ncwellcert.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ncwellcert.com</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellTypeIdentificationGuide;
