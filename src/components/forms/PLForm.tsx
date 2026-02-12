import React, { useEffect, useState, useMemo } from "react";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  setDoc, 
  updateDoc, 
  where 
} from "firebase/firestore";
import { db } from "../../pages/firebase";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../../contexts/UserSessionContext";

interface FarmerInfo {
  farmerName: string;
  address: string;
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
  const { session } = useUserSession();
  const technicianName = session?.technicianName || "";

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentTime = useMemo(() => new Date().toTimeString().slice(0, 5), []);

  /* ---------- helpers ---------- */
  const createEmptyArray = (length: number) =>
    Array.from({ length }, () => "");

  const normalizeArray = (arr: string[] = [], length: number) =>
    Array.from({ length }, (_, i) => arr[i] ?? "");

  const [localInvoice, setLocalInvoice] = useState<any>(null);
  const [totalSamples, setTotalSamples] = useState(1);

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
    address: "",
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

  const [farmerUID, setFarmerUID] = useState<string>("");

  const [checkedBy, setCheckedBy] = useState(technicianName);

  // Dropdown options for special fields
  const fieldOptions: Record<string, string[]> = {
    hp: ['Full', 'Shrink'],
    shg: ['Present', 'Absent'],
    necAppend: ['Absent'],
    necRostrum: ['Absent'],
    necGill: ['Absent'],
    necMuscle: ['Absent'],
    foulAppend: ['Absent'],     // ← Added: same behavior as necrosis
    foulGill: ['Absent'],       // ← Added
    foulAbdomen: ['Absent'],    // ← Added
    salinityPercent: ['100%', '90%', '80%'],
    sizeVariation: ['<5%', '<10%'],
    totalScore: Array.from({ length: 11 }, (_, i) => (90 + i).toString()),
  };

  const hasOthers: Record<string, boolean> = {
    hp: false,
    shg: false,
    necAppend: true,
    necRostrum: true,
    necGill: true,
    necMuscle: true,
    foulAppend: true,           // ← Added: enable "Others" for foulings
    foulGill: true,             // ← Added
    foulAbdomen: true,          // ← Added
    salinityPercent: true,
    sizeVariation: true,
    totalScore: true,
  };

  const [customModes, setCustomModes] = useState<Record<string, boolean[]>>({});

  // Fetch invoice
  useEffect(() => {
    if (!invoiceId || !locationId) return;

    const fetchInvoice = async () => {
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
          setLocalInvoice({ ...docSnap.data(), docId: docSnap.id });
          console.log("PLForm loaded invoice:", docSnap.id);
        } else {
          console.error("PLForm invoice not found:", invoiceId);
        }
      } catch (err) {
        console.error("PLForm invoice fetch error:", err);
      }
    };

    fetchInvoice();
  }, [invoiceId, locationId]);

  // Combined loading logic
  useEffect(() => {
    if (!localInvoice) return;

    const plType = localInvoice.sampleType?.find(
      (s: any) => s.type?.toLowerCase() === "pl"
    );
    const count = Number(plType?.count || 1);

    setTotalSamples(count);

    const loadData = async () => {
      setLoading(true);
      try {
        // Pre-fill farmer info
        let loadedFarmerId = "";
        if (localInvoice?.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data();
            loadedFarmerId = farmerData.farmerId || "";
            setFarmerUID(loadedFarmerId);

            setFarmerInfo((prev) => ({
              ...prev,
              farmerName: farmerData.name || prev.farmerName || "",
              address: farmerData.address || prev.address || "",
              mobile: farmerData.phone || prev.mobile || "",
              sampleDate: localInvoice.dateOfCulture || today,
              farmerId: loadedFarmerId,
            }));
          }
        }

        // Load saved PL report
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

        let finalPlData = { ...emptyPLData };

        if (snap.exists()) {
          const data = snap.data() || {};

          if (data.farmerInfo) {
            setFarmerInfo({
              farmerName: data.farmerInfo.farmerName || farmerInfo.farmerName,
              address: data.farmerInfo.address || farmerInfo.address,
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
            normalized[key] = normalizeArray(savedPlData[key] || [], count);
          });

          finalPlData = normalized;

          if (data.checkedBy) {
            setCheckedBy(data.checkedBy);
          }
        } else {
          const fresh: any = {};
          Object.keys(emptyPLData).forEach((key) => {
            fresh[key] = createEmptyArray(count);
          });
          finalPlData = fresh;
        }

        setPlData(finalPlData);

        // Initialize custom modes
        const initModes: Record<string, boolean[]> = {};
        Object.keys(fieldOptions).forEach((key) => {
          initModes[key] = Array(count).fill(false);
          finalPlData[key].forEach((val: string, idx: number) => {
            if (val && !fieldOptions[key].includes(val)) {
              initModes[key][idx] = true;
            }
          });
        });
        setCustomModes(initModes);

      } catch (error) {
        console.error("Error loading PL data:", error);
        const fallback: any = {};
        Object.keys(emptyPLData).forEach((key) => {
          fallback[key] = createEmptyArray(count);
        });
        setPlData(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [localInvoice, locationId]);

  const updateColumn = (field: string, index: number, value: string) => {
    setPlData((prev: any) => {
      const copy = [...prev[field]];
      copy[index] = value;
      return { ...prev, [field]: copy };
    });
  };

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
          checkedBy: checkedBy.trim() || technicianName || "N/A",
        },
        { merge: true }
      );

      const invoiceRef = doc(db, "locations", locationId, "invoices", localInvoice.docId);
      await updateDoc(invoiceRef, {
        checkedBy: checkedBy.trim() || technicianName || "N/A",
      });

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.address}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, address: e.target.value })}
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
              {plData[row.key].map((value: string, i: number) => {
                const fieldKey = row.key as string;
                if (fieldOptions[fieldKey]) {
                  const isCustom = customModes[fieldKey]?.[i] ?? false;
                  return (
                    <div key={i} className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1 text-center">{i + 1}</span>
                      {isCustom ? (
                        <div>
                          <input
                            className="w-full border border-gray-300 p-3 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Enter custom value`}
                            value={value}
                            onChange={(e) => updateColumn(fieldKey, i, e.target.value)}
                          />
                          <button
                            className="text-xs text-blue-600 underline mt-1 block mx-auto"
                            onClick={() => {
                              const newModes = { ...customModes };
                              newModes[fieldKey] = [...newModes[fieldKey]];
                              newModes[fieldKey][i] = false;
                              setCustomModes(newModes);
                              updateColumn(fieldKey, i, ''); // reset to empty when switching back
                            }}
                          >
                            Select from options
                          </button>
                        </div>
                      ) : (
                        <select
                          className="w-full border border-gray-300 p-3 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={value}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            if (newVal === 'Others' && hasOthers[fieldKey]) {
                              const newModes = { ...customModes };
                              newModes[fieldKey] = [...newModes[fieldKey]];
                              newModes[fieldKey][i] = true;
                              setCustomModes(newModes);
                              updateColumn(fieldKey, i, '');
                            } else {
                              updateColumn(fieldKey, i, newVal);
                            }
                          }}
                        >
                          <option value="">Select...</option>
                          {fieldOptions[fieldKey].map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          {hasOthers[fieldKey] && <option value="Others">Others</option>}
                        </select>
                      )}
                    </div>
                  );
                } else {
                  // Normal text input
                  return (
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
                  );
                }
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Checked by input */}
      <div className="mb-10 max-w-md mx-auto">
        <label className="block text-xl font-bold mb-4 text-gray-800">
          Checked by
        </label>
        <input
          type="text"
          value={checkedBy}
          onChange={(e) => setCheckedBy(e.target.value)}
          placeholder="Enter name of the person who checked the report"
          required
          className="w-full border border-gray-400 rounded px-4 py-3 text-base focus:border-blue-600 focus:outline-none"
        />
      </div>

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