/**
 * Pro-role document schema registry.
 *
 * Each entry defines:
 *  - the AI extraction prompt (field list + types)
 *  - the review-form rendering (label, type, multiline)
 *
 * Universal rules (see mem://features/document-universal-rules):
 *  - Vault always saves the file before review.
 *  - Confidence indicator is rendered for every extracted field.
 *  - Conflicts always prompt — never silent overwrite.
 *  - Deletion never removes extracted data.
 */

export type ProRole = "contractor" | "realtor" | "inspector" | "investor";

export type ProFieldType = "text" | "number" | "date" | "currency" | "textarea" | "list";

export interface ProField {
  key: string;
  label: string;
  type: ProFieldType;
  /** Optional helper hint shown under the field. */
  hint?: string;
}

export interface ProDocSchema {
  /** Stable id used by the edge function and storage. */
  id: string;
  /** Human label shown in pickers and headers. */
  label: string;
  role: ProRole;
  /** Free-form description fed into the AI prompt to bias extraction. */
  description: string;
  /** Ordered list of fields the AI should extract and the user should review. */
  fields: ProField[];
  /** True for documents that should attach permanently to the property address record. */
  attachToAddressForever?: boolean;
  /** True if a contractor upload should offer to share with the homeowner's vault on confirm. */
  offerShareWithHomeowner?: boolean;
  /** True if extraction should fan out flagged items to the homeowner's system_details. */
  applyFlaggedItemsToSystems?: boolean;
  /** True if uploads of this type should notify connected homeowners. */
  notifyHomeowner?: boolean;
  /** Photo-only doc — skip AI text extraction, just collect tags. */
  photoOnly?: boolean;
}

const f = (key: string, label: string, type: ProFieldType = "text", hint?: string): ProField => ({ key, label, type, hint });

export const PRO_DOC_SCHEMAS: Record<string, ProDocSchema> = {
  // ── CONTRACTOR ────────────────────────────────────────────────────────────
  "contractor.estimate": {
    id: "contractor.estimate",
    label: "Estimate",
    role: "contractor",
    description: "Contractor estimate / quote. Look for line items, labor vs materials, totals, validity, license number.",
    offerShareWithHomeowner: true,
    fields: [
      f("contractor_name", "Contractor / Company"),
      f("license_number", "Contractor License #"),
      f("job_address", "Job Address"),
      f("line_items", "Line Items", "list", "Each line: description, qty, unit price"),
      f("labor_cost", "Labor Subtotal", "currency"),
      f("materials_cost", "Materials Subtotal", "currency"),
      f("total_cost", "Total", "currency"),
      f("validity_date", "Valid Until", "date"),
      f("notes", "Notes", "textarea"),
    ],
  },
  "contractor.invoice": {
    id: "contractor.invoice",
    label: "Invoice",
    role: "contractor",
    description: "Contractor invoice. Extract line items, totals, payment status, payment date, invoice number, license #.",
    offerShareWithHomeowner: true,
    fields: [
      f("invoice_number", "Invoice #"),
      f("contractor_name", "Contractor / Company"),
      f("license_number", "Contractor License #"),
      f("job_address", "Job Address"),
      f("line_items", "Line Items", "list"),
      f("labor_cost", "Labor Subtotal", "currency"),
      f("materials_cost", "Materials Subtotal", "currency"),
      f("total_cost", "Total", "currency"),
      f("payment_status", "Payment Status", "text", "paid | unpaid | partial"),
      f("payment_date", "Payment Date", "date"),
    ],
  },
  "contractor.receipt": {
    id: "contractor.receipt",
    label: "Receipt",
    role: "contractor",
    description: "Contractor purchase receipt for parts/materials.",
    offerShareWithHomeowner: true,
    fields: [
      f("vendor", "Vendor"),
      f("amount", "Amount", "currency"),
      f("date", "Date", "date"),
      f("item_description", "Items", "textarea"),
      f("job_reference", "Job Reference", "text", "Job ID, address, or homeowner name"),
    ],
  },
  "contractor.work_photo": {
    id: "contractor.work_photo",
    label: "Work Photo",
    role: "contractor",
    description: "Photo of work in progress or completed.",
    photoOnly: true,
    offerShareWithHomeowner: true,
    fields: [
      f("job_reference", "Job Reference"),
      f("system_type", "System Type", "text", "HVAC, plumbing, electrical…"),
      f("structure", "Structure", "text", "Main house, garage, ADU…"),
      f("phase", "Phase", "text", "Before / During / After"),
      f("notes", "Notes", "textarea"),
    ],
  },

  // ── REALTOR ───────────────────────────────────────────────────────────────
  "realtor.seller_disclosure": {
    id: "realtor.seller_disclosure",
    label: "Seller Disclosure",
    role: "realtor",
    description: "Seller's property disclosure statement. Extract every disclosed defect, known issue, system age, renovation history, HOA info, flood-zone status.",
    attachToAddressForever: true,
    fields: [
      f("seller_name", "Seller Name"),
      f("disclosure_date", "Disclosure Date", "date"),
      f("defects", "Disclosed Defects", "list"),
      f("known_issues", "Known Issues", "list"),
      f("system_ages", "System Ages", "list", "e.g. Roof: 12 yrs, HVAC: 2018"),
      f("renovation_history", "Renovations", "list"),
      f("hoa_info", "HOA Info", "textarea"),
      f("flood_zone", "Flood Zone Status"),
    ],
  },
  "realtor.inspection_report": {
    id: "realtor.inspection_report",
    label: "Inspection Report",
    role: "realtor",
    description: "Third-party inspection report being filed against the listing.",
    attachToAddressForever: true,
    fields: [
      f("inspector_name", "Inspector"),
      f("inspection_date", "Inspection Date", "date"),
      f("flagged_items", "Flagged Items (with severity)", "list"),
      f("summary", "Summary", "textarea"),
    ],
  },
  "realtor.appraisal": {
    id: "realtor.appraisal",
    label: "Appraisal",
    role: "realtor",
    description: "Real estate appraisal report.",
    attachToAddressForever: true,
    fields: [
      f("appraised_value", "Appraised Value", "currency"),
      f("appraisal_date", "Appraisal Date", "date"),
      f("appraiser_name", "Appraiser"),
      f("comparables", "Comparable Properties", "list"),
    ],
  },
  "realtor.listing_agreement": {
    id: "realtor.listing_agreement",
    label: "Listing Agreement",
    role: "realtor",
    description: "Listing agreement between seller and brokerage.",
    attachToAddressForever: true,
    fields: [
      f("agent_name", "Agent"),
      f("brokerage", "Brokerage"),
      f("list_price", "List Price", "currency"),
      f("commission_rate", "Commission Rate", "text", "e.g. 6% or 3% buyer / 3% seller"),
      f("expiration_date", "Expiration Date", "date"),
    ],
  },

  // ── INSPECTOR ─────────────────────────────────────────────────────────────
  "inspector.inspection_report": {
    id: "inspector.inspection_report",
    label: "Inspection Report",
    role: "inspector",
    description: "Inspector-authored inspection report. Extract every flagged item with severity (minor | moderate | major | safety_hazard), affected system, recommended action, and estimated repair cost.",
    attachToAddressForever: true,
    applyFlaggedItemsToSystems: true,
    notifyHomeowner: true,
    fields: [
      f("inspector_name", "Inspector"),
      f("license_number", "License #"),
      f("inspection_date", "Inspection Date", "date"),
      f("flagged_items", "Flagged Items", "list", "Each: description | severity | system | recommended action | est. cost"),
      f("summary", "Summary", "textarea"),
    ],
  },

  // ── INVESTOR ──────────────────────────────────────────────────────────────
  "investor.contractor_bid": {
    id: "investor.contractor_bid",
    label: "Contractor Bid",
    role: "investor",
    description: "Contractor bid for a renovation scope.",
    fields: [
      f("contractor_name", "Contractor"),
      f("scope_of_work", "Scope of Work", "textarea"),
      f("line_items", "Line Item Costs", "list"),
      f("total_cost", "Total", "currency"),
      f("timeline", "Timeline"),
    ],
  },
  "investor.renovation_receipt": {
    id: "investor.renovation_receipt",
    label: "Renovation Receipt",
    role: "investor",
    description: "Receipt for renovation materials/labor.",
    fields: [
      f("vendor", "Vendor"),
      f("amount", "Amount", "currency"),
      f("date", "Date", "date"),
      f("item_description", "Items", "textarea"),
      f("job_reference", "Project / Property"),
    ],
  },
  "investor.before_after_photo": {
    id: "investor.before_after_photo",
    label: "Before / After Photo",
    role: "investor",
    description: "Renovation photo.",
    photoOnly: true,
    fields: [
      f("room", "Room"),
      f("system_type", "System Type"),
      f("structure", "Structure"),
      f("phase", "Phase", "text", "Before / During / After"),
      f("notes", "Notes", "textarea"),
    ],
  },
  "investor.arv_appraisal": {
    id: "investor.arv_appraisal",
    label: "ARV Appraisal",
    role: "investor",
    description: "After-Repair Value (ARV) appraisal.",
    fields: [
      f("arv_value", "ARV", "currency"),
      f("appraisal_date", "Date", "date"),
      f("appraiser_name", "Appraiser"),
      f("notes", "Notes", "textarea"),
    ],
  },
};

export const proDocsForRole = (role: ProRole): ProDocSchema[] =>
  Object.values(PRO_DOC_SCHEMAS).filter((s) => s.role === role);

export const getProDocSchema = (id: string): ProDocSchema | undefined => PRO_DOC_SCHEMAS[id];

/** Map an extraction confidence (0-100) to the same tier vocabulary used by UnifiedDocumentReview. */
export type ProConfidenceTier = "clear" | "partial" | "trouble" | "none";
export function confidenceTier(score: number | null | undefined): ProConfidenceTier {
  if (score == null) return "none";
  if (score >= 80) return "clear";
  if (score >= 60) return "partial";
  return "trouble";
}