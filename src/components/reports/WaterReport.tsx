// src/components/reports/WaterReport.tsx

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

// All image imports (unchanged)
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import corrella from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/1-CHORELLA.png";
import phacus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/2-OOSYSTIS.jpg";
import desmids from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/3-Eudorina.jpg";
import scenedesmus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/4-Scenedesmus.jpeg";
import copepod from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/1-Copepods.webp";
import rotifer from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/3-ROTIFERS.jpg";
import nauplius from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/2-Nauplius.jpg";
import spirulina from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/2.BLUE GREEN ALGE/SPIRULINA.jpg";
import chaetoceros from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/3.DIATAM/2-Chaetoceros.jpg";
import skeletonema from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/3.DIATAM/1-SKELETOEMA.jpg";
import rhizosolenia from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/3.DIATAM/3-RHIZOSOLENIA.jpg";
import anabaena from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Blue green alge/2-Anabaena.gif";
import oscillatoria from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Blue green alge/3-Oscillatoria.jpg";
import microcystis from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Blue green alge/1-Microcystis.png";
import coscinodiscus from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Diatoms/1-coscinodiscus.jpg";
import nitzchia from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Diatoms/2-Navicula.jpg";
import navicula from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Diatoms/2-Navicula.jpg";
import noctiluca from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Dainoflagellates/1-NOCTILUCA.jpg";
import ceratium from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Dainoflagellates/3-CERATIUM.jpg";
import dinophysis from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Dainoflagellates/2-Dinophysis.jpg";
import gymnodinium from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Dainoflagellates/4-Gymnodinium.jpg";
import zoothamnium from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Protozoa/3-Zoothamnium.jpg";
import tintinnopsis from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Protozoa/2-Vorticella-1.jpg";
import favella from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Protozoa/1-Favella.jpg";

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

  yellowColonies: string;
  greenColonies: string;
  tpc: string;

  phacus: string;
  chlorella: string;
  desmids: string;
  scenedesmus: string;
  copepod: string;
  rotifer: string;
  nauplius: string;
  spirulina: string;
  chaetoceros: string;
  skeletonema: string;
  rhizosolenia: string;

  anabaena: string;
  oscillatoria: string;
  microcystis: string;
  coscinodiscus: string;
  nitzchia: string;
  navicula: string;
  noctiluca: string;
  ceratium: string;
  dinophysis: string;
  gymnodinium: string;
  zoothamnium: string;
  tintinnopsis: string;
  favella: string;
}

interface WaterReportProps {
  invoiceId?: string;
  locationId?: string;
  allSampleCount?: number;
}

const WaterReport: React.FC<WaterReportProps> = ({
  invoiceId: propInvoiceId,
  locationId: propLocationId,
  allSampleCount = 0,
}) => {
  const routeParams = useParams<{ invoiceId?: string; locationId?: string }>();
  const invoiceId = propInvoiceId || routeParams.invoiceId;
  const locationId = propLocationId || routeParams.locationId;

  const [formData, setFormData] = useState({
    farmerName: "",
    mobile: "",
    sdDoc: "",
    sampleCollectionTime: "",
    sampleTime: "",
    reportTime: "",
    farmerUID: "",
    sourceOfWater: "",
    sampleDate: "",
    farmerAddress: "",
    noOfSamples: "",
    reportDate: "",
    technicianName: "",
  });

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Find the correct invoice document using the custom 'id' field
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const q = query(invoicesRef, where("id", "==", invoiceId));
        const invoiceSnap = await getDocs(q);

        if (invoiceSnap.empty) {
          console.error("Invoice not found for invoiceId:", invoiceId);
          setLoading(false);
          return;
        }

        const invoiceDoc = invoiceSnap.docs[0];
        const invoiceData = invoiceDoc.data();

        // Extract water sample count
        const waterType = invoiceData.sampleType?.find((s: any) => s.type?.toLowerCase() === "water");
        const waterCount = waterType?.count || allSampleCount || 1;

        // 2. Fetch farmer details
        let farmerName = invoiceData.farmerName || "";
        let mobile = invoiceData.farmerPhone || "";
        let farmerUID = invoiceData.farmerUID || invoiceData.farmerId || "";
        let farmerAddress = invoiceData.farmerAddress || "";
        let sourceOfWater = invoiceData.sourceOfWater || "";
        let sdDoc = invoiceData.dateOfCulture || invoiceData.sdDoc || "";

        if (invoiceData.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", invoiceData.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmer = farmerSnap.data();
            farmerName = farmer.name || farmerName;
            mobile = farmer.phone || mobile;
            farmerAddress = [farmer.address, farmer.city, farmer.state]
              .filter(Boolean)
              .join(", ") || farmerAddress;
            sourceOfWater = farmer.waterSource || sourceOfWater;
          }
        }

        // 3. Set form data — now correctly pulling all time fields from invoice
        setFormData({
          farmerName,
          mobile,
          sdDoc,
          sampleCollectionTime: invoiceData.sampleCollectionTime || "-",
          sampleTime: invoiceData.sampleTime || "-",
          reportTime: invoiceData.reportTime || new Date().toTimeString().slice(0, 5),
          farmerUID,
          sourceOfWater,
          sampleDate: invoiceData.sampleDate || invoiceData.createdAt?.toDate?.()?.toISOString().split("T")[0] || "-",
          farmerAddress,
          noOfSamples: waterCount.toString(),
          reportDate: invoiceData.reportDate || new Date().toISOString().split("T")[0],
          technicianName: invoiceData.technicianName || "",
        });

        // 4. Fetch water samples
        // 4. Fetch water samples - CORRECT PATH
const samplesCollection = collection(
  db,
  "locations",
  locationId,
  "invoices",
  invoiceId,
  "water_reports"
);

const samplesSnap = await getDocs(samplesCollection);

        const pondList: Pond[] = [];

        for (let i = 1; i <= waterCount; i++) {
          const sampleDoc = samplesSnap.docs.find(d => d.id === `sample_${i}`);
          if (sampleDoc) {
            const data = sampleDoc.data();
            pondList.push({
              id: i,
              pondNo: data.pondNo || `Pond ${i}`,
              pH: data.pH || "",
              salinity: data.salinity || "",
              co3: data.co3 || "",
              hco3: data.hco3 || "",
              alkalinity: data.alkalinity || "",
              hardness: data.hardness || "",
              ca: data.ca || "",
              mg: data.mg || "",
              na: data.na || "",
              k: data.k || "",
              totalAmmonia: data.totalAmmonia || "",
              unionizedAmmonia: data.unionizedAmmonia || "",
              h2s: data.h2s || "",
              nitrite: data.nitrite || "",
              nitrate: data.nitrate || "",
              iron: data.iron || "",
              chlorine: data.chlorine || "",
              dissolvedOxygen: data.dissolvedOxygen || "",
              totalDissolvedMatter: data.totalDissolvedMatter || "",
              yellowColonies: data.yellowColonies || "",
              greenColonies: data.greenColonies || "",
              tpc: data.tpc || "",
              phacus: data.phacus || "",
              chlorella: data.chlorella || "",
              desmids: data.desmids || "",
              scenedesmus: data.scenedesmus || "",
              copepod: data.copepod || "",
              rotifer: data.rotifer || "",
              nauplius: data.nauplius || "",
              spirulina: data.spirulina || "",
              chaetoceros: data.chaetoceros || "",
              skeletonema: data.skeletonema || "",
              rhizosolenia: data.rhizosolenia || "",
              anabaena: data.anabaena || "",
              oscillatoria: data.oscillatoria || "",
              microcystis: data.microcystis || "",
              coscinodiscus: data.coscinodiscus || "",
              nitzchia: data.nitzchia || "",
              navicula: data.navicula || "",
              noctiluca: data.noctiluca || "",
              ceratium: data.ceratium || "",
              dinophysis: data.dinophysis || "",
              gymnodinium: data.gymnodinium || "",
              zoothamnium: data.zoothamnium || "",
              tintinnopsis: data.tintinnopsis || "",
              favella: data.favella || "",
            });
          } else {
            pondList.push({
              id: i,
              pondNo: `Pond ${i}`,
              pH: "-", salinity: "-", co3: "-", hco3: "-", alkalinity: "-", hardness: "-", ca: "-", mg: "-", na: "-", k: "-",
              totalAmmonia: "-", unionizedAmmonia: "-", h2s: "-", nitrite: "-", nitrate: "-", iron: "-", chlorine: "-",
              dissolvedOxygen: "-", totalDissolvedMatter: "-",
              yellowColonies: "-", greenColonies: "-", tpc: "-",
              phacus: "-", chlorella: "-", desmids: "-", scenedesmus: "-", copepod: "-", rotifer: "-", nauplius: "-",
              spirulina: "-", chaetoceros: "-", skeletonema: "-", rhizosolenia: "-",
              anabaena: "-", oscillatoria: "-", microcystis: "-", coscinodiscus: "-", nitzchia: "-", navicula: "-",
              noctiluca: "-", ceratium: "-", dinophysis: "-", gymnodinium: "-", zoothamnium: "-", tintinnopsis: "-", favella: "-",
            });
          }
        }

        setPonds(pondList);
      } catch (error) {
        console.error("Error loading water report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId, locationId, allSampleCount]);

  if (loading) return <p className="text-center py-12 text-xl">Loading Water Report...</p>;

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

      <div id="report" className="bg-white p-8 max-w-[1400px] mx-auto print:p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-40 h-32 flex items-center justify-center">
              <img src={ADC} alt="ADC" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2 text-blue-700">వాటర్‌బేస్ ఆక్వా డయాగ్నోస్టిక్ సెంటర్</h1>
            <p className="text-xs text-black font-semibold">అదినారాష్ట్ర విజిని., కోటబాల్ కాంప్లెక్స్., బిల్బర్స్ టౌజ్నపైట్ వదునుగా., జూబానాఫాహరీల</p>
            <p className="text-sm text-black">Contact No- 7286898936, Mail Id:- adc5@waterbaseindia.com</p>
            <h2 className="text-2xl font-bold mt-2 text-red-600">Water Quality Report</h2>
          </div>
          <div className="w-48 h-32 flex items-center justify-center">
            <img src={AV} alt="AV" className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        <div className="text-right mb-2">
  <span className="font-bold">Report Id:- {invoiceId || "-"}</span>
</div>

        {/* Farmer Info Grid - Now shows Sample Collection Time, Sample Time, Report Time */}
        <div className="grid grid-cols-10 gap-0 text-sm mb-4 border border-black">
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">Farmer Name</div>
          <div className="col-span-2 border-r border-black p-0.5">{formData.farmerName || "-"}</div>
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">Mobile</div>
          <div className="col-span-1 border-r border-black p-0.5">{formData.mobile || "-"}</div>
          <div className="col-span-1 border-r border-black p-0.5 text-start font-semibold bg-gray-100">S.D/D.O.C:</div>
          <div className="col-span-1 border-r border-black p-0.5">{formData.sdDoc || "-"}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Collection Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleCollectionTime || "-"}</div>

          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Farmer UID</div>
          <div className="col-span-2 border-r border-t border-black p-0.5">{formData.farmerUID || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Source of Water</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sourceOfWater || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Date:</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleDate || "-"}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Sample Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.sampleTime || "-"}</div>

          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Farmer Address</div>
          <div className="col-span-2 border-r border-t border-black p-0.5">{formData.farmerAddress || "-"}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">No.of Samples</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.noOfSamples}</div>
          <div className="col-span-1 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Report Date:</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.reportDate}</div>
          <div className="col-span-2 border-r border-t border-black p-0.5 text-start font-semibold bg-gray-100">Report Time</div>
          <div className="col-span-1 border-r border-t border-black p-0.5">{formData.reportTime}</div>
        </div>

        {/* Water Analysis + Bacteriology */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 mt-3">
            <div className="lg:col-span-10">
              <h4 className="text-center font-bold text-xs bg-gray-200 border-t border-black py-1 text-red-600">
                WATER ANALYSIS
              </h4>
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
                      <th className="border border-black p-1" rowSpan={2}>H₂S(ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>Nitrite NO₂ (ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>Nitrate NO₃ (ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>Iron (Fe) (ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>Chlorine (ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>DO (ppm)</th>
                      <th className="border border-black p-1" rowSpan={2}>TDM (ppm)</th>
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
                        <td className="border border-black p-1 text-center font-medium">{pond.pondNo}</td>
                        <td className="border border-black p-1 text-center">{pond.pH || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.salinity || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.co3 || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.hco3 || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.alkalinity || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.hardness || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.ca || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.mg || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.na || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.k || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.totalAmmonia || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.unionizedAmmonia || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.h2s || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.nitrite || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.nitrate || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.iron || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.chlorine || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.dissolvedOxygen || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.totalDissolvedMatter || "-"}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="border border-black p-1 text-red-600">Optimum</td>
                      <td className="border border-black p-1 text-center text-red-500">7.5-8.5</td>
                      <td className="border border-black p-1 text-center text-red-500">15-20</td>
                      <td className="border border-black p-1 text-center text-red-500">20-40</td>
                      <td className="border border-black p-1 text-center text-red-500">30-150</td>
                      <td className="border border-black p-1 text-center text-red-500">175-200</td>
                      <td className="border border-black p-1 text-center text-red-500">3000-5000</td>
                      <td className="border border-black p-1 text-center text-red-500">&gt;100</td>
                      <td className="border border-black p-1 text-center text-red-500">&gt;300</td>
                      <td className="border border-black p-1 text-center text-red-500">&gt;40</td>
                      <td className="border border-black p-1 text-center text-red-500">&gt;10</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;0.1-1.0</td>
                      <td className="border border-black p-1 text-center text-red-500">0-0.1</td>
                      <td className="border border-black p-1 text-center text-red-500">0-0.4</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;0.25</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;0.50</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;0.1</td>
                      <td className="border border-black p-1 text-center text-red-500">0-0.02</td>
                      <td className="border border-black p-1 text-center text-red-500">&gt;4</td>
                      <td className="border border-black p-1 text-center text-red-500">40-70</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-center font-bold text-xs bg-gray-200 border border-black py-1 text-red-600">
                BACTERIOLOGY
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-xs font-medium">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="h-[39px] border border-black" colSpan={4}>Vibrio CFU /ml</th>
                    </tr>
                    <tr className="bg-gray-200">
                  
                      <th className="border border-black p-1">Yellow Colonies</th>
                      <th className="border border-black p-1">Green Colonies</th>
                      <th className="border border-black p-1">TPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ponds.map((pond) => (
                      <tr key={pond.id}>
                        
                        <td className="border border-black p-1 text-center">{pond.yellowColonies || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.greenColonies || "-"}</td>
                        <td className="border border-black p-1 text-center">{pond.tpc || "-"}</td>
                      </tr>
                    ))}
                    <tr className="font-bold h-[40px]">
                      
                      <td className="border border-black p-1 text-center text-red-500">&lt;300</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;10</td>
                      <td className="border border-black p-1 text-center text-red-500">&lt;300</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* PLANKTON ANALYSIS */}
        <div className="border border-black mb-4">
          <h3 className="text-center font-bold bg-white text-red-500 py-1 text-sm border-b border-black">PLANKTON ANALYSIS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1">Pond No.</th>
                  <th className="border border-black p-0.5 text-green-700 text-sm" colSpan={11}>USEFUL PLANKTON - ఉపయోగకరమైన పలాంక్టన్లు</th>
                  <th className="border border-black p-0.5 text-red-700 text-sm" colSpan={14}>HARMFUL PLANKTON - హానికరమైన పలాంక్టన్లు</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1 text-center" colSpan={4}>Phyto Plankton</th>
                  <th className="border border-black p-1 text-center" colSpan={3}>Zooplankton</th>
                  <th className="border border-black p-1 text-center" colSpan={1}>B.G Algae</th>
                  <th className="border border-black p-1 text-center" colSpan={3}>Diatom</th>
                  <th className="border border-black p-1 text-center" colSpan={3}>Blue Green Algae</th>
                  <th className="border border-black p-1 text-center" colSpan={3}>Diatom</th>
                  <th className="border border-black p-1 text-center" colSpan={4}>Dinoflagellate</th>
                  <th className="border border-black p-1 text-center" colSpan={3}>Protozoa</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-0.5 text-xs">Phacus</th>
                  <th className="border border-black p-0.5 text-xs">Chlorella</th>
                  <th className="border border-black p-0.5 text-xs">Desmids</th>
                  <th className="border border-black p-0.5 text-xs">Scenedesmus</th>
                  <th className="border border-black p-0.5 text-xs">Copepod</th>
                  <th className="border border-black p-0.5 text-xs">Rotifer</th>
                  <th className="border border-black p-0.5 text-xs">Nauplius</th>
                  <th className="border border-black p-0.5 text-xs">Spirulina</th>
                  <th className="border border-black p-0.5 text-xs">Chaetoceros</th>
                  <th className="border border-black p-0.5 text-xs">Skeletonema</th>
                  <th className="border border-black p-0.5 text-xs">Rhizosolenia</th>
                  <th className="border border-black p-0.5 text-xs">Anabaena</th>
                  <th className="border border-black p-0.5 text-xs">Oscillatoria</th>
                  <th className="border border-black p-0.5 text-xs">Microcystis</th>
                  <th className="border border-black p-0.5 text-xs">Coscinodiscus</th>
                  <th className="border border-black p-0.5 text-xs">Nitzchia</th>
                  <th className="border border-black p-0.5 text-xs">Navicula</th>
                  <th className="border border-black p-0.5 text-xs">Noctiluca</th>
                  <th className="border border-black p-0.5 text-xs">Ceratium</th>
                  <th className="border border-black p-0.5 text-xs">Dinophysis</th>
                  <th className="border border-black p-0.5 text-xs">Gymnodinium</th>
                  <th className="border border-black p-0.5 text-xs">Zoothamnium</th>
                  <th className="border border-black p-0.5 text-xs">Tintinnopsis</th>
                  <th className="border border-black p-0.5 text-xs">Favella</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={phacus} alt="Phacus" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={corrella} alt="Chlorella" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={desmids} alt="Desmids" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={scenedesmus} alt="Scenedesmus" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={copepod} alt="Copepod" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={rotifer} alt="Rotifer" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={nauplius} alt="Nauplius" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={spirulina} alt="Spirulina" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={chaetoceros} alt="Chaetoceros" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={skeletonema} alt="Skeletonema" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={rhizosolenia} alt="Rhizosolenia" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={anabaena} alt="Anabaena" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={oscillatoria} alt="Oscillatoria" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={microcystis} alt="Microcystis" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={coscinodiscus} alt="Coscinodiscus" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={nitzchia} alt="Nitzchia" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={navicula} alt="Navicula" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={noctiluca} alt="Noctiluca" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={ceratium} alt="Ceratium" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={dinophysis} alt="Dinophysis" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={gymnodinium} alt="Gymnodinium" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={zoothamnium} alt="Zoothamnium" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={tintinnopsis} alt="Tintinnopsis" /></th>
                  <th className="border border-black p-0.5"><img className="w-12 h-12 mx-auto" src={favella} alt="Favella" /></th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id}>
                    <td className="border border-black p-2 text-center font-semibold">{pond.pondNo}</td>
                    <td className="border border-black p-2 text-center">{pond.phacus || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.chlorella || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.desmids || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.scenedesmus || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.copepod || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.rotifer || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.nauplius || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.spirulina || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.chaetoceros || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.skeletonema || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.rhizosolenia || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.anabaena || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.oscillatoria || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.microcystis || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.coscinodiscus || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.nitzchia || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.navicula || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.noctiluca || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.ceratium || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.dinophysis || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.gymnodinium || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.zoothamnium || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.tintinnopsis || "-"}</td>
                    <td className="border border-black p-2 text-center">{pond.favella || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 border border-black p-2">
          <h4 className="font-semibold text-sm mb-2">Remarks & Recommendations:</h4>
          <div className="min-h-[80px] border-t border-dashed border-gray-400 mt-2"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
          <div>
            <p className="font-semibold text-sm">Reported by: {formData.technicianName || "________________"}</p>
          </div>
          <div>
            <p className="font-semibold text-sm">Checked by: ________________</p>
          </div>
        </div>

        <div className="mt-4 text-xs italic text-gray-600">
          <p>Note: The Samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose, Not for any Litigation.</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default WaterReport;