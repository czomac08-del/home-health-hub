// Drought-related programs and legal rights for the Home Defense Hub.
// All program details are static and verified from official .gov / utility sources.
// NEVER inject AI-generated content into this file.

export type ResourceBadge = "Federal Program" | "State Program" | "Utility Program" | "Legal Right";
export type Qualifies = "Homeowner" | "Renter" | "Landowner" | "Rural Property" | "Farm/Ranch" | "All";
export type Cost = "$0" | "Low-cost" | "Rebate / Tax Credit" | "Loan" | "Grant";

export interface Resource {
  id: string;
  title: string;
  what: string;
  qualifies: Qualifies[];
  cost: Cost;
  url: string;
  badge: ResourceBadge;
}

/**
 * Federal programs — apply nationally to all 50 states.
 * Sources verified at fsa.usda.gov, nrcs.usda.gov, energy.gov, hhs.gov.
 */
export const FEDERAL_DROUGHT_RESOURCES: Resource[] = [
  {
    id: "fsa-emergency-loan",
    title: "USDA FSA Emergency Loan",
    what: "Low-interest loans up to $500,000 for farms and rural property in counties with a federal disaster or drought designation.",
    qualifies: ["Farm/Ranch", "Rural Property"],
    cost: "Loan",
    url: "https://www.fsa.usda.gov/resources/programs/emergency-farm-loans",
    badge: "Federal Program",
  },
  {
    id: "nrcs-ecp",
    title: "USDA NRCS Emergency Conservation Program (ECP)",
    what: "Cost-share funding to restore farmland and install emergency water conservation measures (livestock water, pipelines) after drought.",
    qualifies: ["Farm/Ranch", "Landowner"],
    cost: "Rebate / Tax Credit",
    url: "https://www.fsa.usda.gov/resources/programs/emergency-conservation",
    badge: "Federal Program",
  },
  {
    id: "nrcs-eqip",
    title: "USDA NRCS EQIP — Drought Practices",
    what: "Financial assistance to install water-efficient irrigation, livestock wells, and drought-resilient soil practices.",
    qualifies: ["Farm/Ranch", "Landowner", "Rural Property"],
    cost: "Grant",
    url: "https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives",
    badge: "Federal Program",
  },
  {
    id: "liheap",
    title: "LIHEAP Cooling Assistance",
    what: "Federal income-based help paying cooling and water bills during drought-driven heat events.",
    qualifies: ["Homeowner", "Renter"],
    cost: "$0",
    url: "https://www.acf.hhs.gov/ocs/programs/liheap",
    badge: "Federal Program",
  },
  {
    id: "wha-watersense-rebate",
    title: "EPA WaterSense Rebate Finder",
    what: "Search rebates for low-flow toilets, smart irrigation controllers, and efficient fixtures available in your area.",
    qualifies: ["All"],
    cost: "Rebate / Tax Credit",
    url: "https://www.epa.gov/watersense/watersense-rebate-finder",
    badge: "Federal Program",
  },
];

/**
 * Per-state legal rights and state-administered programs.
 * Coverage: all 50 states + DC. Honest "consult state agency" entry where rules vary by locality.
 */
export interface StateDroughtData {
  rainwaterHarvesting: {
    legal: "Yes" | "Restricted" | "Permitted" | "Limited";
    notes: string;
    sourceUrl: string;
  };
  grayWaterReuse: {
    legal: "Yes" | "Restricted" | "Permitted" | "No";
    notes: string;
    sourceUrl: string;
  };
  shutoffProtection: {
    protected: boolean;
    notes: string;
    sourceUrl: string;
  };
  stateProgram?: Resource;
  extensionUrl: string;
}

// Coop. Extension finder works for any state — county lookup is on the page.
const EXTENSION_FINDER = "https://www.nifa.usda.gov/about-nifa/how-we-work/extension/cooperative-extension-system";

export const STATE_DROUGHT_DATA: Record<string, StateDroughtData> = {
  AL: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions on residential rainwater collection.", sourceUrl: "https://www.adem.alabama.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under state plumbing code with permit for systems > 250 gpd.", sourceUrl: "https://www.adph.org/" }, shutoffProtection: { protected: false, notes: "No statewide drought-emergency shutoff ban; check with your utility (PSC).", sourceUrl: "https://www.psc.alabama.gov/" }, extensionUrl: "https://www.aces.edu/" },
  AK: { rainwaterHarvesting: { legal: "Yes", notes: "Legal and encouraged.", sourceUrl: "https://dec.alaska.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed in many areas; subsurface only in most boroughs.", sourceUrl: "https://dec.alaska.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather rules apply; no specific drought provision.", sourceUrl: "https://rca.alaska.gov/" }, extensionUrl: "https://www.uaf.edu/ces/" },
  AZ: { rainwaterHarvesting: { legal: "Yes", notes: "Legal statewide; tax credits in Tucson and other cities.", sourceUrl: "https://new.azwater.gov/" }, grayWaterReuse: { legal: "Yes", notes: "Up to 400 gpd allowed without permit under Type 1 General Permit.", sourceUrl: "https://www.azdeq.gov/programs/water-quality-programs/permits/reclaimed-water" }, shutoffProtection: { protected: true, notes: "ACC bans residential disconnections during extreme heat (Jun 1 – Oct 15).", sourceUrl: "https://www.azcc.gov/" }, stateProgram: { id: "az-water-conservation-rebates", title: "Arizona Water Conservation Rebates", what: "Many AZ utilities (SRP, Tucson Water, Phoenix Water) offer rebates for turf removal, smart irrigation, and gray water systems.", qualifies: ["Homeowner"], cost: "Rebate / Tax Credit", url: "https://new.azwater.gov/conservation", badge: "State Program" }, extensionUrl: "https://extension.arizona.edu/" },
  AR: { rainwaterHarvesting: { legal: "Permitted", notes: "Legal for non-potable use; potable use needs licensed designer.", sourceUrl: "https://www.healthy.arkansas.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under specific plumbing code provisions.", sourceUrl: "https://www.healthy.arkansas.gov/" }, shutoffProtection: { protected: false, notes: "No statewide drought shutoff ban.", sourceUrl: "https://www.apscservices.info/" }, extensionUrl: "https://www.uaex.uada.edu/" },
  CA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal under SB 1750 (2012); no permit for residential rooftop harvesting.", sourceUrl: "https://water.ca.gov/" }, grayWaterReuse: { legal: "Yes", notes: "Single-fixture (laundry-to-landscape) allowed without permit; larger systems need permit.", sourceUrl: "https://www.waterboards.ca.gov/" }, shutoffProtection: { protected: true, notes: "SB 998 protects residential customers from disconnection; many utilities suspend shutoffs during declared drought emergencies.", sourceUrl: "https://www.waterboards.ca.gov/water_issues/programs/conservation_portal/sb998.html" }, stateProgram: { id: "ca-turf-replacement", title: "CA Turf Replacement Program", what: "Statewide rebates ($2-5/sq ft) for replacing lawn with drought-tolerant landscaping via SoCal Water$mart, Save Our Water, and local utilities.", qualifies: ["Homeowner"], cost: "Rebate / Tax Credit", url: "https://saveourwater.com/", badge: "State Program" }, extensionUrl: "https://ucanr.edu/" },
  CO: { rainwaterHarvesting: { legal: "Restricted", notes: "Limited to 110 gallons per single-family residence (HB 16-1005). Larger systems require water rights.", sourceUrl: "https://dwr.colorado.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under Reg 86 in approved jurisdictions only.", sourceUrl: "https://cdphe.colorado.gov/" }, shutoffProtection: { protected: false, notes: "No statewide drought shutoff ban; check local utility.", sourceUrl: "https://puc.colorado.gov/" }, extensionUrl: "https://extension.colostate.edu/" },
  CT: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://portal.ct.gov/deep" }, grayWaterReuse: { legal: "Restricted", notes: "Subsurface use allowed under plumbing code.", sourceUrl: "https://portal.ct.gov/dph" }, shutoffProtection: { protected: true, notes: "PURA winter shutoff protection (Nov–Apr) for hardship customers.", sourceUrl: "https://portal.ct.gov/pura" }, extensionUrl: "https://cahnr.uconn.edu/extension/" },
  DE: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://dnrec.delaware.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Permitted with state DNREC approval.", sourceUrl: "https://dnrec.delaware.gov/" }, shutoffProtection: { protected: false, notes: "Winter moratorium for some utilities; no drought rule.", sourceUrl: "https://depsc.delaware.gov/" }, extensionUrl: "https://www.udel.edu/academics/colleges/canr/cooperative-extension/" },
  FL: { rainwaterHarvesting: { legal: "Yes", notes: "Legal statewide; encouraged by state water management districts.", sourceUrl: "https://floridadep.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under FL plumbing code with proper backflow prevention.", sourceUrl: "https://www.floridahealth.gov/" }, shutoffProtection: { protected: false, notes: "No statewide drought shutoff rule; some municipalities pause during emergencies.", sourceUrl: "https://www.floridapsc.com/" }, stateProgram: { id: "fl-wmd-rebates", title: "FL Water Management District Rebates", what: "SWFWMD, SJRWMD, and SFWMD offer rebates for irrigation upgrades, rain sensors, and Florida-Friendly landscaping.", qualifies: ["Homeowner"], cost: "Rebate / Tax Credit", url: "https://floridadep.gov/water-policy", badge: "State Program" }, extensionUrl: "https://sfyl.ifas.ufl.edu/" },
  GA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal for non-potable use under state plumbing code amendments.", sourceUrl: "https://epd.georgia.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under state plumbing code with permit.", sourceUrl: "https://dph.georgia.gov/" }, shutoffProtection: { protected: false, notes: "No statewide drought shutoff rule.", sourceUrl: "https://psc.ga.gov/" }, extensionUrl: "https://extension.uga.edu/" },
  HI: { rainwaterHarvesting: { legal: "Yes", notes: "Legal and widely used; state offers tax credit.", sourceUrl: "https://health.hawaii.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under HRS 342D with DOH approval.", sourceUrl: "https://health.hawaii.gov/" }, shutoffProtection: { protected: false, notes: "PUC reviews shutoff rules case by case.", sourceUrl: "https://puc.hawaii.gov/" }, extensionUrl: "https://www.ctahr.hawaii.edu/site/extension.aspx" },
  ID: { rainwaterHarvesting: { legal: "Restricted", notes: "Allowed only on rooftops; ID water-rights doctrine of prior appropriation applies.", sourceUrl: "https://idwr.idaho.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under state DEQ rules.", sourceUrl: "https://www.deq.idaho.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://puc.idaho.gov/" }, extensionUrl: "https://www.uidaho.edu/extension" },
  IL: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged for non-potable indoor and outdoor use.", sourceUrl: "https://epa.illinois.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under IL plumbing code with permit.", sourceUrl: "https://dph.illinois.gov/" }, shutoffProtection: { protected: true, notes: "ICC heat-related shutoff protection Jun 1 – Sep 30.", sourceUrl: "https://www.icc.illinois.gov/" }, extensionUrl: "https://extension.illinois.edu/" },
  IN: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://www.in.gov/idem/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://www.in.gov/health/" }, shutoffProtection: { protected: false, notes: "Heat-related disconnection moratorium varies by utility.", sourceUrl: "https://www.in.gov/iurc/" }, extensionUrl: "https://extension.purdue.edu/" },
  IA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged by Iowa Stormwater Partnership.", sourceUrl: "https://www.iowadnr.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Subsurface allowed under plumbing code.", sourceUrl: "https://hhs.iowa.gov/" }, shutoffProtection: { protected: true, notes: "IUB moratorium on heat-related disconnection Jun 1 – Sep 30 for qualifying customers.", sourceUrl: "https://iub.iowa.gov/" }, extensionUrl: "https://www.extension.iastate.edu/" },
  KS: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; KS Water Office encourages it.", sourceUrl: "https://kwo.ks.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code with permit.", sourceUrl: "https://www.kdhe.ks.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather rule only.", sourceUrl: "https://kcc.ks.gov/" }, extensionUrl: "https://www.ksre.k-state.edu/" },
  KY: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://eec.ky.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://chfs.ky.gov/agencies/dph/" }, shutoffProtection: { protected: false, notes: "Hardship rules only; no drought provision.", sourceUrl: "https://psc.ky.gov/" }, extensionUrl: "https://extension.ca.uky.edu/" },
  LA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged for outdoor use.", sourceUrl: "https://www.deq.louisiana.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://ldh.la.gov/" }, shutoffProtection: { protected: false, notes: "PSC reviews case by case.", sourceUrl: "https://www.lpsc.louisiana.gov/" }, extensionUrl: "https://www.lsuagcenter.com/" },
  ME: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://www.maine.gov/dep/" }, grayWaterReuse: { legal: "Restricted", notes: "Subsurface allowed under plumbing code.", sourceUrl: "https://www.maine.gov/dhhs/" }, shutoffProtection: { protected: true, notes: "Winter shutoff protection Nov 15 – Apr 15 for hardship customers.", sourceUrl: "https://www.maine.gov/mpuc/" }, extensionUrl: "https://extension.umaine.edu/" },
  MD: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; tax credit available in some counties.", sourceUrl: "https://mde.maryland.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under MD plumbing code with permit.", sourceUrl: "https://health.maryland.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only via PSC.", sourceUrl: "https://www.psc.state.md.us/" }, extensionUrl: "https://extension.umd.edu/" },
  MA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged via MassDEP.", sourceUrl: "https://www.mass.gov/orgs/massachusetts-department-of-environmental-protection" }, grayWaterReuse: { legal: "Restricted", notes: "Subsurface allowed under plumbing code 248 CMR 10.00.", sourceUrl: "https://www.mass.gov/" }, shutoffProtection: { protected: true, notes: "DPU shutoff protection Nov 15 – Mar 15 for hardship customers.", sourceUrl: "https://www.mass.gov/orgs/department-of-public-utilities" }, extensionUrl: "https://ag.umass.edu/extension" },
  MI: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://www.michigan.gov/egle/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://www.michigan.gov/mdhhs/" }, shutoffProtection: { protected: true, notes: "Winter Protection Program Nov 1 – Mar 31 via MPSC.", sourceUrl: "https://www.michigan.gov/mpsc" }, extensionUrl: "https://www.canr.msu.edu/outreach" },
  MN: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged via MN Stormwater Manual.", sourceUrl: "https://www.pca.state.mn.us/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under MN plumbing code with permit.", sourceUrl: "https://www.health.state.mn.us/" }, shutoffProtection: { protected: true, notes: "Cold-weather rule Oct 1 – Apr 30 via PUC.", sourceUrl: "https://mn.gov/puc/" }, extensionUrl: "https://extension.umn.edu/" },
  MS: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://www.mdeq.ms.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://msdh.ms.gov/" }, shutoffProtection: { protected: false, notes: "PSC reviews case by case.", sourceUrl: "https://www.psc.state.ms.us/" }, extensionUrl: "https://extension.msstate.edu/" },
  MO: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged by MO DNR.", sourceUrl: "https://dnr.mo.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://health.mo.gov/" }, shutoffProtection: { protected: true, notes: "Cold-weather rule Nov 1 – Mar 31; heat protection in some utilities.", sourceUrl: "https://psc.mo.gov/" }, extensionUrl: "https://extension.missouri.edu/" },
  MT: { rainwaterHarvesting: { legal: "Restricted", notes: "Limited under prior-appropriation water rights; small rooftop systems generally OK.", sourceUrl: "https://dnrc.mt.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under state plumbing code with permit.", sourceUrl: "https://dphhs.mt.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather rule only.", sourceUrl: "https://psc.mt.gov/" }, extensionUrl: "https://www.montana.edu/extension/" },
  NE: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions on residential collection.", sourceUrl: "https://dnr.nebraska.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://dhhs.ne.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://psc.nebraska.gov/" }, extensionUrl: "https://extension.unl.edu/" },
  NV: { rainwaterHarvesting: { legal: "Restricted", notes: "Limited per AB 138 (2017) — single-family domestic use only.", sourceUrl: "https://dwr.nv.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under NAC 444 with permit.", sourceUrl: "https://ndep.nv.gov/" }, shutoffProtection: { protected: true, notes: "PUCN bans heat-related disconnection Jun 1 – Sep 30 for qualifying customers.", sourceUrl: "https://puc.nv.gov/" }, stateProgram: { id: "nv-water-smart", title: "Southern NV Water Smart Landscapes Rebate", what: "Up to $3/sq ft to replace grass with desert landscaping in SNWA service area.", qualifies: ["Homeowner"], cost: "Rebate / Tax Credit", url: "https://www.snwa.com/rebates/wsl/index.html", badge: "State Program" }, extensionUrl: "https://extension.unr.edu/" },
  NH: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions.", sourceUrl: "https://www.des.nh.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://www.dhhs.nh.gov/" }, shutoffProtection: { protected: true, notes: "Winter shutoff protection Nov 15 – Mar 31 via PUC.", sourceUrl: "https://www.puc.nh.gov/" }, extensionUrl: "https://extension.unh.edu/" },
  NJ: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged for stormwater management.", sourceUrl: "https://dep.nj.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under NJ plumbing code with permit.", sourceUrl: "https://www.nj.gov/health/" }, shutoffProtection: { protected: true, notes: "BPU winter termination program Nov 15 – Mar 15.", sourceUrl: "https://www.nj.gov/bpu/" }, extensionUrl: "https://njaes.rutgers.edu/" },
  NM: { rainwaterHarvesting: { legal: "Yes", notes: "Legal and encouraged; Santa Fe and other cities require it for new construction.", sourceUrl: "https://www.ose.state.nm.us/" }, grayWaterReuse: { legal: "Yes", notes: "Up to 250 gpd allowed without permit under NM Environmental Improvement Act.", sourceUrl: "https://www.env.nm.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather rule via PRC.", sourceUrl: "https://www.prc.nm.gov/" }, extensionUrl: "https://aces.nmsu.edu/ces/" },
  NY: { rainwaterHarvesting: { legal: "Yes", notes: "No state restrictions; encouraged by DEC.", sourceUrl: "https://dec.ny.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under NY plumbing code with permit.", sourceUrl: "https://www.health.ny.gov/" }, shutoffProtection: { protected: true, notes: "PSC HEFPA winter protection Nov 1 – Apr 15; cannot disconnect during medical emergencies.", sourceUrl: "https://dps.ny.gov/" }, extensionUrl: "https://cals.cornell.edu/cornell-cooperative-extension" },
  NC: { rainwaterHarvesting: { legal: "Yes", notes: "Legal under NC plumbing code; encouraged via NCDEQ.", sourceUrl: "https://www.deq.nc.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under NC plumbing code Section 1301 with permit.", sourceUrl: "https://www.deq.nc.gov/" }, shutoffProtection: { protected: false, notes: "No statewide drought shutoff ban; many municipal utilities pause during declared emergencies.", sourceUrl: "https://www.ncuc.gov/" }, stateProgram: { id: "nc-deq-well-assist", title: "NC DEQ Well Assistance & Water Resources", what: "NCDEQ offers technical assistance for failing wells, water quality testing, and emergency drought support; county health departments coordinate.", qualifies: ["Homeowner", "Rural Property"], cost: "$0", url: "https://www.deq.nc.gov/about/divisions/water-resources", badge: "State Program" }, extensionUrl: "https://www.ces.ncsu.edu/" },
  ND: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://www.dwr.nd.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://www.hhs.nd.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://www.psc.nd.gov/" }, extensionUrl: "https://www.ag.ndsu.edu/extension" },
  OH: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged including for potable use with proper treatment.", sourceUrl: "https://epa.ohio.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under OH plumbing code 4101:3-13 with permit.", sourceUrl: "https://odh.ohio.gov/" }, shutoffProtection: { protected: false, notes: "Winter rule via PUCO; no drought provision.", sourceUrl: "https://puco.ohio.gov/" }, extensionUrl: "https://extension.osu.edu/" },
  OK: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; OK Water Resources Board encourages.", sourceUrl: "https://www.owrb.ok.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://oklahoma.gov/health.html" }, shutoffProtection: { protected: false, notes: "OCC reviews case by case.", sourceUrl: "https://oklahoma.gov/occ.html" }, extensionUrl: "https://extension.okstate.edu/" },
  OR: { rainwaterHarvesting: { legal: "Yes", notes: "Legal from rooftops without water rights; ground catchment requires water right.", sourceUrl: "https://www.oregon.gov/owrd/" }, grayWaterReuse: { legal: "Yes", notes: "Allowed under DEQ Gray Water Reuse Permit (Tier 1 = no fee).", sourceUrl: "https://www.oregon.gov/deq/" }, shutoffProtection: { protected: true, notes: "PUC bans heat/cold-related disconnection during declared emergencies.", sourceUrl: "https://www.oregon.gov/puc/" }, extensionUrl: "https://extension.oregonstate.edu/" },
  PA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://www.dep.pa.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under PA plumbing code with permit.", sourceUrl: "https://www.health.pa.gov/" }, shutoffProtection: { protected: true, notes: "PUC Chapter 56 winter shutoff protection Dec 1 – Mar 31.", sourceUrl: "https://www.puc.pa.gov/" }, extensionUrl: "https://extension.psu.edu/" },
  RI: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; tax credit available under RIGL 44-30-2.10.", sourceUrl: "https://dem.ri.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under RI plumbing code.", sourceUrl: "https://health.ri.gov/" }, shutoffProtection: { protected: true, notes: "PUC winter shutoff protection Nov 1 – Apr 15.", sourceUrl: "https://ripuc.ri.gov/" }, extensionUrl: "https://web.uri.edu/coopext/" },
  SC: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged via DHEC.", sourceUrl: "https://scdhec.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://scdhec.gov/" }, shutoffProtection: { protected: false, notes: "PSC reviews case by case.", sourceUrl: "https://psc.sc.gov/" }, extensionUrl: "https://www.clemson.edu/extension/" },
  SD: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://danr.sd.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://doh.sd.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://puc.sd.gov/" }, extensionUrl: "https://extension.sdstate.edu/" },
  TN: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged via TDEC.", sourceUrl: "https://www.tn.gov/environment.html" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://www.tn.gov/health.html" }, shutoffProtection: { protected: false, notes: "TPUC reviews case by case.", sourceUrl: "https://www.tn.gov/tpuc.html" }, extensionUrl: "https://extension.tennessee.edu/" },
  TX: { rainwaterHarvesting: { legal: "Yes", notes: "Legal under TX HSC §341.042; sales tax exemption on equipment per Tax Code §151.355.", sourceUrl: "https://www.tceq.texas.gov/" }, grayWaterReuse: { legal: "Yes", notes: "Up to 400 gpd allowed without permit under 30 TAC §210.", sourceUrl: "https://www.tceq.texas.gov/" }, shutoffProtection: { protected: true, notes: "PUC Substantive Rule §25.483 bans disconnection during extreme weather (heat/cold) for residential customers.", sourceUrl: "https://www.puc.texas.gov/" }, stateProgram: { id: "tx-twdb-conservation", title: "TX Water Development Board Conservation Loans", what: "Low-interest loans and grants for water conservation, well rehabilitation, and rainwater systems.", qualifies: ["Homeowner", "Landowner", "Rural Property"], cost: "Loan", url: "https://www.twdb.texas.gov/financial/programs/index.asp", badge: "State Program" }, extensionUrl: "https://agrilifeextension.tamu.edu/" },
  UT: { rainwaterHarvesting: { legal: "Restricted", notes: "Up to 2,500 gallons allowed with state registration (free).", sourceUrl: "https://water.utah.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under R317-401 with DEQ permit.", sourceUrl: "https://deq.utah.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://psc.utah.gov/" }, extensionUrl: "https://extension.usu.edu/" },
  VT: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://dec.vermont.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under VT plumbing code.", sourceUrl: "https://www.healthvermont.gov/" }, shutoffProtection: { protected: true, notes: "PUC winter shutoff protection Nov 1 – Mar 31.", sourceUrl: "https://puc.vermont.gov/" }, extensionUrl: "https://www.uvm.edu/extension" },
  VA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; tax credit available for cisterns under VA Code §58.1-339.3.", sourceUrl: "https://www.deq.virginia.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under 12VAC5-610 with VDH permit.", sourceUrl: "https://www.vdh.virginia.gov/" }, shutoffProtection: { protected: false, notes: "SCC reviews case by case.", sourceUrl: "https://www.scc.virginia.gov/" }, extensionUrl: "https://ext.vt.edu/" },
  WA: { rainwaterHarvesting: { legal: "Yes", notes: "Legal statewide per Department of Ecology Policy 1017.", sourceUrl: "https://ecology.wa.gov/" }, grayWaterReuse: { legal: "Yes", notes: "Up to 60 gpd (Tier 1) allowed without permit under WAC 246-274.", sourceUrl: "https://doh.wa.gov/" }, shutoffProtection: { protected: true, notes: "UTC winter low-income protection Nov 15 – Mar 15.", sourceUrl: "https://www.utc.wa.gov/" }, extensionUrl: "https://extension.wsu.edu/" },
  WV: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; no state restrictions.", sourceUrl: "https://dep.wv.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under state plumbing code.", sourceUrl: "https://dhhr.wv.gov/" }, shutoffProtection: { protected: false, notes: "PSC reviews case by case.", sourceUrl: "https://www.psc.state.wv.us/" }, extensionUrl: "https://extension.wvu.edu/" },
  WI: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; encouraged via WI DNR.", sourceUrl: "https://dnr.wisconsin.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under SPS 384 plumbing code.", sourceUrl: "https://www.dhs.wisconsin.gov/" }, shutoffProtection: { protected: true, notes: "PSC cold-weather rule Nov 1 – Apr 15; medical emergency protection.", sourceUrl: "https://psc.wi.gov/" }, extensionUrl: "https://extension.wisc.edu/" },
  WY: { rainwaterHarvesting: { legal: "Restricted", notes: "Limited under prior-appropriation; small rooftop systems generally OK.", sourceUrl: "https://seo.wyo.gov/" }, grayWaterReuse: { legal: "Permitted", notes: "Allowed under DEQ permit.", sourceUrl: "https://deq.wyoming.gov/" }, shutoffProtection: { protected: false, notes: "Cold-weather only.", sourceUrl: "https://psc.wyo.gov/" }, extensionUrl: "https://www.uwyo.edu/uwe/" },
  DC: { rainwaterHarvesting: { legal: "Yes", notes: "Legal; RiverSmart Homes program offers rebates for rain barrels.", sourceUrl: "https://doee.dc.gov/" }, grayWaterReuse: { legal: "Restricted", notes: "Allowed under DC plumbing code.", sourceUrl: "https://dchealth.dc.gov/" }, shutoffProtection: { protected: true, notes: "DCPSC bans residential disconnection during declared heat/cold emergencies.", sourceUrl: "https://dcpsc.org/" }, extensionUrl: "https://www.udc.edu/causes/center-for-urban-research/" },
};

export const STATE_DROUGHT_DEFAULT_EXTENSION = EXTENSION_FINDER;

export function getStateDroughtData(state: string | null | undefined): StateDroughtData | null {
  if (!state) return null;
  const code = state.toUpperCase();
  return STATE_DROUGHT_DATA[code] ?? null;
}

/** Returns true when USDM level indicates an actionable drought (D1+). */
export function isActionableDrought(level: string | null | undefined): boolean {
  return level === "D1" || level === "D2" || level === "D3" || level === "D4";
}
