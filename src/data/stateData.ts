/**
 * State-specific digitization cutoff years by record type.
 * Used to determine when "predates digital records" warnings apply.
 * Sources: State archives research, county clerk digitization timelines.
 */
export interface StateDigitization {
  buildingPermits: number;
  wellRecords: number;
  septicPermits: number;
  propertyDeeds: number;
  taxAssessments: number;
  environmentalReports: number;
}

/**
 * All 50 states + DC. Values represent the approximate year after which
 * digital records are generally available in most counties of that state.
 * Rural counties may have later cutoffs.
 */
export const STATE_DIGITIZATION: Record<string, StateDigitization> = {
  AL: { buildingPermits: 2005, wellRecords: 2000, septicPermits: 2005, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2005 },
  AK: { buildingPermits: 2008, wellRecords: 2005, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2005 },
  AZ: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  AR: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2002, taxAssessments: 2000, environmentalReports: 2005 },
  CA: { buildingPermits: 1995, wellRecords: 1990, septicPermits: 1995, propertyDeeds: 1990, taxAssessments: 1990, environmentalReports: 1995 },
  CO: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  CT: { buildingPermits: 2000, wellRecords: 2000, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  DE: { buildingPermits: 2002, wellRecords: 2000, septicPermits: 2002, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2002 },
  DC: { buildingPermits: 1995, wellRecords: 1995, septicPermits: 1995, propertyDeeds: 1990, taxAssessments: 1990, environmentalReports: 1995 },
  FL: { buildingPermits: 1998, wellRecords: 1995, septicPermits: 1998, propertyDeeds: 1995, taxAssessments: 1993, environmentalReports: 1998 },
  GA: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  HI: { buildingPermits: 2000, wellRecords: 2000, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  ID: { buildingPermits: 2005, wellRecords: 2000, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  IL: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  IN: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  IA: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  KS: { buildingPermits: 2005, wellRecords: 2000, septicPermits: 2005, propertyDeeds: 2002, taxAssessments: 2000, environmentalReports: 2005 },
  KY: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  LA: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2003 },
  ME: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2002, taxAssessments: 2000, environmentalReports: 2005 },
  MD: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  MA: { buildingPermits: 1998, wellRecords: 1998, septicPermits: 1998, propertyDeeds: 1995, taxAssessments: 1993, environmentalReports: 1998 },
  MI: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  MN: { buildingPermits: 2003, wellRecords: 1998, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  MS: { buildingPermits: 2008, wellRecords: 2005, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
  MO: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  MT: { buildingPermits: 2008, wellRecords: 2003, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
  NE: { buildingPermits: 2005, wellRecords: 2000, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  NV: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  NH: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  NJ: { buildingPermits: 1998, wellRecords: 1998, septicPermits: 1998, propertyDeeds: 1995, taxAssessments: 1993, environmentalReports: 1998 },
  NM: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  NY: { buildingPermits: 1998, wellRecords: 1998, septicPermits: 1998, propertyDeeds: 1995, taxAssessments: 1993, environmentalReports: 1998 },
  NC: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  ND: { buildingPermits: 2008, wellRecords: 2003, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
  OH: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  OK: { buildingPermits: 2005, wellRecords: 2000, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  OR: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  PA: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  RI: { buildingPermits: 2000, wellRecords: 2000, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  SC: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  SD: { buildingPermits: 2008, wellRecords: 2005, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
  TN: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  TX: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  UT: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  VT: { buildingPermits: 2005, wellRecords: 2003, septicPermits: 2005, propertyDeeds: 2003, taxAssessments: 2000, environmentalReports: 2005 },
  VA: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  WA: { buildingPermits: 2000, wellRecords: 1998, septicPermits: 2000, propertyDeeds: 1998, taxAssessments: 1995, environmentalReports: 2000 },
  WV: { buildingPermits: 2008, wellRecords: 2005, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
  WI: { buildingPermits: 2003, wellRecords: 2000, septicPermits: 2003, propertyDeeds: 2000, taxAssessments: 1998, environmentalReports: 2003 },
  WY: { buildingPermits: 2008, wellRecords: 2005, septicPermits: 2008, propertyDeeds: 2005, taxAssessments: 2003, environmentalReports: 2008 },
};

/** Map record type category to digitization field name */
export const RECORD_TYPE_TO_DIGITIZATION_FIELD: Record<string, keyof StateDigitization> = {
  structure_construction: "buildingPermits",
  water_systems: "wellRecords",
  septic_sewer: "septicPermits",
  land_title: "propertyDeeds",
  property_history: "propertyDeeds",
  environmental_hazards: "environmentalReports",
  insurance_claims: "taxAssessments",
};

/** Full state names for display */
export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/**
 * Get the digitization cutoff year for a specific record category in a given state.
 * Returns null if state not found (graceful degradation).
 */
export function getDigitizationCutoff(stateAbbr: string, recordCategory: string): number | null {
  const stateData = STATE_DIGITIZATION[stateAbbr.toUpperCase()];
  if (!stateData) return null;
  const field = RECORD_TYPE_TO_DIGITIZATION_FIELD[recordCategory];
  if (!field) return null;
  return stateData[field];
}

/**
 * Parse a state abbreviation from a US address string.
 * Handles formats like "City, ST 12345" and "City, ST".
 */
export function parseStateFromAddress(address: string): string | null {
  const match = address.match(/,\s*([A-Z]{2})\s*\d{0,5}/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Parse ZIP code from address.
 */
export function parseZipFromAddress(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}
