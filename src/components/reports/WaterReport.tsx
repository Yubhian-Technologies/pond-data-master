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
import brachionus from "@/assets/PLANKTON ANALYSIS IMAGES/1. Useful/4.ZOOPLANKTON/4-Brachionus.jpg";
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
  brachionus: string;
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

  const [remarksAndRecommendations, setRemarksAndRecommendations] = useState<string>("");

  const [realInvoiceDocId, setRealInvoiceDocId] = useState<string | null>(null);

  const handlePrint = () => window.print();

  // Fetch real invoice docId
  useEffect(() => {
    const fetchInvoiceDocId = async () => {
      if (!invoiceId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");

        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(invoicesRef, where("id", "==", invoiceId));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setRealInvoiceDocId(docSnap.id);
          console.log("WaterReport - Found real docId:", docSnap.id);
        } else {
          console.error("WaterReport - Invoice not found for:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice docId:", err);
      }
    };

    fetchInvoiceDocId();
  }, [invoiceId, locationId]);

  // Fetch data using real docId
  useEffect(() => {
    const fetchData = async () => {
      if (!realInvoiceDocId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Invoice header info
        const invoiceDocRef = doc(db, "locations", locationId, "invoices", realInvoiceDocId);
        const invoiceSnap = await getDoc(invoiceDocRef);

        if (invoiceSnap.exists()) {
          const invoiceData = invoiceSnap.data();
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
        }

        // Water samples
        const samplesCollection = collection(
          db,
          "locations",
          locationId,
          "invoices",
          realInvoiceDocId,
          "water_reports"
        );
        const samplesSnap = await getDocs(samplesCollection);
        const pondList: Pond[] = [];

        let loadedRemarks = "";

        for (let i = 1; i <= (allSampleCount || 1); i++) {
          const sampleDoc = samplesSnap.docs.find(d => d.id === `sample_${i}`);
          const data = sampleDoc?.data() || {};

          if (data.remarksAndRecommendations && !loadedRemarks) {
            loadedRemarks = data.remarksAndRecommendations;
          }

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
            brachionus: data.brachionus || "-",
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
        setRemarksAndRecommendations(loadedRemarks);
      } catch (error) {
        console.error("Error loading water report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (realInvoiceDocId) {
      fetchData();
    }
  }, [realInvoiceDocId, locationId, allSampleCount]);

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
          onClick={() => window.print()}
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
          </div>
          <div className="w-32 h-24 flex items-center justify-center">
            <img src={AV} alt="AV" className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        <div className="text-center flex-1 m-5">
          <h2 className="text-xl font-bold mt-1 text-red-600 uppercase">Water Quality Report</h2>
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
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Address</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.farmerAddress}</div>
          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Sample Date</div>
          <div className="col-span-1 border-t border-r border-black p-1">{formData.sampleDate}</div>
          <div className="col-span-2 border-t border-r border-black p-1 font-bold bg-gray-100">Source</div>
          <div className="col-span-1 border-t border-black p-1">{formData.sourceOfWater}</div>

          <div className="col-span-1 border-t border-r border-black p-1 font-bold bg-gray-100">Report Id</div>
          <div className="col-span-2 border-t border-r border-black p-1">{invoiceId || "-"}</div>
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
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Pond<br/><span className="text-[9px]"></span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>pH<br/><span className="text-[9px]">pH</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Salinity<br/><span className="text-[9px]">సాలినిటీ</span></td>
                  <td className="border-r border-black p-0.5 text-center" colSpan={3}>Alkalinity(PPM as Caco3)<br/><span className="text-[9px]">ఆల్కలినిటీ</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Total Hardness<br/><span className="text-[9px]">మొత్తం కఠినత</span></td>
                  <td className="border-r border-black p-0.5 text-center" colSpan={4}>Minerals (ppm)<br/><span className="text-[9px]">PPM as Caco3</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Total NH3-NH4<br/><span className="text-[9px]">అమ్మోనియా</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Unionized NH₃<br/><span className="text-[9px]">యూనియనైజ్డ్ అమ్మోనియా</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>H₂S<br/><span className="text-[9px]">హైడ్రోజన్ సల్ఫైడ్</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>NO₂<br/><span className="text-[9px]">నైట్రైట్</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>NO₃<br/><span className="text-[9px]">నైట్రేట్</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Fe<br/><span className="text-[9px]">ఇనుము</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>Cl<br/><span className="text-[9px]">క్లోరిన్</span></td>
                  <td className="border-r border-black p-0.5 text-center" rowSpan={3}>DO<br/><span className="text-[9px]">డిసాల్వ్డ్ ఆక్సిజన్</span></td>
                  <td className="p-0.5 text-center" rowSpan={3}>TOM<br/><span className="text-[9px]">Total Organic Matter</span></td>
                </tr>
                <tr className="bg-gray-100 border-t border-black text-[10px]">
                  <td className="border-r border-black p-0.5 text-center font-bold">CO₃<br/><span className="text-[9px]">కార్బొనేట్</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">HCO₃<br/><span className="text-[9px]">బైకార్బొనేట్</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Total <br/><span className="text-[9px]">మొత్తం</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Ca<br/><span className="text-[9px]">కాల్షియం</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Mg<br/><span className="text-[9px]">మెగ్నీషియం</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">Na<br/><span className="text-[9px]">సోడియం</span></td>
                  <td className="border-r border-black p-0.5 text-center font-bold">K<br/><span className="text-[9px]">పొటాషియం</span></td>
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
                  <td className="border-r border-black p-0.5 text-center">Yellow <br />Colonies <br /> <span className="text-[9px]">పసుపు కాలనీలు</span></td>
                  <td className="border-r border-black p-0.5 text-center">Green <br />Colonies <br /><span className="text-[9px]">పచ్చ కాలనీలు</span></td>
                  <td className="p-0.5 text-center">TPC <br /><span className="text-[8px]">Total Plate Count</span></td>
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
                <tr className="border-t border-black font-bold text-[10px] text-red-600 bg-gray-50">
                  <td className="border-r border-black p-0.5 text-center">&lt;300</td>
                  <td className="border-r border-black p-0.5 text-center">&lt;10</td>
                  <td className="p-0.5 text-center">&lt;300</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PLANKTON ANALYSIS - YOUR ORIGINAL IMAGES & NAMES RESTORED */}
        <div className="border border-black mb-4">
          <h3 className="text-center font-bold bg-white text-red-500 py-1 text-xs border-b border-black uppercase">PLANKTON ANALYSIS</h3>
          <div className="overflow-hidden">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-r border-b border-black p-1 w-10">Pond</th>
                  <th className="border-r border-b border-black p-0.5 text-green-700 text-[11px]" colSpan={11}>USEFUL PLANKTON - ఉపయోగకరమైన ప్లవకములు</th>
                  <th className="border-b border-black p-0.5 text-red-700 text-[11px]" colSpan={14}>HARMFUL PLANKTON - హానికరమైన ప్లవకములు</th>
                </tr>
                <tr className="bg-gray-50 text-[10px] border-b border-black">
                  <th className="border-r border-black"></th>
                  <th className="border-r border-black" colSpan={4}>Green alge</th>
                  <th className="border-r border-black" colSpan={4}>Zooplankton</th>
                  <th className="border-r border-black">B.G Algae</th>
                  <th className="border-r border-black" colSpan={3}>Diatom</th>
                  <th className="border-r border-black" colSpan={3}>Blue Green Algae</th>
                  <th className="border-r border-black" colSpan={3}>Diatom</th>
                  <th className="border-r border-black" colSpan={4}>Dinoflagellate</th>
                  <th className="" colSpan={3}>Protozoa</th>
                </tr>
                <tr className="bg-white">
                  <th className="border-r border-b border-black"></th>

                  {[
                    { img: phacus, name: "Oosystis" },
                    { img: corrella, name: "Chlorella" },
                    { img: desmids, name: "Eudorina" },
                    { img: scenedesmus, name: "Scenedesmus" },
                    { img: copepod, name: "Copepod" },
                    { img: rotifer, name: "Rotifer" },
                    { img: nauplius, name: "Nauplius" },
                    { img: brachionus, name: "Brachionus" },
                    { img: spirulina, name: "Spirulina" },
                    { img: chaetoceros, name: "Chaetoceros" },
                    { img: skeletonema, name: "Skeletonema" },
                    { img: rhizosolenia, name: "Rhizosolenia" },
                    { img: anabaena, name: "Anabaena" },
                    { img: oscillatoria, name: "Oscillatoria" },
                    { img: microcystis, name: "Microcystis" },
                    { img: coscinodiscus, name: "Coscinodiscus" },
                    { img: nitzchia, name: "Nitzschia" },
                    { img: navicula, name: "Navicula" },
                    { img: noctiluca, name: "Noctiluca" },
                    { img: ceratium, name: "Ceratium" },
                    { img: dinophysis, name: "Dinophysis" },
                    { img: gymnodinium, name: "Gymnodinium" },
                    { img: zoothamnium, name: "Zoothamnium" },
                    { img: tintinnopsis, name: "Vorticella" },
                    { img: favella, name: "Favella" },
                  ].map((item, idx) => (
                    <th
                      key={idx}
                      className={`border-b border-black ${idx === 24 ? "" : "border-r"} p-1 text-center`}
                    >
                      <img className="w-6 h-6 mx-auto" src={item.img} alt={item.name} />
                      <div className="text-[7px] mt-1 leading-tight">{item.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ponds.map((pond) => (
                  <tr key={pond.id} className="border-b border-black last:border-b-0">
                    <td className="border-r border-black text-center font-bold bg-gray-50">{pond.pondNo}</td>
                    {[
                      pond.phacus,
                      pond.chlorella,
                      pond.desmids,
                      pond.scenedesmus,
                      pond.copepod,
                      pond.rotifer,
                      pond.nauplius,
                      pond.brachionus,
                      pond.spirulina,
                      pond.chaetoceros,
                      pond.skeletonema,
                      pond.rhizosolenia,
                      pond.anabaena,
                      pond.oscillatoria,
                      pond.microcystis,
                      pond.coscinodiscus,
                      pond.nitzchia,
                      pond.navicula,
                      pond.noctiluca,
                      pond.ceratium,
                      pond.dinophysis,
                      pond.gymnodinium,
                      pond.zoothamnium,
                      pond.tintinnopsis,
                      pond.favella,
                    ].map((val, idx) => (
                      <td
                        key={idx}
                        className={`text-center ${idx === 24 ? "" : "border-r"} border-black`}
                      >
                        {val || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks & Recommendations */}
        <div className="mb-4 border border-black p-2">
          <h4 className="font-bold text-xs mb-1">Remarks & Recommendations:</h4>
          <div className="min-h-[60px] mt-1 text-[11px] whitespace-pre-wrap">
            {remarksAndRecommendations || "No remarks provided."}
          </div>
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
            size: A4 landscape;
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