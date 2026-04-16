export interface WellType {
  id: string;
  name: string;
  description: string;
  depthRange: string;
  diameter: string;
  droughtRisk: "low" | "moderate" | "high" | "very-high";
}

export const WELL_TYPES: WellType[] = [
  {
    id: "bored",
    name: "Bored Well",
    description: "Large diameter (18–36\"), shallow (25–50 ft), drilled by auger. Most susceptible to drought and surface contamination.",
    depthRange: "25–50 ft",
    diameter: "18–36\"",
    droughtRisk: "very-high",
  },
  {
    id: "drilled",
    name: "Drilled Well",
    description: "Narrow diameter (4–6\"), deep (100–400+ ft). Most common modern well. Least susceptible to drought.",
    depthRange: "100–400+ ft",
    diameter: "4–6\"",
    droughtRisk: "low",
  },
  {
    id: "dug",
    name: "Dug Well",
    description: "Hand or machine dug, large diameter, very shallow (under 30 ft). Highest contamination and drought risk.",
    depthRange: "Under 30 ft",
    diameter: "Large",
    droughtRisk: "very-high",
  },
  {
    id: "driven",
    name: "Driven / Sand Point Well",
    description: "Small pipe driven into ground, shallow (under 50 ft). Moderate drought susceptibility.",
    depthRange: "Under 50 ft",
    diameter: "Small pipe",
    droughtRisk: "moderate",
  },
  {
    id: "artesian",
    name: "Artesian Well",
    description: "Fed by pressurized confined aquifer, can be very deep. Most drought-resistant type.",
    depthRange: "Variable (deep)",
    diameter: "Variable",
    droughtRisk: "low",
  },
];

export type DroughtLevel = "None" | "D0" | "D1" | "D2" | "D3" | "D4";

export const DROUGHT_COLORS: Record<DroughtLevel, string> = {
  None: "bg-emerald-500",
  D0: "bg-yellow-400",
  D1: "bg-amber-500",
  D2: "bg-orange-500",
  D3: "bg-red-500",
  D4: "bg-red-800",
};

export const DROUGHT_TEXT_COLORS: Record<DroughtLevel, string> = {
  None: "text-emerald-400",
  D0: "text-yellow-400",
  D1: "text-amber-400",
  D2: "text-orange-400",
  D3: "text-red-400",
  D4: "text-red-600",
};

export const DROUGHT_LABELS: Record<DroughtLevel, string> = {
  None: "No Drought",
  D0: "Abnormally Dry",
  D1: "Moderate Drought",
  D2: "Severe Drought",
  D3: "Extreme Drought",
  D4: "Exceptional Drought",
};

type WellCategory = "shallow" | "drilled" | "artesian";
function wellCategory(wellType: string): WellCategory {
  if (wellType === "drilled") return "drilled";
  if (wellType === "artesian") return "artesian";
  return "shallow"; // bored, dug, driven
}

export const USAGE_MATRIX: Record<DroughtLevel, Record<WellCategory, string>> = {
  None: {
    shallow: "Normal use",
    drilled: "Normal use",
    artesian: "Normal use",
  },
  D0: {
    shallow: "Limit to 45 min continuous, 1–2 hr recovery",
    drilled: "Limit to 60 min, monitor levels",
    artesian: "Normal use, monitor",
  },
  D1: {
    shallow: "Limit to 40 min continuous, 1–2 hr recovery",
    drilled: "Limit to 45 min, 1 hr recovery",
    artesian: "Limit to 60 min",
  },
  D2: {
    shallow: "Limit to 30 min continuous, 2–3 hr recovery. Avoid all non-essential use (irrigation, car washing).",
    drilled: "Limit to 30 min, 1–2 hr recovery",
    artesian: "Limit to 45 min",
  },
  D3: {
    shallow: "Limit to 20 min, 3–4 hr recovery. Essential use only. No irrigation.",
    drilled: "Limit to 25 min, 2 hr recovery. No irrigation.",
    artesian: "Limit to 30 min, monitor",
  },
  D4: {
    shallow: "15 min max, 4–6 hr recovery. Emergency use only.",
    drilled: "15 min max, 2–3 hr recovery. No irrigation.",
    artesian: "30 min max, reduce non-essential use",
  },
};

export function getUsageGuideline(wellType: string, droughtLevel: DroughtLevel): string {
  const cat = wellCategory(wellType);
  return USAGE_MATRIX[droughtLevel]?.[cat] || "Normal use";
}

// Extract max continuous minutes from guideline for timer
export function getMaxMinutes(wellType: string, droughtLevel: DroughtLevel): number {
  const guideline = getUsageGuideline(wellType, droughtLevel);
  const match = guideline.match(/(\d+)\s*min/);
  return match ? parseInt(match[1]) : 60;
}

// Extract recovery hours
export function getRecoveryHours(wellType: string, droughtLevel: DroughtLevel): number {
  const guideline = getUsageGuideline(wellType, droughtLevel);
  const match = guideline.match(/(\d+)(?:–(\d+))?\s*hr/);
  if (match) return match[2] ? parseInt(match[2]) : parseInt(match[1]);
  return 2;
}

export const LIFETIME_TIPS: Record<string, string[]> = {
  bored: [
    "Limit continuous pumping to 30 minutes followed by a 2–3 hour recovery period to protect your pump",
    "Test water quality annually — bored wells are more susceptible to surface contamination",
    "Inspect the well casing and cap annually for cracks or gaps",
  ],
  drilled: [
    "Annual water quality testing recommended",
    "Check pressure tank annually for proper pre-charge pressure",
    "Inspect well cap for cracks or damage yearly",
  ],
  dug: [
    "Test water every 6 months — dug wells have the highest contamination risk",
    "Never use near septic systems — maintain at least 50 ft separation",
    "Inspect casing for cracks seasonally, especially after freeze/thaw cycles",
  ],
  driven: [
    "Monitor for sediment in water indicating screen damage",
    "Redriving may be needed after prolonged drought periods",
    "Test water quality annually and after any noticeable changes in taste or color",
  ],
  artesian: [
    "Monitor flow rate annually — declining flow may indicate aquifer issues",
    "Check for pressure changes that indicate confined aquifer depletion",
    "Inspect casing and wellhead for leaks or mineral buildup annually",
  ],
};

export function getSeasonalReminder(): { season: string; reminder: string } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) {
    return { season: "Spring", reminder: "Test water quality after winter — bacteria and nitrates can enter during spring thaw and heavy rain" };
  } else if (month >= 5 && month <= 7) {
    return { season: "Summer", reminder: "Monitor water level and pressure — reduce usage during peak drought months" };
  } else if (month >= 8 && month <= 10) {
    return { season: "Fall", reminder: "Inspect well cap and casing before winter — seal any cracks before ground freezes" };
  } else {
    return { season: "Winter", reminder: "Insulate exposed pipes — check heat tape if installed" };
  }
}
