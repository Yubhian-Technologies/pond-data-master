

import React, { useState, useEffect } from "react";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../../pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { Printer } from "lucide-react";
import { useUserSession } from "@/contexts/UserSessionContext";

interface FarmerInfo {
  farmerName: string;
  village: string;
  mobile: string;
  date: string;
  farmerId?: string;
}

interface MicrobiologyData {
  testCode: string[];
  yellowColonies: string[];
  greenColonies: string[];
  tpc: string[];
}

interface MicrobiologyReportProps {
  invoiceId: string;
  locationId: string;
  allSampleCount: number;
}

export default function MicrobiologyReport({
  invoiceId,
  locationId,
  allSampleCount,
}: MicrobiologyReportProps) {
  const { session } = useUserSession();

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [data, setData] = useState<MicrobiologyData | null>(null);
  const [technicianName, setTechnicianName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    email: string;
    contactNumber: string;
  }>({
    address: "",
    email: "",
    contactNumber: "",
  });

  const [realInvoiceDocId, setRealInvoiceDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealDocId = async () => {
      if (!invoiceId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");

        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(invoicesRef, where("id", "==", invoiceId));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setRealInvoiceDocId(docSnap.id);
          console.log("MicrobiologyReport - Found real docId:", docSnap.id);
        } else {
          console.error("MicrobiologyReport - Invoice document not found for:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice docId:", err);
      }
    };

    fetchRealDocId();
  }, [invoiceId, locationId]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!realInvoiceDocId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const reportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          realInvoiceDocId,
          "microbiologyReports",
          "data"
        );

        const snap = await getDoc(reportRef);

        let techName = "";

        if (snap.exists()) {
          const reportData = snap.data() || {};

          techName = reportData.technicianName || reportData.reportedBy || "";

          setFarmerInfo(reportData.farmerInfo || null);

          const microData = reportData.microbiologyData || {
            testCode: [],
            yellowColonies: [],
            greenColonies: [],
            tpc: [],
          };

          const filled = {
            testCode: Array.from({ length: allSampleCount }, (_, i) => microData.testCode?.[i] || `Sample ${i + 1}`),
            yellowColonies: Array.from({ length: allSampleCount }, (_, i) => microData.yellowColonies?.[i] || "-"),
            greenColonies: Array.from({ length: allSampleCount }, (_, i) => microData.greenColonies?.[i] || "-"),
            tpc: Array.from({ length: allSampleCount }, (_, i) => microData.tpc?.[i] || "-"),
          };

          setData(filled);
        } else {
          const empty = {
            testCode: Array.from({ length: allSampleCount }, (_, i) => `Sample ${i + 1}`),
            yellowColonies: Array.from({ length: allSampleCount }, () => "-"),
            greenColonies: Array.from({ length: allSampleCount }, () => "-"),
            tpc: Array.from({ length: allSampleCount }, () => "-"),
          };
          setData(empty);
          setFarmerInfo(null);
        }

        if (!techName && session?.technicianName) {
          techName = session.technicianName;
        }

        setTechnicianName(techName);
      } catch (e) {
        console.error("Error fetching microbiology report:", e);
        setData(null);
        if (session?.technicianName) {
          setTechnicianName(session.technicianName);
        } else {
          setTechnicianName("");
        }
      } finally {
        setLoading(false);
      }
    };

    if (realInvoiceDocId) {
      fetchReport();
    }
  }, [realInvoiceDocId, locationId, allSampleCount, session]);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!locationId) return;

      try {
        const locDoc = await getDoc(doc(db, "locations", locationId));
        if (locDoc.exists()) {
          const data = locDoc.data();
          setLocationDetails({
            address: data.address || "Not available",
            email: data.email || "Not available",
            contactNumber: data.contactNumber || "Not available",
          });
        }
      } catch (error) {
        console.error("Error fetching location details:", error);
      }
    };

    fetchLocationDetails();
  }, [locationId]);

  const handlePrint = () => window.print();

  if (loading) {
    return <p className="text-center py-8 text-lg">Loading Report...</p>;
  }

  if (!data) {
    return <p className="text-center py-8 text-red-600 text-xl">No microbiology report found.</p>;
  }

  return (
    <>
      {/* Print Button - Hidden in print */}
      <div className="mb-6 print:hidden text-right">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow"
        >
          <Printer size={20} /> Print Report
        </button>
      </div>

      {/* Main report container */}
      <div 
        className="bg-white print:flex print:flex-col print:min-h-[297mm]"
        id="report"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-6">
          <img src={ADC} alt="ADC Logo" className="w-32" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-700">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-sm text-black font-semibold">
              {locationDetails.address || "Loading lab address..."}
            </p>
            <p className="text-sm text-black">
              Contact No: {locationDetails.contactNumber || "Loading..."} | 
              Mail Id: {locationDetails.email || "Loading..."}
            </p>
            <p className="text-sm text-black">
              GSTIN: - 37AABCT0601L1ZJ
            </p>
          </div>
          <img src={AV} alt="AV Logo" className="w-32" />
        </div>

        <div className="flex justify-center mb-10">
          <table className="border-2 border-gray-800 text-sm w-full max-w-5xl">
            <tbody>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Farmer Name</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.farmerName || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Village</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.village || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Report ID</td>
                <td className="border px-4 py-2 w-1/8">{invoiceId || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">No. of Samples</td>
                <td className="border px-4 py-2 w-1/8">{allSampleCount}</td>
              </tr>

              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Mobile</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.mobile || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Farmer ID</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.farmerId || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Sample Type</td>
                <td className="border px-4 py-2 w-1/8" colSpan={1}>Microbiology</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Date</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.date || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center m-4">
          <h2 className="text-2xl font-bold text-red-600 mt-3">
            Microbiology Analysis Report
          </h2>
        </div>

        {/* Vibrio Table */}
        <div className="flex justify-center overflow-x-auto mb-12">
          <table className="border-2 border-gray-800 text-sm w-full max-w-2xl">
            <thead>
              <tr className="bg-blue-100">
                <th colSpan={4} className="border px-5 py-2.5 text-center font-bold text-lg">
                  VIBRIO CFU/ml
                </th>
              </tr>
              <tr className="bg-gray-200">
                <th className="border px-5 py-2.5 font-bold">Test Code</th>
                <th className="border px-5 py-2.5 font-bold bg-yellow-200">Yellow Colonies</th>
                <th className="border px-5 py-2.5 font-bold bg-green-300">Green Colonies</th>
                <th className="border px-5 py-2.5 font-bold">TPC</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: allSampleCount }, (_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-5 py-2 text-center font-medium">
                    {data.testCode[i] || `Sample ${i + 1}`}
                  </td>
                  <td className="border px-5 py-2 text-center">{data.yellowColonies[i] || "-"}</td>
                  <td className="border px-5 py-2 text-center">{data.greenColonies[i] || "-"}</td>
                  <td className="border px-5 py-2 text-center">{data.tpc[i] || "-"}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold">
                <td className="border px-5 py-2 text-center text-red-700">Optimum Values</td>
                <td className="border px-5 py-2 text-center text-red-700">&lt; 300</td>
                <td className="border px-5 py-2 text-center text-red-700">&lt; 50</td>
                <td className="border px-5 py-2 text-center text-red-700">&lt; 1000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main content wrapper - grows to push footer down in print */}
        <div className="flex-grow " />

        {/* Signature Section */}
        <div className="mt-16 mb-6 border-t-2 border-black pt-6 print:flex-grow">
          <div className="flex justify-between text-sm px-10">
            <div>
              <p className="font-semibold">Reported by:</p>
              <p className="mt-8 font-medium">{technicianName}</p>
            </div>
            <div>
              <p className="font-semibold">Checked by:</p>
              <p className="mt-8">______________________</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-center text-sm text-gray-700 mt-8 mb-6 print:flex-grow">
          <p><strong className="text-red-600">Note:</strong> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation.</p>
        </div>

        <div className="mt-12 font-bold text-center text-sm text-red-600 mb-4 print:flex-grow">
          TWL ADC Committed to Complete farming Solutions
        </div>
      </div>

      {/* FULL A4 PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.2cm;
          }

          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          #report, #report * {
            visibility: visible !important;
          }

          #report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 8mm 10mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
          }

          #report > div, table {
            width: 100% !important;
            max-width: none !important;
            margin: 0 0 10px 0 !important;
            padding: 0 !important;
          }

          table {
            width: 100% !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          /* The flex-grow div pushes everything below it to the bottom */
          .print\\:flex-grow {
            flex-grow: 1 !important;
          }
        }
      `}</style>
    </>
  );
}