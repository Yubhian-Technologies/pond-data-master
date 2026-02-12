import React, { useState, useEffect } from "react";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "../../pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { useUserSession } from "@/contexts/UserSessionContext";

interface FarmerInfo {
  farmerName: string;
  address: string;
  mobile: string;
  sampleDate: string;
  sampleTime: string;
  reportDate: string;
  farmerId: string;
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
  showSignature?: boolean;
}

export default function PLReport({
  invoiceId,
  locationId,
  allSampleCount,
  showSignature = true,
}: PLReportProps) {
  const { session } = useUserSession();
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [plData, setPlData] = useState<PLData | null>(null);
  const [sampleType, setSampleType] = useState<string>("PL (Post Larvae)");
  const [checkedByName, setCheckedByName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    email: string;
    contactNumber: string;
  }>({
    address: "",
    email: "",
    contactNumber: "",
  });

  const [realInvoiceDocId, setRealInvoiceDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealDocId = async () => {
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
          console.log("PLReport - Found real docId:", docSnap.id);
        } else {
          console.error("PLReport - Invoice not found for:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice docId:", err);
      }
    };

    fetchRealDocId();
  }, [invoiceId, locationId]);

  useEffect(() => {
    const fetchPLReport = async () => {
      if (!realInvoiceDocId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const reportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          realInvoiceDocId,
          "plReports",
          "data"
        );

        const snap = await getDoc(reportRef);

        if (snap.exists()) {
          const data = snap.data() || {};

          const loadedSampleType = data.sampleType || "PL (Post Larvae)";
          setSampleType(loadedSampleType);

          const savedFarmerInfo = data.farmerInfo || {};
          setFarmerInfo({
            farmerName: savedFarmerInfo.farmerName || "-",
            address: savedFarmerInfo.address || "-",
            mobile: savedFarmerInfo.mobile || "-",
            sampleDate: savedFarmerInfo.sampleDate || "-",
            sampleTime: savedFarmerInfo.sampleTime || "-",
            reportDate: savedFarmerInfo.reportDate || new Date().toISOString().split("T")[0],
            farmerId: savedFarmerInfo.farmerId || "-",
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
            address: "-",
            mobile: "-",
            sampleDate: "-",
            sampleTime: "-",
            reportDate: new Date().toISOString().split("T")[0],
            farmerId: "-",
          });
        }

        const invoiceRef = doc(db, "locations", locationId, "invoices", realInvoiceDocId!);
        const invoiceSnap = await getDoc(invoiceRef);

        if (invoiceSnap.exists()) {
          const invoiceData = invoiceSnap.data();
          setCheckedByName(invoiceData.checkedBy || "______________________");
        } else {
          setCheckedByName("______________________");
        }
      } catch (err) {
        console.error("Error fetching PL report:", err);
      } finally {
        setLoading(false);
      }
    };

    if (realInvoiceDocId) {
      fetchPLReport();
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
    <div className="rounded-lg p-8 bg-white" id="pl-report">
      <div className="flex justify-between items-start mb-8 border-b-2 border-black">
        <img src={ADC} alt="ADC Logo" className="w-40 object-contain" />
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-blue-700">
            WATERBASE AQUA DIAGNOSTIC CENTER
          </h1>
          <p className="text-sm text-black font-semibold">{locationDetails.address || "Loading lab address..."}</p>
          <p className="text-sm text-black">
            Contact No: {locationDetails.contactNumber || "Loading..."} | 
            Mail Id: {locationDetails.email || "Loading..."}
          </p>
          <p className="text-sm text-black">
            GSTIN: - 37AABCT0601L1ZJ
          </p>
        </div>
        <img src={AV} alt="AV Logo" className="w-40 object-contain" />
      </div>

      <div className="w-full mb-12">
        <table className="w-full border-2 border-gray-800 text-sm table-fixed">
          <tbody>
            <tr>
              <td className="font-semibold bg-blue-100 border px-2 py-1">Farmer Name</td>
              <td className="border px-4 py-2">{farmerInfo.farmerName}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Address</td>
              <td className="border px-4 py-2">{farmerInfo.address}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Date</td>
              <td className="border px-4 py-2">{formatDateDDMMYYYY(farmerInfo.sampleDate)}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Report Id</td>
              <td className="border px-4 py-2">{invoiceId || '-'}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Mobile</td>
              <td className="border px-4 py-2">{farmerInfo.mobile}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Report Date</td>
              <td className="border px-4 py-2">{formatDateDDMMYYYY(farmerInfo.reportDate)}</td>
            </tr>
            <tr>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Farmer ID</td>
              <td className="border px-4 py-2">{farmerInfo.farmerId || '-'}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">No. of Samples</td>
              <td className="border px-4 py-2">{allSampleCount}</td>
              <td className="font-semibold bg-blue-100 border px-4 py-2">Sample Type</td>
              <td className="border px-4 py-2">{sampleType}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-center m-5">
        <h2 className="text-2xl font-bold text-red-600 mt-3">
          Post Larvae General Observation Report
        </h2>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <table className="inline-table border-2 border-gray-800 text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-blue-100">
              <th className="border px-2 py-1 font-semibold">TEST CODE</th>
              {plData.testCode.map((code, i) => (
                <th key={i} className="border px-2 py-1 font-semibold">
                  Tank - {code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plRows.map((row) => (
              <React.Fragment key={row.key}>
                <tr
                  className={row.key === "totalScore" ? "bg-blue-100" : ""}
                >
                  <td 
                    className={`border px-2 py-1 font-semibold ${
                      row.key === "totalScore" 
                        ? "bg-blue-100" 
                        : "bg-gray-50"
                    }`}
                  >
                    {row.label}
                  </td>
                  {plData[row.key].map((val, i) => (
  <td 
    key={i} 
    // Increased vertical padding to py-5 to physically stretch the table
    className={`border px-4 py-3 text-center font-medium text-xs ${
      row.key === "totalScore" ? "bg-blue-100" : ""  
    }`}
  >
    {val || "-"}
  </td>
))}
                </tr>

                {row.key === "shg" && (
                  <tr className="bg-blue-200">
                    <td className="border px-2 py-1 font-bold" colSpan={allSampleCount + 1}>
                      Necrosis
                    </td>
                  </tr>
                )}
                {row.key === "necMuscle" && (
                  <tr className="bg-blue-200">
                    <td className="border px-2 py-1 font-bold" colSpan={allSampleCount + 1}>
                      Fouling
                    </td>
                  </tr>
                )}
                {row.key === "foulAbdomen" && (
                  <tr className="bg-blue-200">
                    <td className="border px-2 py-1 font-bold" colSpan={allSampleCount + 1}>
                      Stress Test
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showSignature && (
        <>
          <div className="mt-20 border-t-2 border-black pt-8">
            <div className="flex justify-between text-sm px-10 mb-10">
              <div>
                <p className="font-semibold">Reported by:</p>
                <p className="mt-8 font-medium">{session?.technicianName || ""}</p>
              </div>
              <div>
                <p className="font-semibold">Checked by:</p>
                <p className="mt-8">{checkedByName}</p>
              </div>
            </div>
            <div className="text-center text-xs text-gray-700">
              <p>
                <strong>Note:</strong> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation.
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-800 mt-8">
            <p className="font-bold mb-2 text-red-600">Note:</p>
            <p className="mb-4">
              PL: Post Larve, MGR: Muscle Gut Ratio, SHG: Swollen Hind Gut, HP: Hepatopancreas, F: Full, S: Shrunken,
              FBI: Filamentous Bacterial Infection, PZ: Protozoal Infection, Infection Level: Light: &lt;10%, Moderate: 10 to 30%, Heavy:40%
            </p>

            <p className="font-bold mb-2 text-red-600">PL Quality Selection - Scoring</p>
            <p className="mb-4">
              <span className="text-red-600 font-bold">Rostral Spines:</span> 15 Points (&gt;4 Spines), Average Length: 10 points(&gt;11mm), Size Variation: 10 points (&lt;10%), Muscle Gut Ratio: 15 points (&gt;4:1
              Spine ), Hepatopancreas: 15 points (Full), Necrosis: 10 points (Absent) Fouling: 10 points (Absent), Swollen Hind Gut: 15 points (Absent)
            </p>

            <p className="mt-6">
              <span className="text-red-600 font-bold">Note:</span> The samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose. Not
            </p>
          </div>

          <div className="text-center mt-20">
            <p className="text-red-600 font-bold">TWL ADC committed for Complete farming Solutions</p>
          </div>
        </>
      )}
    </div>
  );
}