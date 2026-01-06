
import React from "react";
import { useLocation } from "react-router-dom";
import InvoiceTemplate from "@/data/template";


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
}

const InvoicePreview: React.FC = () => {
  const location = useLocation();
  const state = location.state as InvoiceState | null;

  // Fallback if accessed directly without state
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Cannot Preview Invoice
          </h2>
          <p className="text-gray-600">
            Invoice data is missing. Please generate the invoice again from the samples page.
          </p>
        </div>
      </div>
    );
  }

  return <InvoiceTemplate state={state} />;
};

export default InvoicePreview;