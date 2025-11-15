import { Test } from "@/types";

export const availableTests: Test[] = [
  // Water Tests
  {
    id: "W001",
    name: "pH Level",
    sampleType: "water",
    price: 150,
    category: "Physical Parameters"
  },
  {
    id: "W002",
    name: "Dissolved Oxygen",
    sampleType: "water",
    price: 200,
    category: "Physical Parameters"
  },
  {
    id: "W003",
    name: "Temperature",
    sampleType: "water",
    price: 100,
    category: "Physical Parameters"
  },
  {
    id: "W004",
    name: "Salinity",
    sampleType: "water",
    price: 180,
    category: "Physical Parameters"
  },
  {
    id: "W005",
    name: "Ammonia (NH3)",
    sampleType: "water",
    price: 250,
    category: "Chemical Parameters"
  },
  {
    id: "W006",
    name: "Nitrite (NO2)",
    sampleType: "water",
    price: 250,
    category: "Chemical Parameters"
  },
  {
    id: "W007",
    name: "Nitrate (NO3)",
    sampleType: "water",
    price: 250,
    category: "Chemical Parameters"
  },
  {
    id: "W008",
    name: "Total Alkalinity",
    sampleType: "water",
    price: 200,
    category: "Chemical Parameters"
  },
  {
    id: "W009",
    name: "Total Hardness",
    sampleType: "water",
    price: 200,
    category: "Chemical Parameters"
  },
  {
    id: "W010",
    name: "Total Bacterial Count",
    sampleType: "water",
    price: 400,
    category: "Microbiology"
  },
  
  // Soil Tests
  {
    id: "S001",
    name: "pH Level",
    sampleType: "soil",
    price: 150,
    category: "Physical Parameters"
  },
  {
    id: "S002",
    name: "Organic Carbon",
    sampleType: "soil",
    price: 300,
    category: "Chemical Parameters"
  },
  {
    id: "S003",
    name: "Nitrogen (N)",
    sampleType: "soil",
    price: 250,
    category: "Nutrients"
  },
  {
    id: "S004",
    name: "Phosphorus (P)",
    sampleType: "soil",
    price: 250,
    category: "Nutrients"
  },
  {
    id: "S005",
    name: "Potassium (K)",
    sampleType: "soil",
    price: 250,
    category: "Nutrients"
  },
  {
    id: "S006",
    name: "Electrical Conductivity",
    sampleType: "soil",
    price: 200,
    category: "Physical Parameters"
  },
  {
    id: "S007",
    name: "Organic Matter",
    sampleType: "soil",
    price: 280,
    category: "Chemical Parameters"
  },
  
  // Post Larva (PL) Tests
  {
    id: "PL001",
    name: "PCR - WSSV",
    sampleType: "pl",
    price: 800,
    category: "RT-qPCR"
  },
  {
    id: "PL002",
    name: "PCR - IHHNV",
    sampleType: "pl",
    price: 800,
    category: "RT-qPCR"
  },
  {
    id: "PL003",
    name: "PCR - EHP",
    sampleType: "pl",
    price: 900,
    category: "RT-qPCR"
  },
  {
    id: "PL004",
    name: "Vibrio Count",
    sampleType: "pl",
    price: 500,
    category: "Microbiology"
  },
  {
    id: "PL005",
    name: "Total Bacterial Count",
    sampleType: "pl",
    price: 400,
    category: "Microbiology"
  },
  {
    id: "PL006",
    name: "Stress Test",
    sampleType: "pl",
    price: 300,
    category: "Quality Assessment"
  },
  
  // Adult Tests
  {
    id: "A001",
    name: "PCR - WSSV",
    sampleType: "adult",
    price: 800,
    category: "RT-qPCR"
  },
  {
    id: "A002",
    name: "PCR - IHHNV",
    sampleType: "adult",
    price: 800,
    category: "RT-qPCR"
  },
  {
    id: "A003",
    name: "PCR - EHP",
    sampleType: "adult",
    price: 900,
    category: "RT-qPCR"
  },
  {
    id: "A004",
    name: "Hepatopancreas Analysis",
    sampleType: "adult",
    price: 600,
    category: "Histopathology"
  },
  {
    id: "A005",
    name: "Gill Analysis",
    sampleType: "adult",
    price: 600,
    category: "Histopathology"
  },
  {
    id: "A006",
    name: "Vibrio Count",
    sampleType: "adult",
    price: 500,
    category: "Microbiology"
  },
];
