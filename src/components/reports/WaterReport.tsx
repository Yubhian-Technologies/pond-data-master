import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs,query,where } from "firebase/firestore";
import { db } from "../../pages/firebase"; 
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg"
import corrella from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/1-CHORELLA.png"
import phacus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/2-OOSYSTIS.jpg"
import desmids from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/3-Eudorina.jpg"
import scenedesmus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/1.Green alge/4-Scenedesmus.jpeg"
import copepod from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/1-Copepods.webp";
import rotifer from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/3-ROTIFERS.jpg";
import naupilus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/2-Nauplius.jpg"
import spirulina from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/2.BLUE GREEN ALGE/SPIRULINA.jpg"
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
import favelia from "@/assets/PLANKTON ANALYSIS IMAGES/2. Harmful/Protozoa/1-Favella.jpg";

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
  technicianName: string;
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
    technicianName: "",
  });

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handlePrint = () => window.print();

  const formatDate = (ts: any) => ts?.toDate().toISOString().split("T")[0] || "";
  const formatTime = (ts: any) => ts?.toDate().toTimeString().split(" ")[0] || "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!invoiceId || !locationId) return;

        // GET REPORT TO FETCH technicianId
        const reportRef = doc(db, "locations", locationId, "reports", invoiceId);
        const reportSnap = await getDoc(reportRef);

        let technicianName = "";
        let sourceOfWater = ""; 
        if (reportSnap.exists()) 
          { technicianName = reportSnap.data()?.technicianName || "";
             sourceOfWater = reportSnap.data()?.sourceOfWater || ""; 
            }

        // GET INVOICE DOCUMENT
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const q = query(invoicesRef, where("id", "==", invoiceId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const invoiceDoc = snapshot.docs[0];
          const data = invoiceDoc.data();

          const waterCount =
            data.sampleType?.filter((s: any) => s.type === "water")
              ?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

          setFormData((prev) => ({
            ...prev,
            sdDoc: data.dateOfCulture || "",
            farmerName: data.farmerName,
            sampleCollectionTime: data.sampleCollectionTime,
            sampleDate: formatDate(data.createdAt),
            sampleTime: formatTime(data.createdAt),
            farmerAddress: data.farmerAddress,
            noOfSamples: waterCount,
            reportDate: new Date().toISOString().split("T")[0],
            reportTime: formatTime(data.updatedAt),
            technicianName: technicianName,
            sourceOfWater: sourceOfWater,
          }));

          // FETCH FARMER DATA
          if (data.farmerId) {
            const farmerRef = doc(db, "locations", locationId, "farmers", data.farmerId);
            const farmerSnap = await getDoc(farmerRef);
            if (farmerSnap.exists()) {
              const farmerData = farmerSnap.data() as FarmerData;
              setFormData((prev) => ({
                ...prev,
                farmerUID: farmerData.farmerId || "",
                farmerAddress: farmerData.address || "",
                mobile: farmerData.phone || "",
              }));
            }
          }
        }

        // FETCH WATER SAMPLES (PONDS)
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
          id: parseInt(d.id),
          ...d.data(),
        })) as Pond[];

        setPonds(list);
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
              
                
                <div className="w-40 h-32 flex items-center justify-center"> 
  <img 
    src={ADC} 
    alt="Aqua Diagnostic Centre" 
    className="max-w-full max-h-full object-contain" 
  />
</div>
            
            </div>
          </div>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2 text-blue-700">వాటర్‌బేస్ ఆక్వా డయాగ్నోస్టిక్ సెంటర్</h1>
            <p className="text-xs text-black font-semibold">అదినారాష్ట్ర విజిని., కోటబాల్ కాంప్లెక్స., బిల్బర్స్ టౌజ్నపైట్ వదునుగా., జూబానాఫాహరీల</p>
            <p className="text-sm text-black">Contact No- 7286898936, Mail Id:- adc5@waterbaseindia.com</p>
            <h2 className="text-2xl font-bold mt-2 text-red-600">Water Quality Report</h2>
          </div>
          
          <div className="w-48 h-32 flex items-center justify-center"> 
  <img 
    src={AV} 
    alt="Aqua Diagnostic Centre" 
    className="max-w-full max-h-full object-contain" 
  />
</div>
        </div>

        <div className="text-right mb-2">
          <span className="font-bold">Report Id:-</span>
        </div>

        <div className="grid grid-cols-10 gap-0 text-sm mb-4 border border-black">

  
  <div className="col-span-1 border-r border-black p-0.5 text-start item-center font-semibold bg-gray-100">Farmer Name</div>
  <div className="col-span-2 border-r border-black p-0.5 text-start item-center">{formData.farmerName}</div>
  <div className="col-span-1 border-r border-black p-0.5 text-start item-center font-semibold bg-gray-100">Mobile</div>
  <div className="col-span-1 border-r border-black p-0.5 text-start item-center">{formData.mobile}</div>
  <div className="col-span-1 border-r border-black p-0.5 text-start item-center font-semibold bg-gray-100">S.D/D.O.C:</div>
  <div className="col-span-1 border-r border-black p-0.5 text-start item-center">{formData.sdDoc}</div>
  <div className="col-span-2 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Sample Collection Time</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.sampleCollectionTime}</div>

   <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Farmer UID</div>
  <div className="col-span-2 border-r border-t border-black p-0.5 text-start item-center">{formData.farmerUID}</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Source of Water</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.sourceOfWater}</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Sample Date:</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.sampleDate}</div>
  <div className="col-span-2 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Sample Time</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.sampleTime}</div>

  
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Farmer Address</div>
  <div className="col-span-2 border-r border-t border-black p-0.5 text-start item-center">{formData.farmerAddress}</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">No.of Samples</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.noOfSamples}</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Report Date:</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.reportDate}</div>
  <div className="col-span-2 border-r border-t border-black p-0.5 text-start item-center font-semibold bg-gray-100">Report Time</div>
  <div className="col-span-1 border-r border-t border-black p-0.5 text-start item-center">{formData.reportTime}</div>


</div>

        <div className="mb-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12  mt-3">
            <div className="lg:col-span-10">
              <h4 className="text-center font-bold text-xs  bg-gray-200 border-t border-black py-1 text-red-600">
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
                    <tr className=" font-bold">
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
              <h4 className="text-center font-bold text-xs  bg-gray-200 border border-black py-1 text-red-600">
                BACTERIOLOGY
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black  text-xs font-medium">
                  <thead>
                    <tr className="bg-gray-200 ">
                      <th className="h-[39px] border border-black"  colSpan={4} >Vibrio CFU /ml</th>
                    </tr>
                    <tr className="bg-gray-200 mt-3 ">
                      <th className="border border-black p-1" rowSpan={4}>Yellow Colonies</th>
                      <th className="border border-black p-1" rowSpan={4}>Green Colonies<br/></th>
                      <th className="border border-black p-1" rowSpan={4}>TPC<br/></th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {ponds.map((pond) => (
                      <tr key={pond.id}>
                        <td className="border border-black p-1 text-center">{pond.pondNo}</td>
                        <td className="border border-black p-1 text-center">
                          {/* {pond.totalBacteria || "-"} */}
                        </td>
                        <td className="border border-black p-1 text-center">
                          {/* {pond.vibrio || "Nil"} */}
                        </td>
                        <td>

                        </td>
                        
                      </tr>
                    ))}
                    <tr className=" font-bold h-[40px]">
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

        <div className="border border-black  scale-1 origin-top-left mb-4">
          <h3 className="text-center font-bold bg-white text-red-500 py-1 text-sm border border-black ">PLANKTON ANALYSIS</h3>
          <div className="border border-black overflow-x-auto ">
            <table className="w-full border-collapse text-xs ">
              <thead >
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 ">Pond No.</th>
                  <th className="border border-black p-0.5 text-green-700 text-sm" colSpan={11}>USEFUL PLANKTON - ఉపయోగకరమైన పలాంక్టన్లు</th>
                  <th className="border border-black p-0.5 text-red-700 text-sm" colSpan={14}>HARMFUL PLANKTON - హానికరమైన పలాంక్టన్లు</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-1 text-center w-[100px]" colSpan={4}>
                    <div className="font-bold mb-1">Phyto Plankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Zooplankton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={1}>
                    <div className="font-bold mb-1">B.G Algae</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Dalton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Blue Green Algae</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={3}>
                    <div className="font-bold mb-1">Dalton</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={4}>
                    <div className="font-bold mb-1">Dinoflagellate</div>
                  </th>
                  <th className="border border-black p-1 text-center" colSpan={4}>
                    <div className="font-bold mb-1">Protozoa</div>
                  </th>
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
                  <th className="border border-black p-0.5 text-xs">Chaleoceras</th>
                  <th className="border border-black p-0.5 text-xs">Rhizoselenia</th>
                  <th className="border border-black p-0.5 text-xs">Anabena</th>
                  <th className="border border-black p-0.5 text-xs">Oscillatoria</th>
                  <th className="border border-black p-0.5 text-xs">Microcystis</th>
                  <th className="border border-black p-0.5 text-xs">coscinodiscus</th>
                  <th className="border border-black p-0.5 text-xs">nitzchia</th>
                  <th className="border border-black p-0.5 text-xs">navicula</th>
                  <th className="border border-black p-0.5 text-xs">noctiluca</th>
                  <th className="border border-black p-0.5 text-xs">ceratium</th>
                  <th className="border border-black p-0.5 text-xs">dinophysis</th>
                  <th className="border border-black p-0.5 text-xs">gymnodinium</th>
                  <th className="border border-black p-0.5 text-xs">zoothamnium</th>
                  <th className="border border-black p-0.5 text-xs">tintinnopsis</th>
                  <th className="border border-black p-0.5 text-xs">favelia</th>
                  <th className="border border-black p-0.5 text-xs">coscinodiscus</th>
                  
                </tr>

                <tr className="bg-gray-50">
                  <th className="border border-black p-1"></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={phacus} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={corrella} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={desmids} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img  src={scenedesmus} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={copepod} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={rotifer} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={naupilus} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={spirulina} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={chaetoceros} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={skeletonema} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={rhizosolenia} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={anabaena} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={oscillatoria} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={coscinodiscus} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={nitzchia} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={naupilus} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={noctiluca} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={ceratium} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={dinophysis} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={gymnodinium} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={zoothamnium} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={tintinnopsis} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={favelia} alt="" /></th>
                  <th className="border border-black p-0.5 text-xs"><img className="w-12 h-12" src={coscinodiscus} alt="" /></th>
                  {/* <th className="border border-black p-0.5 text-xs">Microcystis</th> */}


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