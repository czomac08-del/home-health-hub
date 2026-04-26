/**
 * Home Checkup self-inspection content.
 * Sections 1–3 are fully populated. Sections 4–10 are stubs marked `stub: true`
 * so the wizard renders a "coming soon" placeholder for them. Items will be
 * filled in in a future pass.
 */
export type CheckupAnswer = "good" | "needs_attention" | "not_applicable";

export type CheckupTier = "safety" | "fix_before_listing" | "disclosure";

export interface CheckupItem {
  id: string;
  label: string;
  /** Optional how-to / what to look for, shown beneath the label. */
  howTo?: string;
  /** DIY guidance shown when item is flagged as Needs Attention. */
  diyTip?: string;
  /** Estimated DIY cost (low–high) for this fix, USD. */
  diyCostLow?: number;
  diyCostHigh?: number;
  /** Estimated contractor cost (low–high) for this fix, USD. */
  proCostLow?: number;
  proCostHigh?: number;
  /** Tier used when this item is flagged as Needs Attention. */
  tier: CheckupTier;
  /** Trade name for the "If you're not comfortable…" line. */
  trade?: string;
}

export interface CheckupSection {
  id: string;
  title: string;
  estMinutes: number;
  intro?: string;
  safetyNote?: string;
  items?: CheckupItem[];
  stub?: boolean;
}

export const CHECKUP_SECTIONS: CheckupSection[] = [
  {
    id: "exterior",
    title: "Exterior Walk-Around",
    estMinutes: 20,
    intro:
      "Walk the full perimeter of the home. For each item, mark Looks Good, Needs Attention, or Not Applicable. Add a photo if it helps you remember.",
    items: [
      {
        id: "driveway",
        label: "Driveway and walkways",
        howTo: "Look for cracks, displacement, and trip hazards.",
        diyTip:
          "Hairline cracks can be sealed with a tube of concrete crack filler. Anything that lifts a slab edge more than 1/4 inch is a trip hazard and may need a contractor.",
        diyCostLow: 15,
        diyCostHigh: 50,
        proCostLow: 250,
        proCostHigh: 1500,
        tier: "fix_before_listing",
        trade: "concrete or paving contractor",
      },
      {
        id: "steps_stoops",
        label: "Steps and stoops",
        howTo: "Open risers, loose bricks, or spacing greater than 4 inches between risers.",
        diyTip:
          "Loose bricks can be re-set with masonry adhesive. Open risers wider than 4 inches are a child-safety code issue and a buyer flag.",
        diyCostLow: 20,
        diyCostHigh: 100,
        proCostLow: 200,
        proCostHigh: 800,
        tier: "safety",
        trade: "mason",
      },
      {
        id: "exterior_doors",
        label: "Exterior doors",
        howTo: "Open and close each door. Check for binding and weatherstripping gaps.",
        diyTip:
          "Worn weatherstripping is a $15 fix at the hardware store and takes 20 minutes per door. Binding usually means a hinge screw is loose — try a longer screw first.",
        diyCostLow: 15,
        diyCostHigh: 60,
        proCostLow: 100,
        proCostHigh: 300,
        tier: "fix_before_listing",
        trade: "handyman",
      },
      {
        id: "siding",
        label: "Siding",
        howTo: "Look for visible damage, gaps, rot, or missing sections.",
        diyTip:
          "Small caulk gaps are DIY. Soft or rotted spots, especially near ground level, mean moisture has been getting in for a while and should be evaluated by a siding contractor.",
        diyCostLow: 10,
        diyCostHigh: 75,
        proCostLow: 300,
        proCostHigh: 2500,
        tier: "fix_before_listing",
        trade: "siding contractor",
      },
      {
        id: "trim",
        label: "Window and door trim",
        howTo: "Paint peeling, gaps, or missing caulk around frames.",
        diyTip:
          "Re-caulking trim is a beginner DIY job — one tube of paintable exterior caulk and a putty knife. Peeling paint should be scraped, primed, and repainted.",
        diyCostLow: 25,
        diyCostHigh: 100,
        proCostLow: 250,
        proCostHigh: 800,
        tier: "fix_before_listing",
        trade: "painter",
      },
      {
        id: "deck_porch",
        label: "Deck or porch",
        howTo:
          "Loose boards, trip hazards, railing stability (push firmly — it should not move), and visible ledger attachment.",
        diyTip:
          "Push firmly on the railing. If it moves, the post anchors need tightening or replacing. A handyman can fix this for $50–150. If you're comfortable with basic tools, tightening lag bolts yourself takes about 20 minutes.",
        diyCostLow: 0,
        diyCostHigh: 30,
        proCostLow: 50,
        proCostHigh: 400,
        tier: "safety",
        trade: "handyman or deck builder",
      },
      {
        id: "gutters",
        label: "Gutters and downspouts",
        howTo: "Debris, sagging, and downspouts that terminate away from the foundation.",
        diyTip:
          "Cleaning gutters yourself takes an afternoon and a stable ladder. Add a downspout extension ($10) to push water 4–6 feet away from the foundation.",
        diyCostLow: 10,
        diyCostHigh: 50,
        proCostLow: 150,
        proCostHigh: 350,
        tier: "fix_before_listing",
        trade: "gutter cleaner",
      },
      {
        id: "grading",
        label: "Grading around foundation",
        howTo: "Ground should slope away from the house. Water pooling near the foundation is a flag.",
        diyTip:
          "Minor low spots can be filled with topsoil and re-sloped yourself. Persistent pooling or water entering a crawlspace or basement should be evaluated by a foundation or drainage pro.",
        diyCostLow: 30,
        diyCostHigh: 150,
        proCostLow: 500,
        proCostHigh: 4000,
        tier: "fix_before_listing",
        trade: "drainage contractor",
      },
      {
        id: "spigots",
        label: "Exterior spigots",
        howTo: "Turn on each spigot and check for leaks. The spigot should be secure to the wall.",
        diyTip:
          "A loose spigot can usually be re-secured with one or two screws into the rim joist. A leaking spigot may just need a new washer ($2).",
        diyCostLow: 2,
        diyCostHigh: 20,
        proCostLow: 125,
        proCostHigh: 300,
        tier: "fix_before_listing",
        trade: "plumber",
      },
      {
        id: "exterior_lights",
        label: "Exterior lights and outlets",
        howTo: "Test all exterior lights and outlets. Outlets should be GFCI-protected.",
        diyTip:
          "Replacing a bulb or fixture is DIY. Outlets that don't work, spark, or feel warm should be evaluated by an electrician.",
        diyCostLow: 5,
        diyCostHigh: 40,
        proCostLow: 150,
        proCostHigh: 350,
        tier: "safety",
        trade: "electrician",
      },
    ],
  },
  {
    id: "roof",
    title: "Roof (Ground Level Only)",
    estMinutes: 15,
    safetyNote:
      "Do not walk on your roof without proper equipment and training. This inspection is from the ground and from the attic only.",
    items: [
      {
        id: "shingles_visible",
        label: "Walk the perimeter and look up",
        howTo: "Missing, curling, or buckling shingles visible from the ground.",
        diyTip:
          "A few missing shingles after a storm can sometimes be replaced for under $200 by a roofer. Widespread curling usually means the roof is near end-of-life.",
        diyCostLow: 0,
        diyCostHigh: 0,
        proCostLow: 200,
        proCostHigh: 800,
        tier: "fix_before_listing",
        trade: "roofer",
      },
      {
        id: "roof_gutters",
        label: "Gutters from below",
        howTo: "Clean, attached, and downspouts properly connected.",
        diyTip: "See exterior section — same fix.",
        diyCostLow: 10,
        diyCostHigh: 50,
        proCostLow: 150,
        proCostHigh: 350,
        tier: "fix_before_listing",
        trade: "gutter cleaner",
      },
      {
        id: "chimney",
        label: "Chimney (if present)",
        howTo: "Visible mortar damage, cap present, flashing visible at the base.",
        diyTip:
          "Missing chimney cap is a common, fixable issue ($75–200 installed). Mortar joints that look crumbly need a mason — this is not a beginner DIY.",
        diyCostLow: 0,
        diyCostHigh: 0,
        proCostLow: 150,
        proCostHigh: 1500,
        tier: "fix_before_listing",
        trade: "mason or chimney sweep",
      },
      {
        id: "attic_water_stains",
        label: "Attic ceiling — water stains",
        howTo: "Check the attic ceiling from the inside for any water stains or damp insulation.",
        diyTip:
          "Any water stain on roof decking should be evaluated by a roofer — even if it looks dry now, it means a leak existed at some point.",
        proCostLow: 200,
        proCostHigh: 800,
        tier: "safety",
        trade: "roofer",
      },
      {
        id: "roof_age",
        label: "Note the age of the roof if known",
        howTo:
          "If the roof is over 15 years old, plan to have a professional roofer evaluate it before listing.",
        diyTip:
          "Buyers and inspectors will ask. A roofer's written evaluation costs $0–150 and gives you a real answer instead of a guess.",
        proCostLow: 0,
        proCostHigh: 150,
        tier: "disclosure",
        trade: "roofer",
      },
    ],
  },
  {
    id: "attic",
    title: "Attic",
    estMinutes: 15,
    safetyNote:
      "Use a proper ladder, bring a flashlight, and only step on the joists or laid-down decking — never on the insulation between joists.",
    intro:
      "If your attic isn't safely accessible, mark each item as Not Applicable and note that in your report.",
    items: [
      {
        id: "insulation_present",
        label: "Insulation present and evenly distributed",
        howTo: "Look across the attic floor — insulation should be even, not bunched or missing in spots.",
        diyTip:
          "Adding loose-fill insulation in low spots is a doable DIY project with a rented blower (~$100/day rental). Buyers love seeing R-38 or higher in the report.",
        diyCostLow: 100,
        diyCostHigh: 400,
        proCostLow: 800,
        proCostHigh: 2500,
        tier: "fix_before_listing",
        trade: "insulation contractor",
      },
      {
        id: "no_daylight",
        label: "No visible daylight through roof decking",
        howTo: "Turn off your flashlight for a moment. You should not see daylight through the roof.",
        diyTip:
          "Visible daylight = an active hole in the roof. This is a roofer call, not DIY.",
        proCostLow: 200,
        proCostHigh: 1500,
        tier: "safety",
        trade: "roofer",
      },
      {
        id: "no_water_stains",
        label: "No water stains on decking or rafters",
        howTo: "Look for dark streaks, bubbled wood, or stained insulation.",
        diyTip: "Any stain — even an old one — should be evaluated by a roofer to confirm the leak is closed.",
        proCostLow: 200,
        proCostHigh: 800,
        tier: "safety",
        trade: "roofer",
      },
      {
        id: "ventilation",
        label: "Ventilation present",
        howTo: "Soffit vents, ridge vent, or gable vents should be visible. Air should be able to move through the attic.",
        diyTip:
          "Blocked soffit vents (often blocked by insulation) reduce airflow and shorten roof life. Baffles cost ~$3 each and are an easy DIY install.",
        diyCostLow: 30,
        diyCostHigh: 100,
        proCostLow: 300,
        proCostHigh: 800,
        tier: "fix_before_listing",
        trade: "roofer or insulation contractor",
      },
      {
        id: "attic_door",
        label: "Attic access door or stairs",
        howTo: "Should be insulated and weatherstripped on the attic side.",
        diyTip:
          "An insulated attic-stair cover is a 30-minute install and one of the highest-ROI energy fixes you can do — buyers notice this on inspection reports.",
        diyCostLow: 50,
        diyCostHigh: 150,
        proCostLow: 200,
        proCostHigh: 400,
        tier: "fix_before_listing",
        trade: "handyman",
      },
      {
        id: "no_animals",
        label: "No signs of animal entry or nesting",
        howTo: "Look for droppings, chewed wood or wires, or nesting material.",
        diyTip:
          "Active animal activity should be handled by a wildlife removal pro, not poison or DIY traps. Any chewed wiring is a fire hazard and needs an electrician.",
        proCostLow: 250,
        proCostHigh: 1200,
        tier: "safety",
        trade: "wildlife removal specialist",
      },
    ],
  },
  // Sections 4-10 are stubs for the first pass.
  { id: "crawlspace", title: "Crawlspace", estMinutes: 15, stub: true,
    intro: "Vapor barrier, standing water, mold, insulation, pests, foundation walls, and visible plumbing.",
    safetyNote: "Bring a flashlight. Do not enter if there is standing water." },
  { id: "kitchen", title: "Kitchen", estMinutes: 20, stub: true,
    intro: "Cabinets, under-sink, garbage disposal, dishwasher, oven/range anti-tip, refrigerator, and outlet testing." },
  { id: "bathrooms", title: "Bathrooms", estMinutes: 20, stub: true,
    intro: "Sinks, tubs, showers, exhaust fans, toilets, and GFCI outlets — for each bathroom." },
  { id: "interior", title: "Interior", estMinutes: 20, stub: true,
    intro: "Doors, windows (egress), ceiling fans, ceiling/wall stains, and floors." },
  { id: "electrical", title: "Electrical Basics", estMinutes: 15, stub: true,
    intro: "Smoke and CO detectors, outlet testing, GFCI testing, and a visual-only check of the panel.",
    safetyNote: "Do not open the electrical panel yourself. Visual exterior check only." },
  { id: "hvac", title: "HVAC", estMinutes: 15, stub: true,
    intro: "Air filter, cooling test, vent clearance, exterior unit clearance, last service, and condensate drain." },
  { id: "water_heater", title: "Water Heater", estMinutes: 10, stub: true,
    intro: "Locate the unit, hot water test, rust/corrosion check, and TPR valve check." },
];

export const TOTAL_SECTIONS = CHECKUP_SECTIONS.length;
export const TOTAL_MINUTES = CHECKUP_SECTIONS.reduce((sum, s) => sum + s.estMinutes, 0);

export const ANSWER_LABEL: Record<CheckupAnswer, string> = {
  good: "Looks Good",
  needs_attention: "Needs Attention",
  not_applicable: "Not Applicable",
};

export const TIER_META: Record<CheckupTier, { label: string; color: string; emoji: string; description: string }> = {
  safety: {
    label: "Safety First",
    color: "danger",
    emoji: "🔴",
    description: "Potential fire, electrocution, or injury hazards. Do these before listing.",
  },
  fix_before_listing: {
    label: "Fix Before Listing",
    color: "warning",
    emoji: "🟡",
    description: "Items buyers and inspectors will flag in negotiations. Fixing these saves money off your sale price.",
  },
  disclosure: {
    label: "Note for Disclosure",
    color: "primary",
    emoji: "🟢",
    description: "Not urgent, but should be disclosed to buyers. Document them here.",
  },
};
