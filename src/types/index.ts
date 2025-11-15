export interface Farmer {
  id: string;
  name: string;
  phone: string;
  address: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  waterSource: string;
  cultureAreas: number;
  species: string;
  createdAt: Date;
}

export type SampleType = "water" | "soil" | "pl" | "adult";

export interface Sample {
  id: string;
  farmerId: string;
  farmerName: string;
  sampleType: SampleType;
  dateOfCulture: string;
  quantity: number;
  createdAt: Date;
  technicianId: string;
  locationId: string;
}

export interface Test {
  id: string;
  name: string;
  sampleType: SampleType;
  price: number;
  category: string;
}

export interface InvoiceItem {
  testId: string;
  testName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  farmerId: string;
  farmerName: string;
  samples: Sample[];
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMode: "cash" | "qr" | "neft";
  transactionId?: string;
  referenceId?: string;
  createdAt: Date;
  technicianId: string;
  locationId: string;
}

export interface TestResult {
  testId: string;
  testName: string;
  value: string;
  unit?: string;
  normalRange?: string;
}

export interface Report {
  id: string;
  reportNumber: string;
  invoiceId: string;
  farmerId: string;
  farmerName: string;
  sampleType: SampleType;
  testResults: TestResult[];
  remarks?: string;
  generatedBy: string;
  generatedAt: Date;
  editHistory: {
    editedBy: string;
    editedAt: Date;
    changes: string;
  }[];
  locationId: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  addedBy: string;
  locationId: string;
  createdAt: Date;
}

export interface LabAsset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  cost: number;
  supplier?: string;
  locationId: string;
  addedBy: string;
  createdAt: Date;
}
