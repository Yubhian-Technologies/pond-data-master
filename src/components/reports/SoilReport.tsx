import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs,query,where } from "firebase/firestore";
import { db } from "../../pages/firebase";   // adjust path if different

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
  reportedBy: string;
  checkedBy: string;
  cmisBy: string;
}
interface FarmerData {
  address?: string;
  soilType?: string;
  sourceOfSoil?: string;
  phone?: string;
}

export default function SoilReport() {
  const { invoiceId, locationId } = useParams();  // ⬅ receive IDs from route

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
    reportedBy: "",
    checkedBy: "",
    cmisBy: "",
  });

  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
  const fetchData = async () => {
    try {
      if (!invoiceId || !locationId) return;
      const reportRef = doc(db, "locations", locationId, "reports", invoiceId);
      const reportSnap = await getDoc(reportRef);

      let technicianName = "";
      let soilType = ""; 
      let sourceOfSoil = "";
      if (reportSnap.exists()) {
        technicianName = reportSnap.data()?.technicianName || "";
        soilType = reportSnap.data()?.soilType || "";
        sourceOfSoil = reportSnap.data()?.sourceOfSoil || "";
      }

      // Step 1: Query invoices where invoiceId field matches
      const invoicesRef = collection(db, "locations", locationId, "invoices");
      const q = query(invoicesRef, where("id", "==", invoiceId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log("Invoice not found for invoiceId:", invoiceId);
        return;
      }

      const invoiceDoc = snapshot.docs[0];       // first matched document
      const docId = invoiceDoc.id;               // actual Firestore document ID
      const data = invoiceDoc.data();
      const soilCount =
    data.sampleType?.filter((s: any) => s.type === "soil")
                 ?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

      // Step 2: Set Invoice Form Data
      setFormData((prev) => ({
        ...prev,
        cmisBy: technicianName ,
        reportedBy: technicianName,
        checkedBy: technicianName,
        farmerName: data.farmerName || "",
        farmerUID: data.farmerId || "",
        farmerAddress: data.farmerAddress || "",
        noOfSamples: soilCount.toString(),
       sampleDate: data.createdAt?.toDate
  ? data.createdAt.toDate().toISOString().split("T")[0]
  : "",

        reportDate: new Date().toISOString().split("T")[0],
      }));
      if (data.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", data.farmerId);
          const farmerSnap = await getDoc(farmerRef);

          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data() as FarmerData;

            setFormData(prev => ({
              ...prev,
              farmerAddress: farmerData.address || "",
              soilType: soilType,
              sourceOfSoil: sourceOfSoil,
              mobile: farmerData.phone || "",
            }));
          }
        }

      // Step 3: Fetch soil samples subcollection from reports
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

      setSamples(list);
    } catch (error) {
      console.error("Error loading report:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [invoiceId, locationId]);

  if (loading) return <p>Loading Report...</p>;


  return (
    <>
      <div className="mb-6 print:hidden">
        {/* <button
          onClick={handlePrint}
          className="px-6 py-2 rounded hover:opacity-90 flex items-center gap-2 text-white font-semibold"
          style={{backgroundColor: '#2563eb'}}
        >
          <Download size={20} />
          Print Report
        </button> */}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8" id="report">
        {/* Header with Blue Background */}
        <div className="text-center py-2 mb-4" style={{backgroundColor: '#1e3a8a', color: '#ffffff'}}>
          <h1 className="text-xl font-bold">SOIL ANALYSIS REPORT</h1>
        </div>

        {/* Organization Details */}
        <div className="flex justify-between items-start mb-4 pb-4" style={{borderBottom: '2px solid #374151'}}>
          <div className="flex items-start gap-4">
            <div className="px-4 py-3 rounded font-bold text-2xl" style={{backgroundColor: '#dc2626', color: '#ffffff'}}>
              <div>KC</div>
              <div className="text-xs">T</div>
            </div>
            <div>
              <div className="font-bold text-lg">KCT Group Trust</div>
              <div className="text-xs" style={{color: '#4b5563'}}>Karam Chand Thapar Group</div>
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

        {/* Farmer Information Table */}
        <table className="w-full mb-4" style={{border: '2px solid #1f2937'}}>
          <tbody>
            <tr style={{borderBottom: '1px solid #1f2937'}}>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '16.66%'}}>Farmer Name:</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937', width: '33.33%'}}>{formData.farmerName}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '16.66%'}}>Soil Type :</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937', width: '16.66%'}}>{formData.soilType}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db', width: '8.33%'}}>Mobile:</td>
              <td className="px-2 py-1 text-sm" style={{width: '8.33%'}}>{formData.mobile}</td>
            </tr>
            <tr style={{borderBottom: '1px solid #1f2937'}}>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Farmer UID :</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.farmerUID}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Source of Soil :</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.sourceOfSoil}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Sample Date :</td>
              <td className="px-2 py-1 text-sm">{formData.sampleDate}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Farmer Address :</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.farmerAddress}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>No.of Samples :</td>
              <td className="px-2 py-1 text-sm" style={{borderRight: '1px solid #1f2937'}}>{formData.noOfSamples}</td>
              <td className="px-2 py-1 font-semibold text-sm" style={{borderRight: '1px solid #1f2937', backgroundColor: '#d1d5db'}}>Report Date :</td>
              <td className="px-2 py-1 text-sm">{formData.reportDate}</td>
            </tr>
          </tbody>
        </table>

        {/* Test Results Table */}
        <table className="w-full mb-4 text-xs" style={{border: '2px solid #1f2937'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #1f2937', backgroundColor: '#d1d5db'}}>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Pond No.</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>pH</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>EC (ds/m)</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>CaCO₃ Content(%)</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Soil texture</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Organic Carbon(%)</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Available Nitrogen (mg/kg)</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Available Phos-phorus (mg/kg)</th>
              <th className="px-2 py-2 font-bold" style={{borderRight: '1px solid #1f2937'}}>Redox Potential (mV)</th>
              <th className="px-2 py-2 font-bold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, index) => (
              <tr key={index} style={{borderBottom: '1px solid #1f2937'}}>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.pondNo}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.pH}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.ec}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.caco3}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.soilTexture}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.organicCarbon}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.availableNitrogen}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.availablePhosphorus}</td>
                <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>{sample.redoxPotential}</td>
                <td className="px-2 py-2 text-center">{sample.remarks}</td>
              </tr>
            ))}
            <tr style={{backgroundColor: '#e5e7eb'}}>
              <td className="px-2 py-2 text-center font-semibold italic" style={{borderRight: '1px solid #1f2937'}}>Optimum level</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>7.0-8.0</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&gt;4</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>&gt;5.0</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}></td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>0.5 - 1.5</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>50 - 75</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>4 - 6</td>
              <td className="px-2 py-2 text-center" style={{borderRight: '1px solid #1f2937'}}>Less than -150</td>
              <td className="px-2 py-2 text-center"></td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mb-4" style={{border: '2px solid #1f2937'}}>
          <div className="text-xs px-2 py-1" style={{borderBottom: '1px solid #1f2937'}}>
            <span className="font-bold">Note :</span> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation
          </div>
          <div className="flex">
            <div className="px-2 py-1 text-xs" style={{width: '33.33%', borderRight: '1px solid #1f2937'}}>
              <span className="font-semibold">Reported by :</span> {formData.reportedBy}
            </div>
            <div className="px-2 py-1 text-xs" style={{width: '33.33%', borderRight: '1px solid #1f2937'}}>
              <span className="font-semibold">Checked by :</span> {formData.checkedBy}
            </div>
            <div className="px-2 py-1 text-xs" style={{width: '33.33%'}}>
              <span className="font-semibold">CMIS by :</span> {formData.cmisBy}
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-sm" style={{color: '#dc2626'}}>
          KCT Group Trust committed for Complete Farming Solutions
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report, #report * {
            visibility: visible;
          }
          #report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}