import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import InvoiceTemplate from "../data/template";

// Full interface matching what InvoiceTemplate expects (from the second file)
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

const InvoiceViewer: React.FC = () => {
  const { invoiceId, locationId } = useParams<{
    invoiceId: string;
    locationId: string;
  }>();

  const [invoiceData, setInvoiceData] = useState<InvoiceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId || !locationId) {
      setError("Missing invoice ID or location ID in URL");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setError(null);
        const invoicesRef = collection(db, "locations", locationId, "invoices");

        const q = query(invoicesRef, where("invoiceId", "==", invoiceId));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn("No invoice found with invoiceId:", invoiceId);
          setError("Invoice not found");
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data: DocumentData = docSnap.data();

        // Format date safely
        let formattedDate = "Unknown Date";
        if (data.formattedDate) {
          formattedDate = data.formattedDate;
        } else if (data.createdAt) {
          const date = data.createdAt.toDate();
          formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(
            date.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
        }

        const invoiceState: InvoiceState = {
          invoiceId: data.invoiceId || invoiceId,
          farmerName: data.farmerName || "Unknown Farmer",
          formattedDate,
          village: data.village || "Not specified",
          mobile: data.farmerPhone || data.mobile || "Not provided",
          tests: data.tests || {},
          subtotal: data.subtotal || 0,
          gstAmount: data.gstAmount || 0,
          total: data.total || 0,
          paymentMode: data.paymentMode || "cash",
          isPartialPayment: data.isPartialPayment || false,
          paidAmount: data.paidAmount ?? null,
          balanceAmount: data.balanceAmount ?? null,
        };

        setInvoiceData(invoiceState);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, locationId]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <p className="text-xl font-semibold text-red-700 mb-2">Error</p>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No Data
  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Invoice not found</p>
      </div>
    );
  }

  // Success: Render Template
  return <InvoiceTemplate state={invoiceData} />;
};

export default InvoiceViewer;