import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs,query,where } from "firebase/firestore";
import { db } from "../../pages/firebase"; // change path if different

interface FormData {
  farmerName: string;
  mobile: string;
  sdDoc: string;
  sampleCollectionTime: string;
  farmerUID: string;
  sourceOfWater: string;
  sampleDate: string;
  sampleTime: string;
  farmerAddress: string;
  noOfSamples: string;
  reportDate: string;
  reportTime: string;
}

interface Pond {
  id: number;
  pondNo: string;
  pH: string;
  salinity: string;
  co3: string;
  hco3: string;
  alkalinity: string;
  hardness: string;
  ca: string;
  mg: string;
  na: string;
  k: string;
  totalAmmonia: string;
  unionizedAmmonia: string;
  h2s: string;
  nitrite: string;
  nitrate: string;
  iron: string;
  chlorine: string;
  dissolvedOxygen: string;
  totalDissolvedMatter: string;
}
interface FarmerData {
  address?: string;
  soilType?: string;
  sourceOfSoil?: string;
  phone?: string;
  farmerId?: string;
}

export default function WaterReport() {
  const { invoiceId, locationId } = useParams();

  const [formData, setFormData] = useState<FormData>({
    farmerName: "",
    mobile: "",
    sdDoc: "",
    sampleCollectionTime: "",
    farmerUID: "",
    sourceOfWater: "",
    sampleDate: "",
    sampleTime: "",
    farmerAddress: "",
    noOfSamples: "",
    reportDate: "",
    reportTime: "",
  });

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

  const handlePrint = () => {
    window.print();
  };

  // Convert timestamp
  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate();
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate();
    return date.toTimeString().split(" ")[0]; // HH:MM:SS
  };
useEffect(() => {
  const fetchData = async () => {
    try {
      if (!invoiceId || !locationId) return;
      const reportRef = doc(db, "locations", locationId, "reports", invoiceId);
      const reportSnap = await getDoc(reportRef);

      let technicianName = "";
      let sourceOfWater = "";

      if (reportSnap.exists()) {
        technicianName = reportSnap.data()?.technicianName || "";
        sourceOfWater = reportSnap.data()?.sourceOfWater || "";
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
      const waterCount =
    data.sampleType?.filter((s: any) => s.type === "water")
                 ?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

      // Step 2: Set Invoice Form Data
      setFormData((prev) => ({
        ...prev,
        sdDoc: data.dateOfCulture || "",
        farmerName: data.farmerName || "",
        sampleCollectionTime: data.sampleCollectionTime || "",
        sampleDate: formatDate(data.createdAt),
        sampleTime: formatTime(data.createdAt),
        farmerAddress: data.farmerAddress || "",
        noOfSamples: waterCount,
        reportDate: new Date().toISOString().split("T")[0],
        reportTime: formatTime(data.updatedAt),
        technicianName: technicianName,
        sourceOfWater: sourceOfWater

      }));
      if (data.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", data.farmerId);
          const farmerSnap = await getDoc(farmerRef);

          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data() as FarmerData;

            setFormData(prev => ({
              ...prev,
              farmerUID: farmerData.farmerId || "",
              farmerAddress: farmerData.address || "",
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
        "water samples"
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

  return (
    <>
      <div className="mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Printer size={20} /> Print Report
        </button>
      </div>

      <div id="report" className="bg-white p-8 max-w-[1400px] mx-auto print:p-4">
        <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-24">
              <svg viewBox="0 0 120 80" className="w-full h-full">
                <text x="10" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">A</text>
                <text x="40" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">D</text>
                <text x="70" y="35" fill="black" fontSize="48" fontWeight="bold" fontFamily="Arial">C</text>
                <text x="5" y="55" fill="#333" fontSize="10" fontFamily="Arial">Aqua Diagnostic Centre</text>
              </svg>
            </div>
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">వాటర్‌బేస్ ఆక్వా డయాగ్నోస్టిక్ సెంటర్</h1>
            <p className="text-sm text-black">అదినారాష్ట్ర విజిని., కోటబాల్ కాంప్లెక్స., బిల్బర్స్ టౌజ్నపైట్ వదునుగా., జూబానాఫాహరీల</p>
            <p className="text-sm text-black">Contact No- 7286898936, Mail Id:- adc5@waterbaseindia.com</p>
            <h2 className="text-2xl font-bold mt-2">Water Quality Report</h2>
          </div>
          
          <div className="w-32 h-24">
            <svg viewBox="0 0 120 80" className="w-full h-full">
              <polygon points="20,20 50,10 80,20 90,50 80,70 50,80 20,70 10,50" fill="white" stroke="black" strokeWidth="2" />
              <text x="35" y="50" fill="black" fontSize="24" fontWeight="bold" fontFamily="Arial">WB</text>
            </svg>
          </div>
        </div>

        <div className="text-right mb-2">
          <span className="font-bold">Report Id:-</span>
        </div>

        <div className="grid grid-cols-6 gap-0 text-sm mb-4 border border-black">
          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100">Farmer Name</div>
          <div className="col-span-2 border-r border-black p-1">{formData.farmerName}</div>
          <div className="col-span-1 border-r border-black p-1 font-semibold bg-gray-100">Mobile</div>
          <div className="col-span-1 border-r border-black p-1">{formData.mobile}</div>
          <div className="col-span-1 p-1"><span className="font-semibold">S.D/D.O.C:</span> {formData.sdDoc}</div>
          
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Farmer UID</div>
          <div className="col-span-2 border-r border-t border-black p-1">{formData.farmerUID}</div>
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Source of Water</div>
          <div className="col-span-1 border-r border-t border-black p-1">{formData.sourceOfWater}</div>
          <div className="col-span-1 border-t border-black p-1"><span className="font-semibold">Sample Date:</span> {formData.sampleDate}</div>
          
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">Farmer Address</div>
          <div className="col-span-2 border-r border-t border-black p-1">{formData.farmerAddress}</div>
          <div className="col-span-1 border-r border-t border-black p-1 font-semibold bg-gray-100">No.of Samples</div>
          <div className="col-span-1 border-r border-t border-black p-1">{formData.noOfSamples}</div>
          <div className="col-span-1 border-t border-black p-1"><span className="font-semibold">Report Date:</span> {formData.reportDate}</div>
        </div>

        <div className="mb-4">
          <h3 className="text-center font-bold bg-white text-black py-1 text-sm border border-black">WATER ANALYSIS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1" rowSpan={2}>Pond No.</th>
                  <th className="border border-black p-1" rowSpan={2}>pH</th>
                  <th className="border border-black p-1" rowSpan={2}>Salinity (PPT)</th>
                  <th className="border border-black p-1" colSpan={2}>Alkalinity (PPM as CaCO₃)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Alkalinity</th>
                  <th className="border border-black p-1" rowSpan={2}>Hardness (ppm as CaCO₃)</th>
                  <th className="border border-black p-1" colSpan={4}>Minerals (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Ammonia NH₃(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Unionized Ammonia NH3(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Hydrogen Sulfide H2S(ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Nitrite NO₂ (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Nitrate NO₃ (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Iron (Fe) (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Chlorine (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>DO (ppm)</th>
                  <th className="border border-black p-1" rowSpan={2}>Total Dissolved Matter TDM (ppm)</th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">CO₃</th>
                  <th className="border border-black p-1">HCO₃</th>
                  <th className="border border-black p-1">Ca⁺⁺</th>
                  <th className="border border-black p-1">Mg⁺⁺</th>
                  <th className="border border-black p-1">Na⁺</th>
                  <th className="border border-black p-1">K⁺</th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id}>
                    <td className="border border-black p-1 text-center">{pond.pondNo}</td>
                    <td className="border border-black p-1 text-center">{pond.pH}</td>
                    <td className="border border-black p-1 text-center">{pond.salinity}</td>
                    <td className="border border-black p-1 text-center">{pond.co3}</td>
                    <td className="border border-black p-1 text-center">{pond.hco3}</td>
                    <td className="border border-black p-1 text-center">{pond.alkalinity}</td>
                    <td className="border border-black p-1 text-center">{pond.hardness}</td>
                    <td className="border border-black p-1 text-center">{pond.ca}</td>
                    <td className="border border-black p-1 text-center">{pond.mg}</td>
                    <td className="border border-black p-1 text-center">{pond.na}</td>
                    <td className="border border-black p-1 text-center">{pond.k}</td>
                    <td className="border border-black p-1 text-center">{pond.totalAmmonia}</td>
                    <td className="border border-black p-1 text-center">{pond.unionizedAmmonia}</td>
                    <td className="border border-black p-1 text-center">{pond.h2s}</td>
                    <td className="border border-black p-1 text-center">{pond.nitrite}</td>
                    <td className="border border-black p-1 text-center">{pond.nitrate}</td>
                    <td className="border border-black p-1 text-center">{pond.iron}</td>
                    <td className="border border-black p-1 text-center">{pond.chlorine}</td>
                    <td className="border border-black p-1 text-center">{pond.dissolvedOxygen}</td>
                    <td className="border border-black p-1 text-center">{pond.totalDissolvedMatter}</td>
                  </tr>
                ))}
                <tr className="bg-white font-semibold">
                  <td className="border border-black p-1">Optimum Level</td>
                  <td className="border border-black p-1 text-center">7.5-8.5</td>
                  <td className="border border-black p-1 text-center">15-20</td>
                  <td className="border border-black p-1 text-center">20-40</td>
                  <td className="border border-black p-1 text-center">30-150</td>
                  <td className="border border-black p-1 text-center">175-200</td>
                  <td className="border border-black p-1 text-center">3000-5000</td>
                  <td className="border border-black p-1 text-center">&gt;100</td>
                  <td className="border border-black p-1 text-center">&gt;300</td>
                  <td className="border border-black p-1 text-center">&gt;40</td>
                  <td className="border border-black p-1 text-center">&gt;10</td>
                  <td className="border border-black p-1 text-center">&lt;0.1-1.0</td>
                  <td className="border border-black p-1 text-center">0-0.1</td>
                  <td className="border border-black p-1 text-center">0-0.4</td>
                  <td className="border border-black p-1 text-center">&lt;0.25</td>
                  <td className="border border-black p-1 text-center">&lt;0.50</td>
                  <td className="border border-black p-1 text-center">&lt;0.1</td>
                  <td className="border border-black p-1 text-center">0-0.02</td>
                  <td className="border border-black p-1 text-center">&gt;4</td>
                  <td className="border border-black p-1 text-center">40-70</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-center font-bold bg-white text-black py-1 text-sm border border-black">PLANKTON ANALYSIS</h3>
          <div className="border border-black">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 w-16">Pond No.</th>
                  <th className="border border-black p-2" colSpan={4}>USEFUL PLANKTON - ఉపయోగకరమైన పలాంక్టన్లు</th>
                  <th className="border border-black p-2" colSpan={9}>HARMFUL PLANKTON - హానికరమైన పలాంక్టన్లు</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1 text-center" colSpan={4}>
                    <div className="font-bold mb-1">Phyto Plankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Zooplankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">B.G Algae</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">Dalton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={2}>
                    <div className="font-bold mb-1">Blue Green Algae</div>
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1">Phacus</th>
                  <th className="border border-black p-1">Chlorella</th>
                  <th className="border border-black p-1">Desmids</th>
                  <th className="border border-black p-1">Scenedesmus</th>
                  <th className="border border-black p-1">Copepod</th>
                  <th className="border border-black p-1">Rotifer</th>
                  <th className="border border-black p-1">Nauplius</th>
                  <th className="border border-black p-1">Spirulina</th>
                  <th className="border border-black p-1">Chaleoceras</th>
                  <th className="border border-black p-1">Rhizoselenia</th>
                  <th className="border border-black p-1">Anabena</th>
                  <th className="border border-black p-1">Oscillatoria</th>
                  <th className="border border-black p-1">Microcystis</th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id}>
                    <td className="border border-black p-2 text-center font-semibold">{pond.pondNo}</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 border border-black p-2">
          <h4 className="font-semibold text-sm mb-2">Remarks & Recommendations:</h4>
          <div className="min-h-[80px]"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
          <div>
            <p className="font-semibold text-sm">Reported by:</p>
          </div>
          <div>
            <p className="font-semibold text-sm">Checked by:</p>
          </div>
        </div>

        <div className="mt-4 text-xs italic text-gray-600">
          <p>Note: The Samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose, Not for any Litigation.</p>
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