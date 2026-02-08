import React, { useState, useEffect, useRef } from "react";
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
import { Printer, Download } from "lucide-react";
import { useUserSession } from "@/contexts/UserSessionContext";
import html2canvas from 'html2canvas';

interface FarmerInfo {
  farmerName: string;
  address: string;
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
  const [checkedByName, setCheckedByName] = useState<string>("");
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

  const reportRef = useRef<HTMLDivElement>(null);


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

        const invoiceRef = doc(db, "locations", locationId, "invoices", realInvoiceDocId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (invoiceSnap.exists()) {
          const invoiceData = invoiceSnap.data();
          setCheckedByName(invoiceData.checkedBy || "______________________");
        } else {
          setCheckedByName("______________________");
        }

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


  const handlePrint = () => {
    window.print();
  };
  const handleDownloadJpeg = async () => {
  if (!reportRef.current) return;
  const element = reportRef.current;

  try {
    // 1. Add temporary padding to the element for the capture
    const originalPadding = element.style.padding;
    element.style.padding = "40px"; // Adjust this value for more/less border space

    const canvas = await html2canvas(element, {
      scale: 2, // High quality
      useCORS: true, 
      backgroundColor: "#ffffff",
      // Ensures the canvas captures the full height even if scrolled
      scrollY: -window.scrollY, 
      windowWidth: element.scrollWidth + 100, // Adds extra horizontal room
    });

    // 2. Revert the element's style back to original immediately after capture
    element.style.padding = originalPadding;

    const image = canvas.toDataURL("image/jpeg", 0.9);
    const link = document.createElement("a");
    link.href = image;
    link.download = `Micro-Report_${invoiceId}.jpg`;
    link.click();
  } catch (err) {
    console.error("JPEG Capture Error:", err);
  }
};
 

  if (loading) {
    return <p className="text-center py-8 text-lg">Loading Report...</p>;
  }

  if (!data) {
    return <p className="text-center py-8 text-red-600 text-xl">No microbiology report found.</p>;
  }

  return (
    <>
      {/* Action Buttons - Hidden when printing / jpeg capture */}
      <div className="mb-6 print:hidden flex justify-end gap-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow"
        >
          <Printer size={20} /> Print Report
        </button>
        <button
          onClick={handleDownloadJpeg}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow"
        >
          <Printer size={20} /> Download JPEG
        </button>

        
      </div>

      
      <div 
        ref={reportRef}
        className="bg-white print:flex print:flex-col print:min-h-[297mm]"
        id="report"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-6 print:mb-6">
          <img src={ADC} alt="ADC Logo" className="w-28 print:w-24" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-700 print:text-xl">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-sm text-black font-semibold print:text-xs">
              {locationDetails.address || "Loading lab address..."}
            </p>
            <p className="text-sm text-black print:text-xs">
              Contact No: {locationDetails.contactNumber || "Loading..."} | 
              Mail Id: {locationDetails.email || "Loading..."}
            </p>
            <p className="text-sm text-black print:text-xs">
              GSTIN: - 37AABCT0601L1ZJ
            </p>
          </div>
          <img src={AV} alt="AV Logo" className="w-28 print:w-24" />
        </div>

        {/* Farmer Info Table */}
        <div className="flex justify-center mb-10 print:mb-8">
          <table className="border-2 border-gray-800 text-sm w-full max-w-5xl print:text-xs">
            <tbody>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Farmer Name</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.farmerName || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Mobile</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.mobile || "-"}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Address</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.address || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Report ID</td>
                <td className="border px-4 py-2 w-1/8">{invoiceId || "-"}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">No. of Samples</td>
                <td className="border px-4 py-2 w-1/8">{allSampleCount}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Farmer ID</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.farmerId || "-"}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Sample Type</td>
                <td className="border px-4 py-2 w-1/8">Microbiology</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2 w-1/8">Date</td>
                <td className="border px-4 py-2 w-1/8">{farmerInfo?.date || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Title */}
        <div className="text-center mb-6 print:mb-4">
          <h2 className="text-2xl font-bold text-red-600 print:text-xl">
            Microbiology Analysis Report
          </h2>
        </div>

        {/* Results Table */}
        <div className="flex justify-center overflow-x-auto mb-12 print:mb-8">
          <table className="border-2 border-gray-800 text-sm w-full max-w-lg print:text-xs">
            <thead>
              <tr className="bg-blue-100">
                <th 
                  colSpan={4} 
                  className="border px-4 py-2 text-center font-bold text-base print:text-sm"
                >
                  VIBRIO CFU/ml
                </th>
              </tr>
              <tr className="bg-gray-200">
                <th className="border px-4 py-1.5 font-semibold text-sm print:py-1">Test Code</th>
                <th className="border px-4 py-1.5 font-semibold text-sm bg-yellow-200 print:py-1">Yellow Colonies</th>
                <th className="border px-4 py-1.5 font-semibold text-sm bg-green-300 print:py-1">Green Colonies</th>
                <th className="border px-4 py-1.5 font-semibold text-sm print:py-1">TPC</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: allSampleCount }, (_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-4 py-1.5 text-center text-sm font-medium print:py-1">
                    {data.testCode?.[i] || `Sample ${i + 1}`}
                  </td>
                  <td className="border px-4 py-1.5 text-center text-sm print:py-1">
                    {data.yellowColonies?.[i] || "-"}
                  </td>
                  <td className="border px-4 py-1.5 text-center text-sm print:py-1">
                    {data.greenColonies?.[i] || "-"}
                  </td>
                  <td className="border px-4 py-1.5 text-center text-sm print:py-1">
                    {data.tpc?.[i] || "-"}
                  </td>
                </tr>
              ))}
              <tr className="bg-red-50 font-semibold">
                <td className="border px-4 py-1.5 text-center text-red-700 text-sm print:py-1">Optimum Values</td>
                <td className="border px-4 py-1.5 text-center text-red-700 text-sm print:py-1">&lt; 300</td>
                <td className="border px-4 py-1.5 text-center text-red-700 text-sm print:py-1">&lt; 50</td>
                <td className="border px-4 py-1.5 text-center text-red-700 text-sm print:py-1">&lt; 1000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Push footer down */}
        <div className="flex-grow print:flex-grow" />

        {/* Signature Section */}
        <div className="mt-16 mb-6 border-t-2 border-black pt-6 print:mt-12 print:mb-4">
          <div className="flex justify-between text-sm px-10 print:text-xs print:px-6">
            <div>
              <p className="font-semibold">Reported by:</p>
              <p className="mt-10 font-medium print:mt-8">{technicianName}</p>
            </div>
            <div>
              <p className="font-semibold">Checked by:</p>
              <p className="mt-10 font-semibold print:mt-8">{checkedByName}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-center text-sm text-gray-700 mt-8 mb-6 print:text-xs print:mt-4 print:mb-4">
          <p><strong className="text-red-600">Note:</strong> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation.</p>
        </div>

        <div className="mt-10 font-bold text-center text-sm text-red-600 mb-6 print:mt-6 print:mb-4 print:text-xs">
          TWL ADC Committed to Complete farming Solutions
        </div>
      </div>

      
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.4cm;
          }

          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
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
            padding: 10mm 12mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
          }

          h1 { font-size: 1.4rem !important; }
          h2 { font-size: 1.35rem !important; }
          p, td, th, div { font-size: 0.78rem !important; line-height: 1.35 !important; }

          table {
            width: 100% !important;
            margin-bottom: 12mm !important;
          }

          .mb-8  { margin-bottom: 6mm !important; }
          .mb-10 { margin-bottom: 8mm !important; }
          .mb-12 { margin-bottom: 10mm !important; }
          .mt-16 { margin-top: 10mm !important; }
          .mt-8  { margin-top: 6mm !important; }

          .print\\:hidden { display: none !important; }
          .print\\:flex-grow { flex-grow: 1 !important; }
        }
      `}</style>
    </>
  );
}