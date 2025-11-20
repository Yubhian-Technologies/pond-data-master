import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import InvoiceTemplate from "../data/template";

interface TestItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceState {
  farmerName: string;
  formattedDate: string;
  village: string;
  mobile: string;
  tests: { [type: string]: TestItem[] };
  total: number;
  paymentMode: "cash" | "qr" | "neft";
}

const InvoiceView: React.FC = () => {
  const { invoiceId, locationId } = useParams<{ invoiceId: string; locationId: string }>();
  const [invoiceData, setInvoiceData] = useState<InvoiceState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId || !locationId) return;

    const fetchInvoice = async () => {
      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const q = query(invoicesRef, where("id", "==", invoiceId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();

          // Map Firestore data to InvoiceState
          const invoiceState: InvoiceState = {
            farmerName: data.farmerName ?? "",
            formattedDate: data.formattedDate ?? new Date().toLocaleDateString(),
            village: data.village ?? "",
            mobile: data.farmerPhone ?? "",
            tests: data.tests ?? {},
            total: data.total ?? 0,
            paymentMode: data.paymentMode ?? "cash",
          };

          setInvoiceData(invoiceState);
        } else {
          console.warn("Invoice not found for id:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, locationId]);

  if (loading) return <p>Loading...</p>;
  if (!invoiceData) return <p>Invoice not found</p>;

  return <InvoiceTemplate state={invoiceData} />;
};

export default InvoiceView;
