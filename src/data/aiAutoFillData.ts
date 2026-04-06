// Simulated AI-found data per system type from "public record scan"

export interface AiAutoFillData {
  // Keys matching basic info fields
  brand?: string;
  model?: string;
  serial?: string;
  installDate?: string;
  purchaseDate?: string;
  // Service fields
  warrantyExp?: string;
  warrantyProvider?: string;
  lastService?: string;
  nextService?: string;
  serviceCompany?: string;
  servicePhone?: string;
  // Location
  location?: string;
  // Spec fields (keyed by spec field key)
  specs?: Record<string, string>;
}

export function getAiData(systemName: string): AiAutoFillData | null {
  const lower = systemName.toLowerCase();

  if (lower.includes("well") || lower.includes("water source")) {
    return {
      specs: {
        wellDepth: "180",
        pumpType: "Submersible",
        pumpHp: "1/2 HP",
        casingDiameter: "6",
        pressureSetting: "40/60",
      },
    };
  }

  if (lower.includes("hvac")) {
    return {
      brand: "Trane",
      installDate: "2019-06-15",
      specs: {
        filterSize: "16x25x1",
      },
    };
  }

  if (lower.includes("electrical")) {
    return {
      specs: {
        panelBrand: "Square D",
        panelAmperage: "200 amp",
        numCircuits: "30",
        panelLocation: "Basement utility room",
      },
    };
  }

  if (lower.includes("roof")) {
    return {
      specs: {
        material: "Architectural Shingle",
        lastReplaced: "2018-09-01",
        warrantyYears: "18",
        hasGutters: "true",
        gutterMaterial: "Aluminum",
      },
    };
  }

  if (lower.includes("plumbing")) {
    return {
      brand: "Moen",
      lastService: "2024-01-10",
      location: "Main stack in basement, shutoff near front entrance",
    };
  }

  if (lower.includes("water heater")) {
    return {
      brand: "Rheem",
      installDate: "2017-03-20",
      specs: {
        tankType: "Tank",
        tankSize: "50",
        fuelType: "Natural Gas",
        whBrand: "Rheem Performance Plus",
      },
    };
  }

  if (lower.includes("septic")) {
    return {
      specs: {
        tankSize: "1000",
        tankMaterial: "Concrete",
        bedrooms: "3",
        lastPumped: "2023-04-15",
        pumpFrequency: "3",
        tankDistance: "20ft south of back porch",
      },
    };
  }

  if (lower.includes("natural gas")) {
    return {
      specs: {
        gasUtility: "National Grid",
        meterLocation: "South side of house",
        gasShutoff: "Basement near meter entry",
        gasSystems: JSON.stringify(["Heating", "Water Heater", "Stove"]),
      },
    };
  }

  if (lower.includes("propane")) {
    return {
      specs: {
        tankSize: "500 gal",
        tankOwnership: "Leased",
        tankLocation: "Northwest corner of yard",
      },
    };
  }

  // Generic fallback — no AI data
  return null;
}
