import { Home, Building2, Building, Warehouse, TreePine, Factory, Truck, Store } from "lucide-react";

export interface PropertyType {
  id: string;
  label: string;
  icon: any;
  description: string;
  isManufactured?: boolean;
  isMultiUnit?: boolean;
}

export const propertyTypes: PropertyType[] = [
  { id: "single_family", label: "Single Family Home — Stick Built", icon: Home, description: "Traditional site-built home" },
  { id: "manufactured", label: "Manufactured Home (1976+)", icon: Warehouse, description: "HUD code — built after June 15, 1976" , isManufactured: true },
  { id: "mobile", label: "Mobile Home (pre-1976)", icon: Warehouse, description: "Built before HUD standards", isManufactured: true },
  { id: "trailer", label: "Trailer Home", icon: Truck, description: "Towable or permanently placed trailer", isManufactured: true },
  { id: "townhouse", label: "Townhouse or Condo", icon: Building2, description: "Attached or shared-wall unit" },
  { id: "multi_family", label: "Multi-Family Home (2-4 units)", icon: Building, description: "Duplex, triplex, or fourplex" },
  { id: "apartment", label: "Apartment Building (5+ units)", icon: Building, description: "5 or more residential units", isMultiUnit: true },
  { id: "farm", label: "Farm or Ranch", icon: TreePine, description: "Agricultural property with land" },
  { id: "commercial", label: "Commercial Property", icon: Factory, description: "Office, retail, or industrial" },
  { id: "mixed_use", label: "Mixed Use", icon: Store, description: "Combined residential and commercial" },
];

export const manufacturedHomeFields = [
  { key: "hudCertNumber", label: "HUD Certification Number", type: "text" as const, placeholder: "For homes built after June 15, 1976" },
  { key: "vinSerial", label: "VIN / Serial Number", type: "text" as const, placeholder: "Found on data plate or title" },
  { key: "makeManufacturer", label: "Make & Manufacturer", type: "text" as const },
  { key: "modelName", label: "Model Name", type: "text" as const },
  { key: "yearManufactured", label: "Year of Manufacture", type: "number" as const },
  { key: "lengthFt", label: "Length (ft)", type: "number" as const },
  { key: "widthFt", label: "Width (ft)", type: "number" as const },
  { key: "sections", label: "Number of Sections", type: "select" as const, options: ["Single Wide", "Double Wide", "Triple Wide"] },
  { key: "foundationType", label: "Foundation Type", type: "select" as const, options: ["Pier and Beam", "Permanent Foundation", "Tie Downs Only", "Basement", "Slab"] },
  { key: "skirtingType", label: "Skirting Type & Material", type: "text" as const },
  { key: "roofOver", label: "Roof Over Installed", type: "toggle" as const },
  { key: "tieDownAnchors", label: "Number of Tie Down Anchors", type: "number" as const },
  { key: "tieDownLastInspection", label: "Tie Down Last Inspection", type: "date" as const },
  { key: "vaporBarrier", label: "Vapor Barrier Under Home", type: "toggle" as const },
  { key: "vaporBarrierLastReplaced", label: "Vapor Barrier Last Replaced", type: "date" as const },
  { key: "heatTape", label: "Heat Tape on Pipes", type: "toggle" as const },
];

export const additionalWaterSourceTypes = [
  { id: "irrigation", label: "Irrigation / Sprinkler System" },
  { id: "farm_ag", label: "Farm / Agricultural Use" },
  { id: "pond", label: "Pond or Surface Water" },
  { id: "rainwater", label: "Rainwater Collection" },
];

export const utilityContactFields = [
  { key: "companyName", label: "Company Name", type: "text" as const },
  { key: "customerServicePhone", label: "Customer Service Phone", type: "text" as const },
  { key: "emergencyPhone", label: "Emergency After-Hours Phone", type: "text" as const },
  { key: "accountNumber", label: "Account Number", type: "text" as const },
  { key: "website", label: "Website", type: "text" as const },
  { key: "outageReport", label: "How to Report an Outage", type: "text" as const },
  { key: "avgMonthlyBill", label: "Average Monthly Bill", type: "text" as const, placeholder: "$" },
];
