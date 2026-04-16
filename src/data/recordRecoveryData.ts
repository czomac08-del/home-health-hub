export type SystemRecordType = "well" | "septic" | "hvac" | "electrical" | "plumbing" | "roof" | "building_permit" | "water_heater";

export const SYSTEM_TYPE_MAP: Record<string, SystemRecordType> = {
  "Well Water": "well",
  "Water Source": "well",
  "HVAC": "hvac",
  "Electrical Panel": "electrical",
  "Plumbing": "plumbing",
  "Roof": "roof",
  "Sewer and Waste": "septic",
  "Water Heater": "water_heater",
  "Natural Gas / Propane": "hvac",
};

export const RECORD_TYPES = [
  { value: "permit", label: "Permit" },
  { value: "inspection", label: "Inspection Report" },
  { value: "water_test", label: "Water Test" },
  { value: "contractor_invoice", label: "Contractor Invoice" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

export const SOURCE_TYPES = [
  { value: "state_database", label: "State Database" },
  { value: "county_office", label: "County Office" },
  { value: "paper_scan", label: "Paper Scan" },
  { value: "contractor", label: "Contractor" },
  { value: "previous_owner", label: "Previous Owner" },
  { value: "other", label: "Other" },
];

interface RecoveryStep {
  title: string;
  description: string;
  tip?: string;
  searchTemplate?: string;
  directUrl?: string;
  directUrlLabel?: string;
  scriptPrompt?: string;
}

const WELL_DATABASES: Record<string, string> = {
  NC: "https://www.nconemap.gov/pages/wells",
  SC: "https://www.dhec.sc.gov/environment/water/groundwater",
  GA: "https://epd.georgia.gov/water",
  VA: "https://www.deq.virginia.gov/water/water-quantity/groundwater/well-information",
  FL: "https://floridadep.gov/water/source-drinking-water/content/water-well-construction-permitting",
  TX: "https://www.twdb.texas.gov/groundwater/data/gwdbrpt.asp",
  TN: "https://www.tn.gov/environment/program-areas/wr-water-resources/groundwater/well-records.html",
  NY: "https://www.dec.ny.gov/chemical/8560.html",
  PA: "https://www.dep.pa.gov/Business/Water/DrinkingWater/WaterSupplyManagement/Pages/Well-Permitting.aspx",
  OH: "https://ohiodnr.gov/wps/portal/gov/odnr/discover-and-learn/safety-conservation/about-ODNR/geologic-survey/water-well-log-search",
  MI: "https://www.michigan.gov/egle/about/organization/water-resources/well-search",
  IN: "https://www.in.gov/dnr/water/water-well-record-search/",
  IL: "https://www.isgs.illinois.edu/sections/oil-gas-resources/isws-water-well-records",
  WI: "https://dnr.wisconsin.gov/topic/Wells/drillersSearch.html",
  MN: "https://mnwellindex.web.health.state.mn.us/",
  CA: "https://data.cnra.ca.gov/dataset/well-completion-reports",
  WA: "https://apps.ecology.wa.gov/wellconstructor/",
  OR: "https://www.oregon.gov/owrd/pages/wr/groundwater_logs.aspx",
  CO: "https://dwr.state.co.us/Tools/WellSearch",
  AZ: "https://gisweb.azwater.gov/waterresourcedata/",
};

export function getRecoverySteps(systemType: SystemRecordType, county: string, state: string, address: string): RecoveryStep[] {
  const steps: RecoveryStep[] = [];

  // Step 1 — State/County digital database
  if (systemType === "well") {
    steps.push({
      title: "Search Your State Well Database",
      description: `Search the ${state} well database by your property address or parcel number. Digital records typically begin around 1989 (varies by state). If your well predates this, proceed to Step 2.`,
      searchTemplate: `${state} state well water database search`,
      tip: "Look for the state Department of Environmental Quality (DEQ) or equivalent. Many states have free online well record searches.",
    });
  } else if (systemType === "septic") {
    steps.push({
      title: "Search County Environmental Health Records",
      description: `Septic records are held at the county level. Search ${county} County Environmental Health online portal. Most counties have records for systems installed after 1985.`,
      searchTemplate: `${county} county environmental health septic records ${state}`,
      tip: "County health departments issue septic permits. Call them directly if online records aren't available.",
    });
  } else if (systemType === "roof") {
    steps.push({
      title: "Search County Permit Portal",
      description: `Roofing permits are filed with your local building department. Search the ${county} County permit portal. If your roof was replaced before 2000, proceed to Step 2.`,
      searchTemplate: `${county} county building permit records search ${state}`,
    });
  } else {
    const label = systemType === "electrical" ? "Electrical" : systemType === "plumbing" ? "Plumbing" : systemType === "hvac" ? "HVAC" : "Building";
    steps.push({
      title: `Search County ${label} Permit Portal`,
      description: `Search your city or county permit portal. Many counties digitized permits from the late 1990s forward. For older permits, proceed to Step 2.`,
      searchTemplate: `${county} county ${label.toLowerCase()} permit records search ${state}`,
    });
  }

  // Step 2 — Contact county directly
  const office = (systemType === "well" || systemType === "septic")
    ? "Environmental Health"
    : "Building Inspections / Planning Department";
  steps.push({
    title: "Contact Your County Office",
    description: `Contact the ${county} County ${office}. Staff can search both digital systems and paper archives for your records.`,
    searchTemplate: `${county} county ${office.toLowerCase()} phone number ${state}`,
    scriptPrompt: `"I'm looking for permit records for a property at ${address}. The system was likely installed around [year]. Do you have any records on file, including paper records that may not be digitized?"`,
    tip: "Ask them to check BOTH their digital system AND any paper archives. Pre-1990 records are often in filing cabinets or microfiche that staff can manually search.",
  });

  // Step 3 — Deed/title records
  steps.push({
    title: "Search Property Deed & Title Records",
    description: "Check your county Register of Deeds, previous home inspection reports, seller's disclosure statement, HOA documents, and title insurance commitment letter.",
    searchTemplate: `${county} county register of deeds ${state}`,
    tip: "Seller disclosure statements often mention system ages, repairs, and known issues — even if no formal record exists.",
  });

  // Step 4 — Previous owner/contractor
  steps.push({
    title: "Check With Previous Owner or Contractor",
    description: "Previous owners sometimes have records they forgot to transfer at closing. If you have contact info for the seller or know who installed/serviced this system, reach out.",
    tip: "A quick call or email to the previous owner can sometimes yield years of maintenance records they kept in a drawer.",
  });

  // Step 5 — Professional assessment
  const assessments: Record<string, { desc: string; cost: string }> = {
    well: { desc: "Licensed well contractor assessment — depth, static/pumping water level, flow rate, casing condition.", cost: "$150–$400" },
    septic: { desc: "Septic inspection — tank location, size, last pump date, leach field condition.", cost: "$200–$500" },
    electrical: { desc: "Licensed electrician panel inspection — amperage, breaker condition, wiring type, code compliance.", cost: "$100–$200" },
    plumbing: { desc: "Plumber assessment — pipe material, shutoff locations, water heater condition.", cost: "$100–$200" },
    hvac: { desc: "HVAC technician inspection — unit age, efficiency rating, filter size, ductwork condition.", cost: "$75–$150" },
    roof: { desc: "Roofing contractor inspection — material type, age estimate, condition, any active leaks.", cost: "$0–$200 (many roofers inspect free)" },
    water_heater: { desc: "Plumber assessment — tank condition, anode rod, efficiency, age estimate.", cost: "$75–$150" },
    building_permit: { desc: "General contractor walk-through — identify unpermitted work, code issues.", cost: "$100–$250" },
  };
  const a = assessments[systemType] || assessments.hvac;
  steps.push({
    title: "Get a Professional Assessment",
    description: `${a.desc} Typical cost: ${a.cost}.`,
    tip: "A professional assessment creates a baseline record for your property — even if original records can't be found.",
  });

  return steps;
}

export function calculateRecordsCompleteness(
  recordCount: number,
  hasManualData: boolean,
  hasWellType: boolean,
  systemType: SystemRecordType,
): number {
  let score = 0;
  
  // Well type or basic config selected = 15%
  if (hasWellType || hasManualData) score += 15;
  
  // First record = +25%
  if (recordCount >= 1) score += 25;
  
  // Second record = +15%
  if (recordCount >= 2) score += 15;
  
  // Third record = +15%
  if (recordCount >= 3) score += 15;
  
  // More records = up to +30%
  if (recordCount >= 4) score += 15;
  if (recordCount >= 5) score += 15;
  
  return Math.min(score, 100);
}
