import React, { useEffect, useState, useRef } from "react";
import { Printer, Download } from "lucide-react";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../pages/firebase";

import AV from "@/assets/AV.jpg";
import ADC from "@/assets/ADC.jpg";

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

  const reportRef = useRef<HTMLDivElement>(null);

  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    email: string;
    contactNumber: string;
  }>({
    address: "",
    email: "",
    contactNumber: "",
  });

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
  });

  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkedByName, setCheckedByName] = useState<string>("");
  const [remarks, setRemarks] = useState<string>(""); // ← new state for shared remarks

  const handlePrint = () => window.print();

  const handleDownloadJpeg = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;

    try {
      const originalPadding = element.style.padding;
      const originalWidth = element.style.width;
      
      element.style.padding = "40px"; 
      element.style.width = "1200px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true, 
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
      });

      element.style.padding = originalPadding;
      element.style.width = originalWidth;

      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Soil_Report_${invoiceId}.jpg`;
      link.click();
    } catch (err) {
      console.error("JPEG Capture Error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!invoiceId || !locationId) return;

        // Fetch report data (soil-specific fields + remarks)
        const reportRef = doc(db, "locations", locationId, "reports", invoiceId);
        const reportSnap = await getDoc(reportRef);

        let technicianName = "";
        let soilType = "";
        let sourceOfSoil = "";
        let sampleCollectionTime = "-";
        let sampleTime = "-";
        let reportTime = new Date().toTimeString().slice(0, 5);
        let savedSampleDate = "";
        let savedRemarks = ""; // ← added

        if (reportSnap.exists()) {
          const data = reportSnap.data();
          technicianName = data?.technicianName || "";
          soilType = data?.soilType || "";
          sourceOfSoil = data?.sourceOfSoil || "";
          sampleCollectionTime = data?.sampleCollectionTime || "-";
          sampleTime = data?.sampleTime || "-";
          reportTime = data?.reportTime || reportTime;
          savedSampleDate = data?.sampleDate || "";
          savedRemarks = data?.remarks || ""; // ← load shared remarks
        }

        setRemarks(savedRemarks);

        // Fetch invoice data
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
          q = query(invoicesRef, where("id", "==", invoiceId));
          snapshot = await getDocs(q);
        }

        if (snapshot.empty) {
          console.log("Invoice not found for invoiceId:", invoiceId);
          setLoading(false);
          return;
        }

        const invoiceDoc = snapshot.docs[0];
        const data = invoiceDoc.data();

        const calculatedSoilCount =
          data.sampleType
            ?.filter((s: any) => s.type?.toLowerCase() === "soil")
            .reduce((sum: number, item: any) => sum + Number(item.count || 0), 0) || 0;

        const displaySampleCount = allSampleCount > 0 ? allSampleCount : calculatedSoilCount;

        const finalSampleDate =
          savedSampleDate ||
          data.dateOfCulture ||
          data.sampleDate ||
          data.formattedDate ||
          (data.createdAt?.toDate?.()?.toISOString().split("T")[0]) ||
          new Date().toISOString().split("T")[0];

        setFormData((prev) => ({
          ...prev,
          reportedBy: technicianName || "",
          checkedBy: "",
          farmerName: data.farmerName || "",
          farmerUID: data.farmerId || "",
          farmerAddress: data.village || data.farmerAddress || "",
          mobile: data.farmerPhone || data.mobile || "",
          noOfSamples: displaySampleCount.toString(),
          sampleDate: finalSampleDate,
          reportDate: new Date().toISOString().split("T")[0],
          soilType,
          sourceOfSoil,
          sampleCollectionTime,
          sampleTime,
          reportTime,
        }));
        
        setCheckedByName(data.checkedBy || "________________");

        if (data.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", data.farmerId);
          const farmerSnap = await getDoc(farmerRef);

          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data();

            setFormData((prev) => ({
              ...prev,
              farmerUID: farmerData.farmerId || prev.farmerUID,
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
          pondNo: s.pondNo || `Sample ${i + 1}`,
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

  if (loading) return <p className="text-center py-12 text-xl">Loading Soil Report...</p>;
  if (samples.length === 0 && formData.farmerName === "") {
    return <p className="text-center py-12 text-red-600 text-xl">No soil report data found for this invoice.</p>;
  }
  const formatDateDDMMYYYY = (dateStr: string | undefined): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
};

  return (
    <>
      <div className="mb-6 print:hidden flex justify-center gap-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          <Printer size={20} /> Print Report (PDF)
        </button>
        <button
          onClick={handleDownloadJpeg}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          <Printer size={20} /> Download JPEG
        </button>
      </div>

      <div ref={reportRef} className="bg-white" id="report">
        <div className="flex justify-between items-start mb-8 border-b-2 border-black">
          <img src={ADC} alt="ADC Logo" className="w-40 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-700">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-sm text-black font-semibold">
              {locationDetails.address || "Loading lab address..."}
            </p>
            <p className="text-sm text-black">
              Contact No: {locationDetails.contactNumber || "Loading..."} | Mail Id: {locationDetails.email || "Loading..."}
            </p>
            <p className="text-sm text-black">
              GSTIN: - 37AABCT0601L1ZJ
            </p>
          </div>
          <img src={AV} alt="AV Logo" className="w-40 object-contain" />
        </div>

        <div className="text-center m-5">
          <h2 className="text-2xl font-bold text-red-600 mt-3">
            Soil Analysis Report
          </h2>
        </div>

        <div className="grid grid-cols-6 gap-0 text-sm mb-6 border border-black">
          {/* Row 1 */}
          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100 text-start">
            Farmer Name
          </div>
          <div className="col-span-1 border-r border-black p-1 break-words whitespace-normal">
            {formData.farmerName || "-"}
          </div>

          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100 text-start">
            Mobile
          </div>
          <div className="col-span-1 border-r border-black p-1">
            {formData.mobile || "-"}
          </div>

          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100 text-start">
            Sample Date
          </div>
          <div className="col-span-1 border-black p-1">
            {formatDateDDMMYYYY(formData.sampleDate)}
          </div>

          {/* Row 2 */}
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            Farmer UID
          </div>
          <div className="col-span-1 border-r border-t border-black p-1">
            {formData.farmerUID || "-"}
          </div>

          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            Farmer Address
          </div>
          <div className="col-span-1 border-r border-t border-black p-1 break-words whitespace-normal">
            {formData.farmerAddress || "-"}
          </div>

          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            Sample Collection Time
          </div>
          <div className="col-span-1 border-t border-black p-1">
          {formatDateDDMMYYYY(formData.sampleCollectionTime)}
          </div>

          {/* Row 3 */}
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            Report Id
          </div>
          <div className="col-span-1 border-t border-black p-1">
            {invoiceId || "-"}
          </div>

          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            Source of Soil
          </div>
          <div className="col-span-1 border-r border-t border-black p-1">
            {formData.sourceOfSoil || "-"}
          </div>

          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100 text-start">
            No. of Samples
          </div>
          <div className="col-span-1 border-r border-t border-black p-1">
            {formData.noOfSamples || "-"}
          </div>
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
              {/* Remarks column removed */}
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
                {/* No remarks cell here anymore */}
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
              {/* No remarks optimum cell */}
            </tr>
          </tbody>
        </table>

        {/* ────────────────────── Shared Remarks Section ────────────────────── */}
        <div className="mb-6 border border-black p-4">
          <h3 className="font-bold text-base mb-2 text-red-700 text-[10px]">Remarks & Recommendations:</h3>
          <div className="text-sm whitespace-pre-wrap min-h-[30px]">
            {remarks || "No remarks provided."}
          </div>
        </div>

        <div className="mb-4" style={{ border: '2px solid #1f2937' }}>
          <div className="text-xs px-2 py-1" style={{ borderBottom: '1px solid #1f2937' }}>
            <span className="font-bold">Note :</span> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation
          </div>
          <div className="flex">
            <div className="px-2 py-1 text-xs" style={{ width: '33.33%', borderRight: '1px solid #1f2937' }}>
              <span className="font-semibold">Reported by :</span> {formData.reportedBy}
            </div>
            <div className="px-2 py-2 text-xs font-medium" style={{ width: '50%' }}>
              Checked by: {checkedByName}
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-sm" style={{ color: '#dc2626' }}>
          ADC AQUA DIAGNOSTIC CENTER committed for Complete Farming Solutions
        </div>
      </div>

      <style>{`
  @media print {
    @page {
      size: A4 landscape;
      margin: 1cm 1.2cm;
    }

    html, body {
      width: 297mm !important;
      height: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden;
      background: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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
      width: 100% !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      background: white !important;
    }

    #report > div.mb-8,
    #report > div.mb-6,
    #report > table.mb-4,
    #report > div.mb-4,
    #report > div.mb-6 + div.mb-4,  /* remarks section spacing */
    #report > div.text-center {
      margin-bottom: 24px !important;
    }

    .grid.mb-6 + table.mb-4 {
      margin-top: 20px !important;
    }

    div[style*="border: '2px solid #1f2937'"] {
      margin-top: 20px !important;
      margin-bottom: 24px !important;
    }

    table {
      table-layout: fixed;
      width: 100% !important;
      margin-bottom: 24px !important;
      font-size: 9.5px !important;
      border-collapse: collapse !important;
    }

    tr {
      page-break-inside: avoid;
    }

    .print\\:hidden {
      display: none !important;
    }

    h1 { font-size: 2.1rem !important; }
    h2 { font-size: 1.5rem !important; }
  }
`}</style>
    </>
  );
};

export default SoilReport;