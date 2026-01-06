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

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!invoiceId || !locationId) return;

        // Fetch report data (soil-specific fields)
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

        // Fetch invoice data — now supports both new and old invoices
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let snapshot = await getDocs(q);

        // Fallback for old invoices that used 'id' field
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

        const sampleDate =
          data.sampleDate ||
          data.formattedDate ||
          data.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0];

        setFormData((prev) => ({
          ...prev,
          reportedBy: technicianName || "",
          checkedBy: "",
          farmerName: data.farmerName || "",
          farmerUID: data.farmerUID || data.farmerId || "",
          farmerAddress: data.village || data.farmerAddress || "",
          mobile: data.farmerPhone || data.mobile || "",
          noOfSamples: displaySampleCount.toString(),
          sampleDate,
          reportDate: new Date().toISOString().split("T")[0],
          soilType,
          sourceOfSoil,
          sampleCollectionTime,
          sampleTime,
          reportTime,
        }));

        // Fetch farmer details if farmerId exists
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

        // Fetch soil samples
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
        <div className="flex justify-between items-start mb-8 border-b-2 border-black">
          <img src={ADC} alt="ADC Logo" className="w-40 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-700">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-xs text-black font-semibold">
              {locationDetails.address || "Loading lab address..."}
            </p>
            <p className="text-sm text-black">
              Contact No: {locationDetails.contactNumber || "Loading..."} | Mail Id: {locationDetails.email || "Loading..."}
            </p>
            <h2 className="text-2xl font-bold text-red-600 mt-3">
              Soil Analysis Report
            </h2>
          </div>
          <img src={AV} alt="AV Logo" className="w-40 object-contain" />
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
            <div className="px-2 py-2 text-xs font-medium" style={{ width: '50%' }}>
              Checked by: ______________________
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-sm" style={{ color: '#dc2626' }}>
          KCT Group Trust committed for Complete Farming Solutions
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.3cm;
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
            padding: 0 !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            background: white !important;
          }

          #report > div, table, .grid {
            width: 100% !important;
            max-width: none !important;
            margin: 0 0 8px 0 !important;
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