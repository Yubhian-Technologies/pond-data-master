import React, { useEffect, useState } from "react";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  setDoc, 
  where 
} from "firebase/firestore";
import { db } from "../../pages/firebase";
import { useNavigate } from "react-router-dom";

interface FarmerInfo {
  farmerName: string;
  village: string;
  mobile: string;
  sampleDate: string;
  sampleTime: string;
  reportDate: string;
  reportTime: string;
  farmerId: string;
}

interface PLFormProps {
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function PLForm({
  invoiceId,
  locationId,
  onSubmit,
}: PLFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  /* ---------- helpers ---------- */
  const createEmptyArray = (length: number) =>
    Array.from({ length }, () => "");

  const normalizeArray = (arr: string[] = [], length: number) =>
    Array.from({ length }, (_, i) => arr[i] ?? "");

  const [localInvoice, setLocalInvoice] = useState<any>(null);

  // Get total PL sample count from invoice
  const totalSamples =
    Number(
      localInvoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "pl")?.count || 1
    );

  /* ---------- empty structure ---------- */
  const emptyPLData = {
    testCode: createEmptyArray(totalSamples),
    rostralSpines: createEmptyArray(totalSamples),
    avgLength: createEmptyArray(totalSamples),
    plAge: createEmptyArray(totalSamples),
    sizeVariation: createEmptyArray(totalSamples),
    mgr: createEmptyArray(totalSamples),
    mgrPercent: createEmptyArray(totalSamples),
    hp: createEmptyArray(totalSamples),
    shg: createEmptyArray(totalSamples),
    necAppend: createEmptyArray(totalSamples),
    necRostrum: createEmptyArray(totalSamples),
    necGill: createEmptyArray(totalSamples),
    necMuscle: createEmptyArray(totalSamples),
    foulAppend: createEmptyArray(totalSamples),
    foulGill: createEmptyArray(totalSamples),
    foulAbdomen: createEmptyArray(totalSamples),
    stressTankSalinity: createEmptyArray(totalSamples),
    salinityPercent: createEmptyArray(totalSamples),
    totalScore: createEmptyArray(totalSamples),
  };

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo>({
    farmerName: "",
    village: "",
    mobile: "",
    sampleDate: today,
    sampleTime: "",
    reportDate: today,
    reportTime: currentTime,
    farmerId: "",
  });

  const [plData, setPlData] = useState<any>(emptyPLData);
  const [loading, setLoading] = useState(true);

  const [sampleType, setSampleType] = useState<string>("PL (Post Larvae)");

  // Read-only display field
  const [farmerUID, setFarmerUID] = useState<string>("");

 // Pre-fill from invoice + load saved report data
useEffect(() => {
  const loadData = async () => {
    if (!localInvoice) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Compute dates/times INSIDE the effect (stable!)
      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toTimeString().slice(0, 5);

      // Step 1: Always pre-fill from invoice/farmer master
      let loadedFarmerId = "";
      if (localInvoice?.farmerId) {
        const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
        const farmerSnap = await getDoc(farmerRef);
        if (farmerSnap.exists()) {
          const farmerData = farmerSnap.data();
          loadedFarmerId = farmerData.farmerId || "";
          setFarmerUID(loadedFarmerId);

          setFarmerInfo(prev => ({
            ...prev,
            farmerName: farmerData.name || prev.farmerName || "",
            village: farmerData.city || prev.village || "",
            mobile: farmerData.phone || prev.mobile || "",
            sampleDate: localInvoice.dateOfCulture || today,
            farmerId: loadedFarmerId,
          }));
        }
      }

      // Step 2: Load saved PL report data (overrides if exists)
      const plReportRef = doc(
        db,
        "locations",
        locationId,
        "invoices",
        localInvoice.docId,
        "plReports",
        "data"
      );

      const snap = await getDoc(plReportRef);

      if (snap.exists()) {
        const data = snap.data() || {};

        if (data.farmerInfo) {
          setFarmerInfo({
            farmerName: data.farmerInfo.farmerName || farmerInfo.farmerName,
            village: data.farmerInfo.village || farmerInfo.village,
            mobile: data.farmerInfo.mobile || farmerInfo.mobile,
            sampleDate: data.farmerInfo.sampleDate || localInvoice?.dateOfCulture || today,
            sampleTime: data.farmerInfo.sampleTime || "",
            reportDate: data.farmerInfo.reportDate || today,
            reportTime: data.farmerInfo.reportTime || currentTime,
            farmerId: data.farmerInfo.farmerId || loadedFarmerId || "",
          });
        }

        if (data.sampleType) {
          setSampleType(data.sampleType);
        }

        const savedPlData = data.plData || {};
        const normalized: any = {};

        Object.keys(emptyPLData).forEach((key) => {
          normalized[key] = normalizeArray(savedPlData[key], totalSamples);
        });

        setPlData(normalized);
      }

    } catch (error) {
      console.error("Error loading PL data:", error);
      setPlData(emptyPLData);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [localInvoice, locationId]);  

  // Pre-fill from invoice + load saved report data
  useEffect(() => {
    const loadData = async () => {
      if (!localInvoice) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Step 1: Always pre-fill from invoice (runs on first load)
        let loadedFarmerId = "";
        if (localInvoice?.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data();
            loadedFarmerId = farmerData.farmerId || "";
            setFarmerUID(loadedFarmerId);

            // Pre-fill basic info from farmer master + invoice
            setFarmerInfo(prev => ({
              ...prev,
              farmerName: farmerData.name || prev.farmerName || "",
              village: farmerData.city || prev.village || "",
              mobile: farmerData.phone || prev.mobile || "",
              sampleDate: localInvoice.dateOfCulture || today,
              farmerId: loadedFarmerId,
            }));
          }
        }

        // Step 2: Load saved PL report data (overrides pre-fill if exists)
        const plReportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          localInvoice.docId,
          "plReports",
          "data"
        );

        const snap = await getDoc(plReportRef);

        if (snap.exists()) {
          const data = snap.data() || {};

          if (data.farmerInfo) {
            setFarmerInfo({
              farmerName: data.farmerInfo.farmerName || farmerInfo.farmerName,
              village: data.farmerInfo.village || farmerInfo.village,
              mobile: data.farmerInfo.mobile || farmerInfo.mobile,
              sampleDate: data.farmerInfo.sampleDate || localInvoice?.dateOfCulture || today,
              sampleTime: data.farmerInfo.sampleTime || "",
              reportDate: data.farmerInfo.reportDate || today,
              reportTime: data.farmerInfo.reportTime || currentTime,
              farmerId: data.farmerInfo.farmerId || loadedFarmerId || "",
            });
          }

          if (data.sampleType) {
            setSampleType(data.sampleType);
          }

          const savedPlData = data.plData || {};
          const normalized: any = {};

          Object.keys(emptyPLData).forEach((key) => {
            normalized[key] = normalizeArray(savedPlData[key], totalSamples);
          });

          setPlData(normalized);
        }

      } catch (error) {
        console.error("Error loading PL data:", error);
        setPlData(emptyPLData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [localInvoice, locationId, today, currentTime]);

  /* ---------- Update individual cell ---------- */
  const updateColumn = (field: string, index: number, value: string) => {
    setPlData((prev: any) => {
      const copy = [...prev[field]];
      copy[index] = value;
      return { ...prev, [field]: copy };
    });
  };

  /* ---------- Save all data ---------- */
  const handleSave = async () => {
    if (!invoiceId || !locationId || !localInvoice?.docId) {
      alert("Cannot save: Invoice not loaded or missing ID");
      return;
    }

    try {
      const plReportRef = doc(
        db,
        "locations",
        locationId,
        "invoices",
        localInvoice.docId,
        "plReports",
        "data"
      );

      await setDoc(
        plReportRef,
        {
          farmerInfo,
          plData,
          totalSamples,
          sampleType,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      onSubmit();
    } catch (error) {
      console.error("Error saving PL report:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const plRows: { label: string; key: keyof typeof emptyPLData }[] = [
    { label: "Test Code", key: "testCode" },
    { label: "Rostral Spines", key: "rostralSpines" },
    { label: "Avg Length (mm)", key: "avgLength" },
    { label: "PL Age", key: "plAge" },
    { label: "Size Variation (%)", key: "sizeVariation" },
    { label: "MGR", key: "mgr" },
    { label: "MGR %", key: "mgrPercent" },
    { label: "HP - F/S", key: "hp" },
    { label: "SHG", key: "shg" },
    { label: "Necrosis - Append", key: "necAppend" },
    { label: "Necrosis - Rostrum", key: "necRostrum" },
    { label: "Necrosis - Gill", key: "necGill" },
    { label: "Necrosis - Muscle", key: "necMuscle" },
    { label: "Fouling - Append", key: "foulAppend" },
    { label: "Fouling - Gill", key: "foulGill" },
    { label: "Fouling - Abdomen", key: "foulAbdomen" },
    { label: "Stress Tank Salinity", key: "stressTankSalinity" },
    { label: "Salinity Test %", key: "salinityPercent" },
    { label: "Total Score", key: "totalScore" },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading PL report data...
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">
        PL Health Check Report – All Samples ({totalSamples})
      </h1>

      {/* Farmer Information */}
      <section className="mb-10 bg-gray-50 p-5 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Farmer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Name</label>
            <input
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={farmerInfo.farmerName}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, farmerName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
            <input
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.village}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, village: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.mobile}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, mobile: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farmer UID</label>
            <input
              className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              value={farmerUID}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 p-2 rounded bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={farmerInfo.sampleDate}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={farmerInfo.reportDate}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, reportDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Time</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              value={farmerInfo.reportTime}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. of Samples</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              value={totalSamples}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              placeholder="e.g. PL (Post Larvae)"
            />
          </div>
        </div>
      </section>

      {/* PL Test Values Table */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-5 text-gray-800">PL Test Parameters</h2>

        {plRows.map((row) => (
          <div key={row.key as string} className="mb-7">
            <label className="font-semibold text-sm block mb-3 text-gray-700">
              {row.label}
            </label>

            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${totalSamples}, minmax(120px, 1fr))`,
              }}
            >
              {plData[row.key].map((value: string, i: number) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 text-center">{i + 1}</span>
                  <input
                    className="border border-gray-300 p-3 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`S${i + 1}`}
                    value={value}
                    onChange={(e) =>
                      updateColumn(row.key as string, i, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Submit Button */}
      <section className="text-center">
        <button
          onClick={handleSave}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Save PL Report & Continue
        </button>
      </section>
    </div>
  );
}