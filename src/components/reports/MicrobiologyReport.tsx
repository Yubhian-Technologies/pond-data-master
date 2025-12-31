// src/components/reports/MicrobiologyReport.tsx

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { Printer } from "lucide-react";

interface FarmerInfo {
  farmerName: string;
  village: string;
  mobile: string;
  date: string;
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
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [data, setData] = useState<MicrobiologyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);

        const reportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          invoiceId,
          "microbiologyReports",
          "data"
        );

        const snap = await getDoc(reportRef);

        if (snap.exists()) {
          const reportData = snap.data();

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
      } catch (e) {
        console.error("Error fetching microbiology report:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [invoiceId, locationId, allSampleCount]);

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

      {/* Main report container - NO max-width, NO padding, NO mx-auto */}
      <div className="bg-white" id="report">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-6">
          <img src={ADC} alt="ADC Logo" className="w-32" />
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-700">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <h2 className="text-2xl font-bold text-red-600 mt-3">
              Microbiology Analysis Report
            </h2>
          </div>
          <img src={AV} alt="AV Logo" className="w-32" />
        </div>

        {/* Report ID */}
        <div className="text-right mb-6">
          <span className="font-bold text-lg">Report Id:- {invoiceId || "-"}</span>
        </div>

        {/* Farmer Info */}
        <div className="flex justify-center mb-10">
          <table className="border-2 border-gray-800 text-sm">
            <tbody>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Farmer Name</td>
                <td className="border px-4 py-2">{farmerInfo?.farmerName || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Village</td>
                <td className="border px-4 py-2">{farmerInfo?.village || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Date</td>
                <td className="border px-4 py-2">{farmerInfo?.date || "-"}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Mobile</td>
                <td className="border px-4 py-2">{farmerInfo?.mobile || "-"}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">No. of Samples</td>
                <td className="border px-4 py-2">{allSampleCount}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Type</td>
                <td className="border px-4 py-2">Microbiology</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vibrio Table */}
        <div className="flex justify-center overflow-x-auto mb-12">
          <table className="border-2 border-gray-800 text-sm min-w-full">
            <thead>
              <tr className="bg-blue-100">
                <th colSpan={4} className="border px-6 py-3 text-center font-bold text-lg">
                  VIBRIO CFU/ml
                </th>
              </tr>
              <tr className="bg-gray-200">
                <th className="border px-6 py-3 font-bold">Test Code</th>
                <th className="border px-6 py-3 font-bold bg-yellow-200">Yellow Colonies</th>
                <th className="border px-6 py-3 font-bold bg-green-300">Green Colonies</th>
                <th className="border px-6 py-3 font-bold">TPC</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: allSampleCount }, (_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-6 py-3 text-center font-medium">
                    {data.testCode[i] || `Sample ${i + 1}`}
                  </td>
                  <td className="border px-6 py-3 text-center">{data.yellowColonies[i] || "-"}</td>
                  <td className="border px-6 py-3 text-center">{data.greenColonies[i] || "-"}</td>
                  <td className="border px-6 py-3 text-center">{data.tpc[i] || "-"}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-bold">
                <td className="border px-6 py-3 text-center text-red-700">Optimum Values</td>
                <td className="border px-6 py-3 text-center text-red-700">&lt; 300</td>
                <td className="border px-6 py-3 text-center text-red-700">&lt; 50</td>
                <td className="border px-6 py-3 text-center text-red-700">&lt; 1000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600 print:hidden">
          Report generated on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* FULL A4 PRINT STYLES - ZERO WHITE SPACE */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
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
            padding: 0 !important; /* Zero padding - full bleed */
            box-sizing: border-box !important;
            margin: 0 !important;
            background: white !important;
          }

          #report > div, table {
            width: 100% !important;
            max-width: none !important;
            margin: 0 0 12px 0 !important; /* Only small vertical spacing between sections */
            padding: 0 !important;
          }

          table {
            width: 100% !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}