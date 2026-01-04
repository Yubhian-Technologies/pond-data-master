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

// All image imports (Logic & Content unchanged)
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
  const [locationDetails, setLocationDetails] = useState({
    address: "",
    email: "",
    contactNumber: "",
  });

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId || !locationId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const q = query(invoicesRef, where("id", "==", invoiceId));
        const invoiceSnap = await getDocs(q);

        if (invoiceSnap.empty) {
          setLoading(false);
          return;
        }

        const invoiceDoc = invoiceSnap.docs[0];
        const invoiceData = invoiceDoc.data();
        const waterType = invoiceData.sampleType?.find((s: any) => s.type?.toLowerCase() === "water");
        const waterCount = waterType?.count || allSampleCount || 1;

        setFormData({
          farmerName: invoiceData.farmerName || "-",
          mobile: invoiceData.farmerPhone || "-",
          sdDoc: invoiceData.dateOfCulture || invoiceData.sdDoc || "-",
          sampleCollectionTime: invoiceData.sampleCollectionTime || "-",
          sampleTime: invoiceData.sampleTime || "-",
          reportTime: invoiceData.reportTime || new Date().toTimeString().slice(0, 5),
          farmerUID: invoiceData.farmerUID || invoiceData.farmerId || "-",
          sourceOfWater: invoiceData.sourceOfWater || "-",
          sampleDate: invoiceData.sampleDate || "-",
          farmerAddress: invoiceData.farmerAddress || "-",
          noOfSamples: waterCount.toString(),
          reportDate: invoiceData.reportDate || new Date().toISOString().split("T")[0],
          technicianName: invoiceData.technicianName || "",
        });

        const samplesCollection = collection(db, "locations", locationId, "invoices", invoiceId, "water_reports");
        const samplesSnap = await getDocs(samplesCollection);
        const pondList: Pond[] = [];

        for (let i = 1; i <= waterCount; i++) {
          const sampleDoc = samplesSnap.docs.find(d => d.id === `sample_${i}`);
          const data = sampleDoc?.data() || {};
          pondList.push({
            id: i,
            pondNo: data.pondNo || `Pond ${i}`,
            pH: data.pH || "-",
            salinity: data.salinity || "-",
            co3: data.co3 || "-",
            hco3: data.hco3 || "-",
            alkalinity: data.alkalinity || "-",
            hardness: data.hardness || "-",
            ca: data.ca || "-",
            mg: data.mg || "-",
            na: data.na || "-",
            k: data.k || "-",
            totalAmmonia: data.totalAmmonia || "-",
            unionizedAmmonia: data.unionizedAmmonia || "-",
            h2s: data.h2s || "-",
            nitrite: data.nitrite || "-",
            nitrate: data.nitrate || "-",
            iron: data.iron || "-",
            chlorine: data.chlorine || "-",
            dissolvedOxygen: data.dissolvedOxygen || "-",
            totalDissolvedMatter: data.totalDissolvedMatter || "-",
            yellowColonies: data.yellowColonies || "-",
            greenColonies: data.greenColonies || "-",
            tpc: data.tpc || "-",
            phacus: data.phacus || "-",
            chlorella: data.chlorella || "-",
            desmids: data.desmids || "-",
            scenedesmus: data.scenedesmus || "-",
            copepod: data.copepod || "-",
            rotifer: data.rotifer || "-",
            nauplius: data.nauplius || "-",
            spirulina: data.spirulina || "-",
            chaetoceros: data.chaetoceros || "-",
            skeletonema: data.skeletonema || "-",
            rhizosolenia: data.rhizosolenia || "-",
            anabaena: data.anabaena || "-",
            oscillatoria: data.oscillatoria || "-",
            microcystis: data.microcystis || "-",
            coscinodiscus: data.coscinodiscus || "-",
            nitzchia: data.nitzchia || "-",
            navicula: data.navicula || "-",
            noctiluca: data.noctiluca || "-",
            ceratium: data.ceratium || "-",
            dinophysis: data.dinophysis || "-",
            gymnodinium: data.gymnodinium || "-",
            zoothamnium: data.zoothamnium || "-",
            tintinnopsis: data.tintinnopsis || "-",
            favella: data.favella || "-",
          });
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

      <div id="report" className="bg-white p-4 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
          <div className="w-32 h-24 flex items-center justify-center">
            <img src={ADC} alt="ADC" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-blue-700">WATERBASE AQUA DIAGNOSTIC CENTER</h1>
            <p className="text-[10px] text-black font-semibold">{locationDetails.address}</p>
            <p className="text-xs text-black">Contact No: {locationDetails.contactNumber} | Mail Id: {locationDetails.email}</p>
            <h2 className="text-xl font-bold mt-1 text-red-600 uppercase">Water Quality Report</h2>
          </div>
          <div className="w-32 h-24 flex items-center justify-center">
            <img src={AV} alt="AV" className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        <div className="text-right mb-1">
          <span className="font-bold text-xs text-black">Report Id:- {invoiceId || "-"}</span>
        </div>

        {/* Farmer Info Grid */}
        <div className="grid grid-cols-10 text-[11px] mb-3 border border-black border-collapse">
          <div className="col-span-1 border-r border-black p-1 font-bold bg-gray-100">Farmer Name</div>
          <div className="col-span-2 border-r border-black p-1">{formData.farmerName}</div>
          <div className="col-span-1 border-r border-black p-1 font-bold bg-gray-100">Mobile</div>
          <div className="col-span-1 border-r border-black p-1">{formData.mobile}</div>
          <div className="col-span-1 border-r border-black p-1 font-bold bg-gray-100">S.D/D.O.C:</div>
          <div className="col-span-1 border-r border-black p-1">{formData.sdDoc}</div>
          <div className="col-span-2 border-r border-black p-1 font-bold bg-gray-100">Sample Collection Time</div>
          <div className="col-span-1 p-1">{formData.sampleCollectionTime}</div>

          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Farmer UID</div>
          <div className="col-span-2 border-t border-r border-black p-1">{formData.farmerUID}</div>
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Source</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.sourceOfWater}</div>
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Sample Date</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.sampleDate}</div>
          <div className="col-span-2 border-t border-r border-black p-1 font-bold bg-gray-100">Sample Time</div>
          <div className="col-span-1 border-t border-black p-1">{formData.sampleTime}</div>

          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Address</div>
          <div className="col-span-2 border-t border-r border-black p-1">{formData.farmerAddress}</div>
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">No. of Samples</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.noOfSamples}</div>
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Report Date</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.reportDate}</div>
          <div className="col-span-2 border-t border-r border-black p-1 font-bold bg-gray-100">Report Time</div>
          <div className="col-span-1 border-t border-black p-1">{formData.reportTime}</div>
        </div>

        {/* ANALYSIS SECTION - PERFECTLY JOINED SIDE BY SIDE */}
        <div className="flex flex-row w-full mb-4 border border-black overflow-hidden">
          {/* WATER ANALYSIS */}
          <div className="flex-[8.5] border-r border-black">
            <h4 className="text-center font-bold text-[12px] bg-gray-200 border-b border-black py-1 text-red-600">WATER ANALYSIS</h4>
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-100 font-bold">
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Pond</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>pH</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Sal</td>
                  <td className="border-r border-black p-0.5 text-center" colSpan={2}>Alkalinity</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Total Alk</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Hard</td>
                  <td className="border-r border-black p-0.5 text-center" colSpan={4}>Minerals (ppm)</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>NH₃</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>U.NH₃</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>H₂S</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>NO₂</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>NO₃</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Fe</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>Cl</td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={2}>DO</td>
                  <td className="p-0.5 text-center" rowSpan={2}>TDM</td>
                </tr>
                <tr className="bg-gray-100 border-t border-black text-[10px]">
                  <td className="border-r border-black p-0.5 text-center font-bold">CO₃</td>
                  <td className="border-r border-black p-0.5 text-center font-bold">HCO₃</td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Ca</td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Mg</td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Na</td>
                  <td className="border-r border-black p-0.5 text-center font-bold">K</td>
                </tr>
              </thead>
              <tbody>
                {ponds.map(p => (
                  <tr key={p.id} className="border-t border-black">
                    <td className="border-r border-black p-0.5 text-center font-bold bg-gray-50">{p.pondNo}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.pH}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.salinity}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.co3}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.hco3}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.alkalinity}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.hardness}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.ca}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.mg}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.na}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.k}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.totalAmmonia}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.unionizedAmmonia}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.h2s}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.nitrite}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.nitrate}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.iron}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.chlorine}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.dissolvedOxygen}</td>
                    <td className="p-0.5 text-center">{p.totalDissolvedMatter}</td>
                  </tr>
                ))}
                <tr className="border-t border-black font-bold bg-gray-50 text-[11px] text-red-600">
                  <td className="border-r border-black p-0.5">Optimum</td>
                  <td className="border-r border-black p-0.5 text-center">7.5-8.5</td>
                  <td className="border-r border-black p-0.5 text-center">15-20</td>
                  <td className="border-r border-black p-0.5 text-center">20-40</td>
                  <td className="border-r border-black p-0.5 text-center">30-150</td>
                  <td className="border-r border-black p-0.5 text-center">175-200</td>
                  <td className="border-r border-black p-0.5 text-center">3000-5000</td>
                  <td className="border-r border-black p-0.5 text-center">&gt;100</td>
                  <td className="border-r border-black p-0.5 text-center">&gt;300</td>
                  <td className="border-r border-black p-0.5 text-center">&gt;40</td>
                  <td className="border-r border-black p-0.5 text-center">&gt;10</td>
                  <td className="border-r border-black p-0.5 text-center">0.1-1.0</td>
                  <td className="border-r border-black p-0.5 text-center">0-0.1</td>
                  <td className="border-r border-black p-0.5 text-center">0-0.4</td>
                  <td className="border-r border-black p-0.5 text-center">&lt;0.25</td>
                  <td className="border-r border-black p-0.5 text-center">&lt;0.50</td>
                  <td className="border-r border-black p-0.5 text-center">&lt;0.1</td>
                  <td className="border-r border-black p-0.5 text-center">0-0.02</td>
                  <td className="border-r border-black p-0.5 text-center">&gt;4</td>
                  <td className="p-0.5 text-center">40-70</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* BACTERIOLOGY - FULLY BORDERED & ALIGNED */}
          <div className="flex-[1.5]">
            <h4 className="text-center font-bold text-[10px] bg-gray-200 border-b border-black py-1 text-red-600">BACTERIOLOGY</h4>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-gray-100 font-bold">
                  <td className="border-b border-black text-center py-[6px]" colSpan={3}>Vibrio CFU /ml</td>
                </tr>
                <tr className="bg-gray-100 text-[11px] font-bold">
                  <td className="border-r border-black p-0.5 text-center">Yellow</td>
                  <td className="border-r border-black p-0.5 text-center">Green</td>
                  <td className="p-0.5 text-center">TPC</td>
                </tr>
              </thead>
              <tbody>
                {ponds.map(p => (
                  <tr key={p.id} className="border-t border-black">
                    <td className="border-r border-black p-0.5 text-center">{p.yellowColonies}</td>
                    <td className="border-r border-black p-0.5 text-center">{p.greenColonies}</td>
                    <td className="p-0.5 text-center">{p.tpc}</td>
                  </tr>
                ))}
                <tr className="border-t border-black font-bold text-[8px] text-red-600 bg-gray-50">
                  <td className="border-r border-black p-0.5 text-center">&lt;300</td>
                  <td className="border-r border-black p-0.5 text-center">&lt;10</td>
                  <td className="p-0.5 text-center">&lt;300</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PLANKTON ANALYSIS */}
        <div className="border border-black mb-4">
          <h3 className="text-center font-bold bg-white text-red-500 py-1 text-xs border-b border-black uppercase">PLANKTON ANALYSIS</h3>
          <div className="overflow-hidden">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-r border-b border-black p-1 w-10">Pond</th>
                  <th className="border-r border-b border-black p-0.5 text-green-700 text-[11px]" colSpan={11}>USEFUL PLANKTON - ఉపయోగకరమైన పలాంక్టన్లు</th>
                  <th className="border-b border-black p-0.5 text-red-700 text-[11px]" colSpan={14}>HARMFUL PLANKTON - హానికరమైన పలాంక్టన్లు</th>
                </tr>
                <tr className="bg-gray-50 text-[9px] border-b border-black">
                  <th className="border-r border-black"></th>
                  <th className="border-r border-black" colSpan={4}>Phyto Plankton</th>
                  <th className="border-r border-black" colSpan={3}>Zooplankton</th>
                  <th className="border-r border-black">B.G Algae</th>
                  <th className="border-r border-black" colSpan={3}>Diatom</th>
                  <th className="border-r border-black" colSpan={3}>Blue Green Algae</th>
                  <th className="border-r border-black" colSpan={3}>Diatom</th>
                  <th className="border-r border-black" colSpan={4}>Dinoflagellate</th>
                  <th className="" colSpan={3}>Protozoa</th>
                </tr>
                <tr className="bg-white">
                  <th className="border-r border-b border-black"></th>
                  {[phacus, corrella, desmids, scenedesmus, copepod, rotifer, nauplius, spirulina, chaetoceros, skeletonema, rhizosolenia, anabaena, oscillatoria, microcystis, coscinodiscus, nitzchia, navicula, noctiluca, ceratium, dinophysis, gymnodinium, zoothamnium, tintinnopsis, favella].map((img, idx) => (
                    <th key={idx} className={`border-b border-black ${idx === 23 ? "" : "border-r"} p-0.5`}>
                      <img className="w-8 h-8 mx-auto" src={img} alt="plankton" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id} className="border-b border-black last:border-b-0">
                    <td className="border-r border-black p-1 text-center font-bold bg-gray-50">{pond.pondNo}</td>
                    {[pond.phacus, pond.chlorella, pond.desmids, pond.scenedesmus, pond.copepod, pond.rotifer, pond.nauplius, pond.spirulina, pond.chaetoceros, pond.skeletonema, pond.rhizosolenia, pond.anabaena, pond.oscillatoria, pond.microcystis, pond.coscinodiscus, pond.nitzchia, pond.navicula, pond.noctiluca, pond.ceratium, pond.dinophysis, pond.gymnodinium, pond.zoothamnium, pond.tintinnopsis, pond.favella].map((val, idx) => (
                      <td key={idx} className={`text-center ${idx === 23 ? "" : "border-r"} border-black p-1`}>{val || "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        <div className="mb-4 border border-black p-2">
          <h4 className="font-bold text-xs mb-1">Remarks & Recommendations:</h4>
          <div className="min-h-[40px] border-t border-dashed border-gray-400 mt-1"></div>
        </div>

        {/* Footer Signatures */}
        <div className="flex justify-between items-center border-t border-black pt-4">
          <p className="font-bold text-xs">Reported by: {formData.technicianName || "________________"}</p>
          <p className="font-bold text-xs">Checked by: ________________</p>
        </div>

        <div className="mt-2 text-[9px] italic text-gray-600 leading-tight">
          <p>Note: The Samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose, Not for any Litigation.</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.2cm;
          }
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
};

export default WaterReport;