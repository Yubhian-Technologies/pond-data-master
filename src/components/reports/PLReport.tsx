// src/components/reports/PLReport.tsx

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { Printer } from "lucide-react";
import { useUserSession } from "@/contexts/UserSessionContext"; // For technician name

interface FarmerInfo {
  farmerName: string;
  village: string;
  mobile: string;
  sampleDate: string;
  sampleTime: string;
  reportDate: string;
  reportTime: string;
}

interface PLData {
  testCode: string[];
  rostralSpines: string[];
  avgLength: string[];
  plAge: string[];
  sizeVariation: string[];
  mgr: string[];
  mgrPercent: string[];
  hp: string[];
  shg: string[];
  necAppend: string[];
  necRostrum: string[];
  necGill: string[];
  necMuscle: string[];
  foulAppend: string[];
  foulGill: string[];
  foulAbdomen: string[];
  stressTankSalinity: string[];
  salinityPercent: string[];
  totalScore: string[];
}

interface PLReportProps {
  invoiceId: string;
  locationId: string;
  allSampleCount: number;
  showSignature?: boolean; // NEW: Control whether to show signature (default: true)
}

export default function PLReport({
  invoiceId,
  locationId,
  allSampleCount,
  showSignature = true, // Show by default when used alone
}: PLReportProps) {
  const { session } = useUserSession(); // Get technician name
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [plData, setPlData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPLReport = async () => {
      try {
        setLoading(true);

        const reportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          invoiceId,
          "plReports",
          "data"
        );

        const snap = await getDoc(reportRef);

        if (snap.exists()) {
          const data = snap.data();

          const savedFarmerInfo = data.farmerInfo || {};
          setFarmerInfo({
            farmerName: savedFarmerInfo.farmerName || "-",
            village: savedFarmerInfo.village || "-",
            mobile: savedFarmerInfo.mobile || "-",
            sampleDate: savedFarmerInfo.sampleDate || "-",
            sampleTime: savedFarmerInfo.sampleTime || "-",
            reportDate: savedFarmerInfo.reportDate || new Date().toISOString().split("T")[0],
            reportTime: savedFarmerInfo.reportTime || new Date().toTimeString().slice(0, 5),
          });

          const savedPlData = data.plData || {};

          const normalized: PLData = {
            testCode: Array.from({ length: allSampleCount }, (_, i) => savedPlData.testCode?.[i] || `${i + 1}`),
            rostralSpines: Array.from({ length: allSampleCount }, (_, i) => savedPlData.rostralSpines?.[i] || "-"),
            avgLength: Array.from({ length: allSampleCount }, (_, i) => savedPlData.avgLength?.[i] || "-"),
            plAge: Array.from({ length: allSampleCount }, (_, i) => savedPlData.plAge?.[i] || "-"),
            sizeVariation: Array.from({ length: allSampleCount }, (_, i) => savedPlData.sizeVariation?.[i] || "-"),
            mgr: Array.from({ length: allSampleCount }, (_, i) => savedPlData.mgr?.[i] || "-"),
            mgrPercent: Array.from({ length: allSampleCount }, (_, i) => savedPlData.mgrPercent?.[i] || "-"),
            hp: Array.from({ length: allSampleCount }, (_, i) => savedPlData.hp?.[i] || "-"),
            shg: Array.from({ length: allSampleCount }, (_, i) => savedPlData.shg?.[i] || "-"),
            necAppend: Array.from({ length: allSampleCount }, (_, i) => savedPlData.necAppend?.[i] || "-"),
            necRostrum: Array.from({ length: allSampleCount }, (_, i) => savedPlData.necRostrum?.[i] || "-"),
            necGill: Array.from({ length: allSampleCount }, (_, i) => savedPlData.necGill?.[i] || "-"),
            necMuscle: Array.from({ length: allSampleCount }, (_, i) => savedPlData.necMuscle?.[i] || "-"),
            foulAppend: Array.from({ length: allSampleCount }, (_, i) => savedPlData.foulAppend?.[i] || "-"),
            foulGill: Array.from({ length: allSampleCount }, (_, i) => savedPlData.foulGill?.[i] || "-"),
            foulAbdomen: Array.from({ length: allSampleCount }, (_, i) => savedPlData.foulAbdomen?.[i] || "-"),
            stressTankSalinity: Array.from({ length: allSampleCount }, (_, i) => savedPlData.stressTankSalinity?.[i] || "-"),
            salinityPercent: Array.from({ length: allSampleCount }, (_, i) => savedPlData.salinityPercent?.[i] || "-"),
            totalScore: Array.from({ length: allSampleCount }, (_, i) => savedPlData.totalScore?.[i] || "-"),
          };

          setPlData(normalized);
        } else {
          const empty = {
            testCode: Array.from({ length: allSampleCount }, (_, i) => `Sample ${i + 1}`),
            rostralSpines: Array.from({ length: allSampleCount }, () => "-"),
            avgLength: Array.from({ length: allSampleCount }, () => "-"),
            plAge: Array.from({ length: allSampleCount }, () => "-"),
            sizeVariation: Array.from({ length: allSampleCount }, () => "-"),
            mgr: Array.from({ length: allSampleCount }, () => "-"),
            mgrPercent: Array.from({ length: allSampleCount }, () => "-"),
            hp: Array.from({ length: allSampleCount }, () => "-"),
            shg: Array.from({ length: allSampleCount }, () => "-"),
            necAppend: Array.from({ length: allSampleCount }, () => "-"),
            necRostrum: Array.from({ length: allSampleCount }, () => "-"),
            necGill: Array.from({ length: allSampleCount }, () => "-"),
            necMuscle: Array.from({ length: allSampleCount }, () => "-"),
            foulAppend: Array.from({ length: allSampleCount }, () => "-"),
            foulGill: Array.from({ length: allSampleCount }, () => "-"),
            foulAbdomen: Array.from({ length: allSampleCount }, () => "-"),
            stressTankSalinity: Array.from({ length: allSampleCount }, () => "-"),
            salinityPercent: Array.from({ length: allSampleCount }, () => "-"),
            totalScore: Array.from({ length: allSampleCount }, () => "-"),
          };
          setPlData(empty);

          setFarmerInfo({
            farmerName: "-",
            village: "-",
            mobile: "-",
            sampleDate: "-",
            sampleTime: "-",
            reportDate: new Date().toISOString().split("T")[0],
            reportTime: new Date().toTimeString().slice(0, 5),
          });
        }
      } catch (err) {
        console.error("Error fetching PL report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPLReport();
  }, [invoiceId, locationId, allSampleCount]);

  const handlePrint = () => window.print();

  if (loading) return <p className="text-center py-8 text-lg">Loading Report...</p>;
  if (!plData || !farmerInfo) return <p className="text-center py-8 text-red-600 text-xl">No PL report found.</p>;

  const plRows: { label: string; key: keyof PLData }[] = [
    { label: "Rostral Spines", key: "rostralSpines" },
    { label: "Avg Length (mm)", key: "avgLength" },
    { label: "PL Age", key: "plAge" },
    { label: "Size Variation (%)", key: "sizeVariation" },
    { label: "MGR", key: "mgr" },
    { label: "MGR %", key: "mgrPercent" },
    { label: "HP - F/S", key: "hp" },
    { label: "SHG", key: "shg" },
    { label: "Necrosis - Appendages", key: "necAppend" },
    { label: "Necrosis - Rostrum", key: "necRostrum" },
    { label: "Necrosis - Gill", key: "necGill" },
    { label: "Necrosis - Muscle", key: "necMuscle" },
    { label: "Fouling - Appendages", key: "foulAppend" },
    { label: "Fouling - Gill", key: "foulGill" },
    { label: "Fouling - Abdomen", key: "foulAbdomen" },
    { label: "Stress Tank Salinity", key: "stressTankSalinity" },
    { label: "Salinity Test %", key: "salinityPercent" },
    { label: "Total Score", key: "totalScore" },
  ];

  return (
    <>
      <style>{`
        @media print {
          #pl-report {
            padding: 8px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          h1 { font-size: 1.6rem !important; }
          h2 { font-size: 1.3rem !important; }
          p, td, th, span { font-size: 0.7rem !important; line-height: 1.2 !important; }
          .px-4 { padding-left: 0.3rem !important; padding-right: 0.3rem !important; }
          .py-2 { padding-top: 0.3rem !important; padding-bottom: 0.3rem !important; }
          .mb-4, .mb-8, .mb-12 { margin-bottom: 0.5rem !important; }
          img.w-40 { width: 100px !important; }
          table td, table th { padding: 0.2rem 0.3rem !important; }
          .text-xs { font-size: 0.6rem !important; }
          table, div, section { page-break-inside: avoid !important; }
          @page { size: A4 portrait; margin: 1cm; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-md p-8" id="pl-report">
        <div className="mb-5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Printer size={20} /> Print Report
          </button>
        </div>

        <div className="flex justify-between items-start mb-8 border-b-2 border-black">
          <img src={ADC} alt="ADC Logo" className="w-40 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-700">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-xs text-black font-semibold">3-6-10, Ravi House,Town Railway Station Road,Bhimavaram-534202,West Godavari,India</p>
            <p className="text-sm text-black">Contact No- 7286898936, Mail Id:- adc5@waterbaseindia.com</p>
            <h2 className="text-2xl font-bold text-red-600 mt-3">
              Post Larvae General Observation Report
            </h2>
          </div>
          <img src={AV} alt="AV Logo" className="w-40 object-contain" />
        </div>

        <div className="text-right mb-4">
          <span className="font-bold text-lg">Report Id:- {invoiceId || "-"}</span>
        </div>

        <div className="flex justify-center mb-12">
          <table className="border-2 border-gray-800 text-sm">
            <tbody>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Farmer Name</td>
                <td className="border px-4 py-2">{farmerInfo.farmerName}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Village</td>
                <td className="border px-4 py-2">{farmerInfo.village}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Date</td>
                <td className="border px-4 py-2">{farmerInfo.sampleDate}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Mobile</td>
                <td className="border px-4 py-2">{farmerInfo.mobile}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Time</td>
                <td className="border px-4 py-2">{farmerInfo.sampleTime}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Report Date</td>
                <td className="border px-4 py-2">{farmerInfo.reportDate}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-blue-100 border px-4 py-2">No. of Samples</td>
                <td className="border px-4 py-2">{allSampleCount}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Report Time</td>
                <td className="border px-4 py-2">{farmerInfo.reportTime}</td>
                <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Type</td>
                <td className="border px-4 py-2">PL</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-center overflow-x-auto">
          <table className="inline-table border-2 border-gray-800 text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-blue-100">
                <th className="border px-4 py-2 font-semibold">TEST CODE</th>
                {plData.testCode.map((code, i) => (
                  <th key={i} className="border px-4 py-2 font-semibold">
                    Tank - {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plRows.map((row) => (
                <React.Fragment key={row.key}>
                  <tr>
                    <td className="border px-4 py-2 font-semibold bg-gray-50">
                      {row.label}
                    </td>
                    {plData[row.key].map((val, i) => (
                      <td key={i} className="border px-4 py-2 text-center">
                        {val || "-"}
                      </td>
                    ))}
                  </tr>
                  {row.key === "shg" && (
                    <tr className="bg-blue-200">
                      <td className="border px-4 py-2 font-bold" colSpan={allSampleCount + 1}>
                        Necrosis
                      </td>
                    </tr>
                  )}
                  {row.key === "necMuscle" && (
                    <tr className="bg-blue-200">
                      <td className="border px-4 py-2 font-bold" colSpan={allSampleCount + 1}>
                        Fouling
                      </td>
                    </tr>
                  )}
                  {row.key === "stressTankSalinity" && (
                    <tr className="bg-blue-200">
                      <td className="border px-4 py-2 font-bold" colSpan={allSampleCount + 1}>
                        Stress Test
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature & Note — only if showSignature is true */}
        {showSignature && (
          <div className="mt-20 border-t-2 border-black pt-8">
            <div className="flex justify-between text-sm px-10 mb-10">
              <div>
                <p className="font-semibold">Reported by:</p>
                <p className="mt-8 font-medium">{session?.technicianName || ""}</p>
              </div>
              <div>
                <p className="font-semibold">Checked by:</p>
                <p className="mt-8">______________________</p>
              </div>
            </div>
            <div className="text-center text-xs text-gray-700">
              <p>
                <strong>Note:</strong> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}