// InvoicePreview.tsx  ← CHANGE THIS FILE

import React from "react";
import { useLocation } from "react-router-dom";
import InvoiceTemplate from "@/data/template";   // adjust path if needed

interface InvoiceState {
  invoiceId: string;
  farmerName: string;
  formattedDate: string;
  village: string;
  mobile: string;
  tests: {
    [type: string]: {
      name: string;
      quantity: number;
      price: number;
      total: number;
    }[];
  };
  subtotal: number;
  gstAmount: number;
  total: number;
  paymentMode: "cash" | "qr" | "neft" | "rtgs";
  isPartialPayment?: boolean;
  paidAmount?: number | null;
  balanceAmount?: number;
  // ─── Add this line (or make sure it's included in the type)
  locationId?: string;   
}

const InvoicePreview: React.FC = () => {
  const location = useLocation();
  const navState = location.state as (InvoiceState & { locationId?: string }) | null;

  if (!navState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Cannot Preview Invoice
          </h2>
          <p className="text-gray-600">
            Invoice data is missing. Please generate the invoice again.
          </p>
        </div>
      </div>
    );
  }

  // Extract locationId from navigation state
  const { locationId, ...invoiceData } = navState;

  return (
    <InvoiceTemplate 
      state={invoiceData} 
      locationId={locationId || ""}   // ← this prevents undefined
    />
  );
};

export default InvoicePreview;