// Field definitions for each system type's "Specifications" section

export type FieldType = "text" | "number" | "date" | "select" | "toggle" | "checkboxes";

export interface SpecField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  warning?: Record<string, string>; // option value → warning message
  suffix?: string;
}

const hvacFields: SpecField[] = [
  { key: "filterSize", label: "Filter Size", type: "text", placeholder: "e.g. 16x25x1" },
  { key: "filterType", label: "Filter Type", type: "select", options: ["HEPA", "Fiberglass", "Pleated", "Electrostatic"] },
  { key: "changeFrequency", label: "Change Frequency", type: "select", options: ["Monthly", "Every 3 Months", "Every 6 Months"] },
  { key: "hvacType", label: "HVAC Type", type: "select", options: ["Central Air", "Heat Pump", "Mini Split", "Window Unit", "Boiler"] },
  { key: "fuelType", label: "Fuel Type", type: "select", options: ["Electric", "Natural Gas", "Propane", "Oil"] },
  { key: "zones", label: "Number of Zones", type: "number" },
  { key: "thermostat", label: "Thermostat Brand/Model", type: "text", placeholder: "e.g. Nest Learning 3rd Gen" },
  { key: "refrigerantType", label: "Refrigerant Type", type: "text" },
  { key: "lastFilterChange", label: "Last Filter Change", type: "date" },
  { key: "filterBrand", label: "Filter Brand", type: "text" },
  { key: "unitLocation", label: "Unit Location", type: "text" },
];

const wellWaterFields: SpecField[] = [
  { key: "wellDepth", label: "Well Depth", type: "number", suffix: "ft" },
  { key: "pumpDepth", label: "Pump Depth", type: "number", suffix: "ft" },
  { key: "pumpType", label: "Pump Type", type: "select", options: ["Submersible", "Jet Pump", "Hand Pump"] },
  { key: "pumpHp", label: "Pump Horsepower", type: "text", placeholder: "e.g. 1/2 HP" },
  { key: "pumpBrand", label: "Pump Brand/Model", type: "text" },
  { key: "casingDiameter", label: "Casing Diameter", type: "number", suffix: "in" },
  { key: "waterTableDepth", label: "Water Table Depth", type: "number", suffix: "ft" },
  { key: "pressureTankBrand", label: "Pressure Tank Brand/Model", type: "text" },
  { key: "pressureTankSize", label: "Pressure Tank Size", type: "number", suffix: "gal" },
  { key: "pressureSetting", label: "Pressure Setting PSI", type: "text", placeholder: "e.g. 30/50 or 40/60" },
  { key: "lastWaterTest", label: "Last Water Test Date", type: "date" },
  { key: "waterTestResults", label: "Water Test Results", type: "select", options: ["Pass", "Fail", "Not Tested"] },
  { key: "wellDriller", label: "Well Driller Company", type: "text" },
  { key: "wellFlowRate", label: "Flow Rate", type: "number", suffix: "GPM" },
  { key: "wellDrillDate", label: "Date Drilled", type: "date" },
];

const waterFilterFields: SpecField[] = [
  { key: "filterBrand", label: "Filter System Brand", type: "text" },
  { key: "numStages", label: "Number of Stages", type: "number" },
  { key: "stage1", label: "Stage 1 Filter Size & Type", type: "text" },
  { key: "stage2", label: "Stage 2 Filter Size & Type", type: "text" },
  { key: "stage3", label: "Stage 3 Filter Size & Type", type: "text" },
  { key: "uvSystem", label: "UV System Installed", type: "toggle" },
  { key: "lastFilterChange", label: "Last Filter Change Date", type: "date" },
  { key: "filterChangeFreq", label: "Filter Change Frequency", type: "select", options: ["Every 3 Months", "Every 6 Months", "Every 12 Months"] },
];

const waterSoftenerFields: SpecField[] = [
  { key: "softenerBrand", label: "Brand/Model", type: "text" },
  { key: "saltType", label: "Salt Type", type: "select", options: ["Pellet", "Crystal", "Block"] },
  { key: "tankCapacity", label: "Tank Capacity", type: "number", suffix: "grains" },
  { key: "regenFrequency", label: "Regeneration Frequency", type: "text", placeholder: "e.g. Every 3 days" },
  { key: "lastSaltRefill", label: "Last Salt Refill", type: "date" },
];

const cityWaterFields: SpecField[] = [
  { key: "waterProvider", label: "Water Provider / Utility Company", type: "text" },
  { key: "accountNumber", label: "Account Number", type: "text" },
  { key: "meterLocation", label: "Water Meter Location", type: "text" },
  { key: "mainShutoff", label: "Main Shutoff Location", type: "text" },
  { key: "waterPressure", label: "Water Pressure PSI", type: "number" },
];

const waterHeaterFields: SpecField[] = [
  { key: "tankType", label: "Tank or Tankless", type: "select", options: ["Tank", "Tankless"] },
  { key: "tankSize", label: "Tank Size", type: "number", suffix: "gal" },
  { key: "fuelType", label: "Fuel Type", type: "select", options: ["Electric", "Natural Gas", "Propane", "Solar"] },
  { key: "firstHourRating", label: "First Hour Rating", type: "number" },
  { key: "whBrand", label: "Brand/Model", type: "text" },
  { key: "anodeRodReplaced", label: "Anode Rod Last Replaced", type: "date" },
  { key: "lastFlushed", label: "Last Flushed", type: "date" },
];

const propaneFields: SpecField[] = [
  { key: "tankSize", label: "Tank Size", type: "select", options: ["100 gal", "250 gal", "500 gal", "1000 gal"] },
  { key: "tankOwnership", label: "Tank Owned or Leased", type: "select", options: ["Owned", "Leased"] },
  { key: "supplier", label: "Propane Supplier Company", type: "text" },
  { key: "supplierPhone", label: "Supplier Phone", type: "text" },
  { key: "tankLocation", label: "Tank Location on Property", type: "text" },
  { key: "autoDelivery", label: "Automatic Delivery", type: "toggle" },
  { key: "lastFill", label: "Last Fill Date", type: "date" },
  { key: "monthlyUsage", label: "Approx. Usage Per Month", type: "number", suffix: "gal" },
  { key: "propaneSystems", label: "Systems Running on Propane", type: "checkboxes", options: ["Heating", "Water Heater", "Stove", "Generator", "Other"] },
];

const naturalGasFields: SpecField[] = [
  { key: "gasUtility", label: "Gas Utility Company", type: "text" },
  { key: "accountNumber", label: "Account Number", type: "text" },
  { key: "meterLocation", label: "Meter Location", type: "text" },
  { key: "gasShutoff", label: "Main Gas Shutoff Location", type: "text" },
  { key: "gasSystems", label: "Systems Running on Gas", type: "checkboxes", options: ["Heating", "Water Heater", "Stove", "Dryer", "Fireplace", "Generator", "Other"] },
];

const septicFields: SpecField[] = [
  { key: "tankSize", label: "Tank Size", type: "number", suffix: "gal" },
  { key: "tankMaterial", label: "Tank Material", type: "select", options: ["Concrete", "Fiberglass", "Plastic"] },
  { key: "bedrooms", label: "Number of Bedrooms Served", type: "number" },
  { key: "lastPumped", label: "Last Pumped Date", type: "date" },
  { key: "pumpFrequency", label: "Pump Frequency", type: "number", suffix: "years" },
  { key: "pumpingCompany", label: "Pumping Company", type: "text" },
  { key: "pumpingPhone", label: "Pumping Company Phone", type: "text" },
  { key: "drainFieldLocation", label: "Drain Field Location", type: "text" },
  { key: "tankDistance", label: "Tank Location from House", type: "text", placeholder: "e.g. 15ft north of back deck" },
  { key: "inspectionPort", label: "Inspection Port Location", type: "text" },
  { key: "lastInspection", label: "Last Inspection Date", type: "date" },
  // ── County Health Dept. Septic Permit fields ───────────────────────────
  { key: "permitNumber", label: "Permit Number", type: "text" },
  { key: "permitDate", label: "Permit Date", type: "date" },
  { key: "issuingAuthority", label: "Issuing Authority (County Health Dept.)", type: "text" },
  { key: "permitBy", label: "Permit Issued By", type: "text" },
  { key: "inspectedBy", label: "Inspected By", type: "text" },
  { key: "contractorName", label: "Contractor on Permit", type: "text" },
  { key: "code", label: "Permit Code / Classification", type: "text" },
  { key: "bedroomsDesignedFor", label: "Bedrooms Designed For", type: "number" },
  { key: "maxOccupants", label: "Max Occupants", type: "number" },
  { key: "appliancesCovered", label: "Appliances Covered", type: "text", placeholder: "e.g. washing machine, garbage disposal, dishwasher" },
  { key: "waterSupplyType", label: "Water Supply Type", type: "select", options: ["Municipal", "Community", "Non-Community", "Private"] },
  { key: "tankCapacityGallons", label: "Tank Capacity", type: "number", suffix: "gal" },
  { key: "tankType", label: "Tank Type", type: "select", options: ["Block", "Precast", "Fiberglass", "Plastic", "Steel"] },
  { key: "tankManufacturer", label: "Tank Manufacturer", type: "text" },
  { key: "tankPosition", label: "Tank Position", type: "text" },
  { key: "tankDistanceFromBuilding", label: "Tank Distance from Building", type: "number", suffix: "ft" },
  { key: "distributionBoxDistanceFromTank", label: "Distribution Box Distance from Tank", type: "number", suffix: "ft" },
  { key: "drainFieldSqFt", label: "Drain Field Area", type: "number", suffix: "sq ft" },
  { key: "drainFieldLines", label: "Drain Field Lines", type: "number" },
  { key: "drainFieldTrenches", label: "Drain Field Trenches", type: "number" },
  { key: "trenchLengthFt", label: "Trench Length", type: "number", suffix: "ft" },
  { key: "trenchWidthFt", label: "Trench Width", type: "number", suffix: "ft" },
  { key: "drainTileType", label: "Drain Tile Type", type: "select", options: ["concrete", "plastic", "terra cotta"] },
  { key: "drainTileSizeInch", label: "Drain Tile Size", type: "number", suffix: "in" },
  { key: "crushedStoneDepthInch", label: "Crushed Stone Depth", type: "number", suffix: "in" },
  { key: "stoneUnderTileInch", label: "Stone Under Tile", type: "number", suffix: "in" },
  { key: "drainFieldDistanceFromBuilding", label: "Drain Field Distance from Building", type: "number", suffix: "ft" },
  { key: "seepagePit", label: "Seepage Pit", type: "text", placeholder: "yes/no + dimensions" },
  { key: "sandFilter", label: "Sand Filter", type: "text", placeholder: "yes/no + dimensions" },
  { key: "wellDistanceFromTank", label: "Well Distance from Tank", type: "number", suffix: "ft" },
  { key: "wellDistanceFromDisposalField", label: "Well Distance from Disposal Field", type: "number", suffix: "ft" },
  { key: "houseSewerSetback", label: "House Sewer Setback", type: "number", suffix: "ft" },
  { key: "soilAppearance", label: "Soil Appearance", type: "select", options: ["Suitable", "Provisionally Suitable", "Unsuitable"] },
  { key: "remarks", label: "Remarks / Handwritten Notes", type: "text" },
  { key: "structureType", label: "Structure Type on Permit", type: "select", options: ["House", "Trailer", "Commercial", "ADU", "Other"] },
  { key: "ownerNameOnPermit", label: "Owner Name on Permit", type: "text" },
  { key: "locationDescription", label: "Location Description on Permit", type: "text" },
];

const citySewerFields: SpecField[] = [
  { key: "sewerUtility", label: "Sewer Utility Company", type: "text" },
  { key: "lastSewerInspection", label: "Last Sewer Line Inspection", type: "date" },
  { key: "cleanoutLocation", label: "Cleanout Location", type: "text" },
];

const electricalFields: SpecField[] = [
  { key: "panelBrand", label: "Panel Brand", type: "select", options: ["Square D", "Leviton", "Siemens", "GE", "Federal Pacific", "Zinsco", "Other"], warning: { "Federal Pacific": "⚠️ This brand has known safety recalls — recommend professional inspection immediately.", "Zinsco": "⚠️ This brand has known safety recalls — recommend professional inspection immediately." } },
  { key: "panelAmperage", label: "Panel Amperage", type: "select", options: ["100 amp", "150 amp", "200 amp", "400 amp"] },
  { key: "numCircuits", label: "Number of Circuits", type: "number" },
  { key: "panelLocation", label: "Panel Location", type: "text" },
  { key: "lastInspection", label: "Last Inspection Date", type: "date" },
  { key: "inspectorName", label: "Inspector Name", type: "text" },
  { key: "hasSubpanel", label: "Has Subpanel", type: "toggle" },
  { key: "subpanelDetails", label: "Subpanel Location & Amperage", type: "text" },
  { key: "generatorHookup", label: "Generator Hookup", type: "toggle" },
  { key: "generatorBrand", label: "Generator Brand/Model", type: "text" },
];

const roofFields: SpecField[] = [
  { key: "material", label: "Material", type: "select", options: ["Architectural Shingle", "3-Tab Shingle", "Metal", "Tile", "Flat", "Rubber"] },
  { key: "lastReplaced", label: "Last Replaced", type: "date" },
  { key: "warrantyYears", label: "Warranty Years Remaining", type: "number" },
  { key: "roofingCompany", label: "Roofing Company", type: "text" },
  { key: "hasGutters", label: "Has Gutters", type: "toggle" },
  { key: "gutterMaterial", label: "Gutter Material", type: "select", options: ["Aluminum", "Vinyl", "Copper"] },
  { key: "gutterGuards", label: "Gutter Guards Installed", type: "toggle" },
  { key: "lastGutterCleaning", label: "Last Gutter Cleaning", type: "date" },
  { key: "lastInspected", label: "Last Inspected", type: "date" },
  { key: "roofCondition", label: "Condition", type: "text" },
];

const garageDoorFields: SpecField[] = [
  { key: "doorBrand", label: "Brand/Model", type: "text" },
  { key: "numDoors", label: "Number of Doors", type: "number" },
  { key: "openerBrand", label: "Opener Brand/Model", type: "text" },
  { key: "openerHp", label: "Opener Horsepower", type: "text" },
  { key: "lastSpringReplacement", label: "Last Spring Replacement", type: "date" },
  { key: "keypadHint", label: "Keypad Code Hint", type: "text", placeholder: "Not the actual code" },
  { key: "numRemotes", label: "Number of Remotes", type: "number" },
];

const miniSplitFields: SpecField[] = [
  { key: "msBrand", label: "Brand/Model", type: "text" },
  { key: "numHeads", label: "Number of Heads/Zones", type: "number" },
  { key: "totalBtu", label: "Total BTU", type: "number" },
  { key: "fuelType", label: "Fuel Type", type: "select", options: ["Electric", "Heat Pump"] },
  { key: "lastFilterClean", label: "Last Filter Clean", type: "date" },
  { key: "refrigerantType", label: "Refrigerant Type", type: "text" },
];

const generatorFields: SpecField[] = [
  { key: "genType", label: "Type", type: "select", options: ["Portable", "Standby"] },
  { key: "fuelType", label: "Fuel Type", type: "select", options: ["Propane", "Natural Gas", "Gasoline", "Diesel"] },
  { key: "wattage", label: "Wattage", type: "number" },
  { key: "genBrand", label: "Brand/Model", type: "text" },
  { key: "autoStart", label: "Auto Start", type: "toggle" },
  { key: "lastService", label: "Last Service", type: "date" },
  { key: "transferSwitch", label: "Transfer Switch Location", type: "text" },
];

const applianceFields: SpecField[] = [
  { key: "appBrand", label: "Brand/Model", type: "text" },
  { key: "colorFinish", label: "Color/Finish", type: "text" },
  { key: "capacity", label: "Capacity", type: "text" },
  { key: "energyStar", label: "Energy Star Certified", type: "toggle" },
  { key: "purchaseStore", label: "Purchase Store", type: "text" },
];

const chimneyFields: SpecField[] = [
  { key: "chimneyType", label: "Chimney / Fireplace Type", type: "select", options: ["Wood-burning", "Gas", "Propane", "Oil", "Pellet stove", "Decorative / Non-functional"] },
  { key: "numFlues", label: "Number of Flues", type: "number" },
  { key: "linerType", label: "Liner Type", type: "select", options: ["Clay tile", "Stainless steel", "Cast-in-place", "None / Unknown"] },
  { key: "lastInspectionDate", label: "Last Professional Inspection Date", type: "date" },
  { key: "inspectionLevel", label: "Inspection Level (NFPA 211)", type: "select", options: ["Level I", "Level II", "Level III", "Unknown"] },
  { key: "lastSweepingDate", label: "Last Cleaning / Sweeping Date", type: "date" },
  { key: "fireboxCondition", label: "Firebox Condition", type: "select", options: ["Good", "Fair", "Needs Repair", "Unknown"] },
  { key: "capPresent", label: "Chimney Cap Present", type: "select", options: ["Yes", "No", "Unknown"] },
  { key: "crownCondition", label: "Crown Condition", type: "select", options: ["Good", "Cracked", "Missing", "Unknown"] },
  { key: "damperWorking", label: "Damper Working", type: "select", options: ["Yes", "No", "Unknown"] },
  { key: "estimatedAge", label: "Estimated Age (years, if known)", type: "number" },
  { key: "knownRepairs", label: "Known Repairs (description + date)", type: "text", placeholder: "e.g. Crown sealed, 2022" },
];

// Map system display names to their spec fields
export function getSpecFields(systemName: string): SpecField[] {
  const lower = systemName.toLowerCase();
  if (lower.includes("hvac")) return hvacFields;
  if (lower.includes("chimney") || lower.includes("fireplace")) return chimneyFields;
  if (lower.includes("well") || lower.includes("water source")) return wellWaterFields;
  if (lower.includes("water filter")) return waterFilterFields;
  if (lower.includes("water softener")) return waterSoftenerFields;
  if (lower.includes("city water")) return cityWaterFields;
  if (lower.includes("water heater")) return waterHeaterFields;
  if (lower.includes("propane")) return propaneFields;
  if (lower.includes("natural gas")) return naturalGasFields;
  if (lower.includes("septic")) return septicFields;
  if (lower.includes("sewer") && lower.includes("waste")) return septicFields;
  if (lower.includes("sewer")) return citySewerFields;
  if (lower.includes("electrical")) return electricalFields;
  if (lower.includes("roof")) return roofFields;
  if (lower.includes("garage")) return garageDoorFields;
  if (lower.includes("mini split")) return miniSplitFields;
  if (lower.includes("generator")) return generatorFields;
  // Appliances fallback
  if (lower.includes("refrigerator") || lower.includes("washer") || lower.includes("dryer") ||
      lower.includes("dishwasher") || lower.includes("stove") || lower.includes("oven") ||
      lower.includes("microwave")) return applianceFields;
  return applianceFields; // generic fallback
}
