export const availableTests = [
  // Soil tests
  { id: "soil_ph", name: "Soil PH", price: 50, sampleType: "soil" as const, category: "SOIL ANALYSIS" },
  { id: "soil_oc", name: "Soil Organic Carbon", price: 50, sampleType: "soil" as const, category: "SOIL ANALYSIS" },
  { id: "soil_ec", name: "Soil EC (Electrical conductivity)", price: 50, sampleType: "soil" as const, category: "SOIL ANALYSIS" },

  // Water tests
  { id: "basic_water", name: "Basic Water Analysis", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "potassium", name: "Analysis of Potassium", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "sodium", name: "Analysis of Sodium", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "iron", name: "Analysis of Iron", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "chlorine", name: "Analysis of Chlorine", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "tom", name: "Analysis of TOM (Total Organic Matter)", price: 30, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "nitrate", name: "Analysis of Nitrate (NO3)", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "h2s", name: "Analysis of H2S (Hydrogen Sulphide)", price: 100, sampleType: "water" as const, category: "WATER ANALYSIS" },
  { id: "vibrio", name: "Analysis Vibrio Plating (Green/Yellow)", price: 50, sampleType: "water" as const, category: "WATER ANALYSIS" },

  // Rt-q PCR ANALYSIS
  { id: "pl_general", name: "Post larvae General Analysis", price: 100, sampleType: "pl" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "pl_ehp", name: "Post larvae / Animal EHP", price: 1000, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "pl_wssv", name: "Post larvae / Animal WSSV", price: 1000, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "pl_vibrio_pcr", name: "Post larvae / Animal VIBRIO", price: 1000, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "pl_ihhnv", name: "Post larvae / Animal IHHNV", price: 1000, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "water_ehp", name: "Water EHP", price: 1200, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },
  { id: "soil_ehp", name: "Soil EHP", price: 1200, sampleType: "pcr" as const, category: "Rt-q PCR ANALYSIS" },

  //  MICROBIOLOGY TESTS
  {
    id: "micro_vibrio_plating",
    name: "Analysis of PL/Animal Tissue Vibrio Plating (Green/Yellow)",
    price: 100.00,
    sampleType: "microbiology" as const,
    category: "MICROBIOLOGY",
  },
  {
    id: "micro_tpc",
    name: "Total Plate Count (TPC)",
    price: 100.00,
    sampleType: "microbiology" as const,
    category: "MICROBIOLOGY",
  },
  
  {
    id:"wssv",
    name:"WSSV Rapid Test analysis",
    price:1200.00,
    sampleType:"wssv" as const,
    category:"WSSV"
  }
] as const; 