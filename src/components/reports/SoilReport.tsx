// src/components/reports/SoilReport.tsx

import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../pages/firebase";

interface FormData {
  farmerName: string;
  farmerUID: string;
  farmerAddress: string;
  soilType: string;
  sourceOfSoil: string;
  noOfSamples: string;
  mobile: string;
  sampleDate: string;
  reportDate: string;
  sampleCollectionTime: string;
  sampleTime: string;
  reportTime: string;
  reportedBy: string;
  checkedBy: string;
  cmisBy: string;
}

interface FarmerData {
  address?: string;
  soilType?: string;
  sourceOfSoil?: string;
  phone?: string;
  city?: string;     
  state?: string;
}

interface SoilReportProps {
  invoiceId?: string;
  locationId?: string;
  allSampleCount?: number;
}

const SoilReport: React.FC<SoilReportProps> = ({
  invoiceId: propInvoiceId,
  locationId: propLocationId,
  allSampleCount = 0,
}) => {
  const routeParams = useParams<{ invoiceId?: string; locationId?: string }>();
  const invoiceId = propInvoiceId || routeParams.invoiceId;
  const locationId = propLocationId || routeParams.locationId;

  const [formData, setFormData] = useState<FormData>({
    farmerName: "",
    farmerUID: "",
    farmerAddress: "",
    soilType: "",
    sourceOfSoil: "",
    noOfSamples: "",
    mobile: "",
    sampleDate: "",
    reportDate: "",
    sampleCollectionTime: "-",
    sampleTime: "-",
    reportTime: new Date().toTimeString().slice(0, 5),
    reportedBy: "",
    checkedBy: "",
    cmisBy: "",
  });

  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!invoiceId || !locationId) return;

        const reportRef = doc(db, "locations", locationId, "reports", invoiceId);
        const reportSnap = await getDoc(reportRef);

        let technicianName = "";
        let soilType = "";
        let sourceOfSoil = "";
        let sampleCollectionTime = "-";
        let sampleTime = "-";
        let reportTime = new Date().toTimeString().slice(0, 5);

        if (reportSnap.exists()) {
          const data = reportSnap.data();
          technicianName = data?.technicianName || "";
          soilType = data?.soilType || "";
          sourceOfSoil = data?.sourceOfSoil || "";
          sampleCollectionTime = data?.sampleCollectionTime || "-";
          sampleTime = data?.sampleTime || "-";
          reportTime = data?.reportTime || reportTime;
        }

        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const q = query(invoicesRef, where("id", "==", invoiceId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log("Invoice not found for invoiceId:", invoiceId);
          return;
        }

        const invoiceDoc = snapshot.docs[0];
        const data = invoiceDoc.data();

        const calculatedSoilCount =
          data.sampleType
            ?.filter((s: any) => s.type === "soil")
            .reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

        const displaySampleCount = allSampleCount > 0 ? allSampleCount : calculatedSoilCount;

        const sampleDate = data.sampleDate || data.createdAt?.toDate?.()?.toISOString().split("T")[0] || "-";

        setFormData((prev) => ({
          ...prev,
          cmisBy: technicianName || "",
          reportedBy: technicianName || "",
          checkedBy: technicianName || "",
          farmerName: data.farmerName || "",
          farmerUID: data.farmerUID || data.farmerId || "",
          farmerAddress: data.farmerAddress || "",
          mobile: data.farmerPhone || "",
          noOfSamples: displaySampleCount.toString(),
          sampleDate,
          reportDate: new Date().toISOString().split("T")[0],
          soilType,
          sourceOfSoil,
          sampleCollectionTime,
          sampleTime,
          reportTime,
        }));

        if (data.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", data.farmerId);
          const farmerSnap = await getDoc(farmerRef);

          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data() as FarmerData;
            setFormData((prev) => ({
              ...prev,
              farmerAddress: [farmerData.address, farmerData.city, farmerData.state]
                .filter(Boolean)
                .join(", ") || prev.farmerAddress,
              mobile: farmerData.phone || prev.mobile,
            }));
          }
        }

        const samplesRef = collection(
          db,
          "locations",
          locationId,
          "reports",
          invoiceId,
          "soil samples"
        );

        const sampleSnap = await getDocs(samplesRef);
        const list = sampleSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const formattedSamples = list.map((s: any, i: number) => ({
          id: s.id,
          ...s,
          pondNo: (s as any).pondNo || `Sample ${i + 1}`, 
        }));

        setSamples(formattedSamples);

      } catch (error) {
        console.error("Error loading soil report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId, locationId, allSampleCount]);

  if (loading) return <p className="text-center py-12 text-xl">Loading Soil Report...</p>;

  return (
    <>
      <div className="mb-6 print:hidden text-center">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mx-auto"
        >
          <Printer size={20} /> Print Report
        </button>
      </div>

      <div className="bg-white" id="report">
        <div className="text-center py-2 mb-4" style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
          <h1 className="text-xl font-bold">SOIL ANALYSIS REPORT</h1>
        </div>

        <div className="flex justify-between items-start mb-4 pb-4" style={{ borderBottom: '2px solid #374151' }}>
          <div className="flex items-start gap-4">
            <div className="px-4 py-3 rounded font-bold text-2xl" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
              <div>KC</div>
              <div className="text-xs">T</div>
            </div>
            <div>
              <div className="font-bold text-lg">KCT Group Trust</div>
              <div className="text-xs" style={{ color: '#4b5563' }}>Karam Chand Thapar Group</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-bold">Community Development Center</div>
            <div>(Learning, Livelihood & Research)</div>
            <div># 3-6-10, Ravi House,</div>
            <div>Town Railway Station Road,</div>
            <div>Bhimavaram-534202, (WG Dt.)</div>
            <div>Andhra pradesh, India.</div>
            <div className="mt-2">Ph : 08816-297707</div>
            <div>Email:bhimavaram@kctgroup.com</div>
          </div>
        </div>

        <div className="text-right mb-4">
          <span className="font-bold">Report Id:- {invoiceId || "-"}</span>
        </div>

        <div className="grid grid-cols-10 gap-0 text-sm mb-6 border border-black">
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">Farmer Name</div>
          <div className="col-span-2 border-r border-black p-0.5">{formData.farmerName || "-"}</div>
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">Mobile</div>
          <div className="col-span-1 border-r border-black p-0.5">{formData.mobile || "-"}</div>
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">Soil Type</div>
          <div className="col-span-1 border-r border-black p-0.5">{formData.soilType || "-"}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Collection Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleCollectionTime || "-"}</div>

          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Farmer UID</div>
          <div className="col-span-2 border-r border-t border-black p-0.5">{formData.farmerUID || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Source of Soil</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sourceOfSoil || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Date</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleDate || "-"}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleTime || "-"}</div>

          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Farmer Address</div>
          <div className="col-span-2 border-r border-t border-black p-0.5">{formData.farmerAddress || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">No.of Samples</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.noOfSamples}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Report Date</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.reportDate}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Report Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.reportTime}</div>
        </div>

        <table className="w-full mb-4 text-xs" style={{ border: '2px solid #1f2937' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1f2937', backgroundColor: '#d1d5db' }}>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Pond No.</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>pH</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>EC (ds/m)</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>CaCO₃ Content(%)</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Soil texture</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Organic Carbon(%)</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Available Nitrogen (mg/kg)</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Available Phos-phorus (mg/kg)</th>
              <th className="px-2 py-2 font-bold" style={{ borderRight: '1px solid #1f2937' }}>Redox Potential (mV)</th>
              <th className="px-2 py-2 font-bold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #1f2937' }}>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.pondNo || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.pH || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.ec || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.caco3 || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.soilTexture || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.organicCarbon || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.availableNitrogen || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.availablePhosphorus || "-"}</td>
                <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>{sample.redoxPotential || "-"}</td>
                <td className="px-2 py-2 text-center">{sample.remarks || "-"}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#e5e7eb' }}>
              <td className="px-2 py-2 text-center font-semibold italic" style={{ borderRight: '1px solid #1f2937' }}>Optimum level</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>7.0-8.0</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>&gt;4</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>&gt;5.0</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}></td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>0.5 - 1.5</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>50 - 75</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>4 - 6</td>
              <td className="px-2 py-2 text-center" style={{ borderRight: '1px solid #1f2937' }}>Less than -150</td>
              <td className="px-2 py-2 text-center"></td>
            </tr>
          </tbody>
        </table>

        <div className="mb-4" style={{ border: '2px solid #1f2937' }}>
          <div className="text-xs px-2 py-1" style={{ borderBottom: '1px solid #1f2937' }}>
            <span className="font-bold">Note :</span> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation
          </div>
          <div className="flex">
            <div className="px-2 py-1 text-xs" style={{ width: '33.33%', borderRight: '1px solid #1f2937' }}>
              <span className="font-semibold">Reported by :</span> {formData.reportedBy}
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-sm" style={{ color: '#dc2626' }}>
          KCT Group Trust committed for Complete Farming Solutions
        </div>
      </div>

      {/* FINAL PRINT CSS - ZERO WHITE SPACE ON SIDES/TOP/BOTTOM */}
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
            padding: 0 !important; /* ZERO padding - content to the edge */
            box-sizing: border-box !important;
            margin: 0 !important;
            background: white !important;
          }

          #report > div, table, .grid {
            width: 100% !important;
            max-width: none !important;
            margin: 0 0 8px 0 !important; /* Minimal vertical spacing only */
            padding: 0 !important;
          }

          table {
            table-layout: fixed;
            width: 100% !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default SoilReport;