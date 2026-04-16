// Automatic simulated AI auto-fill has been removed.
// ComingHomeIQ should only surface data that comes from:
// 1) the user,
// 2) verified external APIs,
// 3) AI extraction from uploaded documents or photos.

export interface AiAutoFillData {
  brand?: string;
  model?: string;
  serial?: string;
  installDate?: string;
  purchaseDate?: string;
  warrantyExp?: string;
  warrantyProvider?: string;
  lastService?: string;
  nextService?: string;
  serviceCompany?: string;
  servicePhone?: string;
  location?: string;
  specs?: Record<string, string>;
}

export function getAiData(_systemName: string): AiAutoFillData | null {
  return null;
}
