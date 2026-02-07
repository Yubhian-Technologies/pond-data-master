import React, { useEffect, useState } from "react";
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
import { useUserSession } from "../../contexts/UserSessionContext";

interface FarmerInfo {
  farmerName: string;
  address: string;
  mobile: string;
  date: string;
  farmerId: string;
}

interface MicrobiologyFormProps {
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function MicrobiologyForm({
  invoiceId,
  locationId,
  onSubmit,
}: MicrobiologyFormProps) {
  const { session } = useUserSession();
  const technicianName = session?.technicianName || "";

  const today = new Date().toISOString().split("T")[0];

  const [localInvoice, setLocalInvoice] = useState<any>(null);

  const totalSamples =
    Number(
      localInvoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "microbiology")?.count || 0
    );

  const createEmptyArray = (length: number) =>
    Array.from({ length }, () => "");

  const normalizeArray = (arr: string[] = [], length: number) =>
    Array.from({ length }, (_, i) => arr[i] ?? "");

  const emptyMicrobiologyData = {
    testCode: createEmptyArray(totalSamples),
    yellowColonies: createEmptyArray(totalSamples),
    greenColonies: createEmptyArray(totalSamples),
    tpc: createEmptyArray(totalSamples),
  };

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo>({
    farmerName: "",
    address: "",  // ← Will be pre-filled from farmer master by default
    mobile: "",
    date: today,
    farmerId: "",
  });

  const [microbiologyData, setMicrobiologyData] = useState<any>(emptyMicrobiologyData);
  const [loading, setLoading] = useState(true);

  const [farmerUID, setFarmerUID] = useState<string>("");

  const [sampleType, setSampleType] = useState<string>("Microbiology");

  const [checkedBy, setCheckedBy] = useState(technicianName);

  const perSampleSelectedTests = localInvoice?.perSampleSelectedTests?.microbiology || {};

  const testNameMap: Record<string, string> = {
    yellowColonies: "Yellow Colonies",
    greenColonies: "Green Colonies",
    tpc: "Total Plate Count (TPC)",
    testCode: "Test Code",
  };

  // Mapping: which test IDs control which microbiology fields
  const testToFieldsMap: Record<string, (keyof typeof emptyMicrobiologyData)[]> = {
    micro_vibrio_plating: ["yellowColonies", "greenColonies"],
    micro_tpc: ["tpc"],
    // Add more if you have other microbiology test IDs
  };

  // Fetch invoice
  useEffect(() => {
    if (!locationId || !invoiceId) {
      console.warn("Missing locationId or invoiceId for invoice fetch");
      return;
    }

    const fetchInvoice = async () => {
      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");

        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          q = query(invoicesRef, where("id", "==", invoiceId));
          querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          const docId = docSnap.id;

          setLocalInvoice({ ...data, docId });
          console.log("Invoice loaded OK:", { 
            docId, 
            invoiceId: data.invoiceId || data.id || "unknown" 
          });
        } else {
          console.error("Invoice NOT FOUND for ID:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice in form:", err);
      }
    };

    fetchInvoice();
  }, [locationId, invoiceId]);

  // Pre-fill farmer data (address by default) + load saved report
  useEffect(() => {
    const loadData = async () => {
      if (!localInvoice) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // ALWAYS pre-fill from farmer master → address comes by default here
        let loadedFarmerId = "";
        if (localInvoice?.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmerData = farmerSnap.data();
            loadedFarmerId = farmerData.farmerId || "";
            setFarmerUID(loadedFarmerId);

            setFarmerInfo({
              farmerName: farmerData.name || "",
              address: farmerData.address || "",   // ← Address pre-filled by default from farmer master
              mobile: farmerData.phone || "",
              date: localInvoice.dateOfCulture || today,
              farmerId: loadedFarmerId,
            });
          }
        }

        // Load saved microbiology report (overrides default if exists)
        const reportRef = doc(
          db,
          "locations",
          locationId,
          "invoices",
          localInvoice.docId,
          "microbiologyReports",
          "data"
        );

        const snap = await getDoc(reportRef);

        if (snap.exists()) {
          const data = snap.data() || {};

          if (data.farmerInfo) {
            setFarmerInfo(prev => ({
              ...prev,
              farmerName: data.farmerInfo.farmerName || prev.farmerName,
              address: data.farmerInfo.address || prev.address,  // saved overrides default
              mobile: data.farmerInfo.mobile || prev.mobile,
              date: data.farmerInfo.date || prev.date,
              farmerId: data.farmerInfo.farmerId || prev.farmerId,
            }));
          }

          if (data.sampleType) {
            setSampleType(data.sampleType);
          }

          const savedData = data.microbiologyData || {};
          const normalized: any = {};

          Object.keys(emptyMicrobiologyData).forEach((key) => {
            normalized[key] = normalizeArray(savedData[key], totalSamples);
          });

          setMicrobiologyData(normalized);

          if (data.checkedBy) {
            setCheckedBy(data.checkedBy);
          }
        } else {
          setMicrobiologyData(emptyMicrobiologyData);
        }
      } catch (error) {
        console.error("Error loading microbiology data:", error);
        setMicrobiologyData(emptyMicrobiologyData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [localInvoice, locationId, today]);

  const updateColumn = (field: keyof typeof emptyMicrobiologyData, index: number, value: string) => {
    setMicrobiologyData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((val: string, i: number) => (i === index ? value : val)),
    }));
  };

  const handleSave = async () => {
    if (!invoiceId || !locationId || !localInvoice?.docId) {
      alert("Cannot save: Invoice not loaded or missing ID");
      return;
    }

    try {
      const reportRef = doc(
        db,
        "locations",
        locationId,
        "invoices",
        localInvoice.docId,
        "microbiologyReports",
        "data"
      );

      // Prepare clean data with "-" for unselected fields per sample
      const cleanMicrobiologyData: any = {
        testCode: microbiologyData.testCode.slice(), // always kept
      };

      for (let i = 0; i < totalSamples; i++) {
        const sampleNumber = i + 1;
        const selectedIds = perSampleSelectedTests[sampleNumber] || [];

        // Reset fields
        cleanMicrobiologyData.yellowColonies = cleanMicrobiologyData.yellowColonies || [];
        cleanMicrobiologyData.greenColonies = cleanMicrobiologyData.greenColonies || [];
        cleanMicrobiologyData.tpc = cleanMicrobiologyData.tpc || [];

        cleanMicrobiologyData.yellowColonies[i] = "-";
        cleanMicrobiologyData.greenColonies[i] = "-";
        cleanMicrobiologyData.tpc[i] = "-";

        // Restore only selected
        selectedIds.forEach((testId: string) => {
          const fields = testToFieldsMap[testId];
          if (fields) {
            fields.forEach(field => {
              cleanMicrobiologyData[field][i] = microbiologyData[field][i] || "";
            });
          }
        });
      }

      await setDoc(
        reportRef,
        {
          farmerInfo,
          microbiologyData: cleanMicrobiologyData,
          totalSamples,
          sampleType,
          updatedAt: new Date().toISOString(),
          checkedBy: checkedBy.trim() || technicianName || "N/A",
        },
        { merge: true }
      );

      // Also save to invoice document
      const invoiceRef = doc(db, "locations", locationId, "invoices", localInvoice.docId);
      await updateDoc(invoiceRef, {
        checkedBy: checkedBy.trim() || technicianName || "N/A",
      });

      onSubmit();
    } catch (error) {
      console.error("Error saving microbiology report:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const rows = [
    { label: "Test Code", key: "testCode" as const },
    { label: "Yellow Colonies (cfu/ml)", key: "yellowColonies" as const },
    { label: "Green Colonies (cfu/ml)", key: "greenColonies" as const },
    { label: "Total Plate Count (TPC)", key: "tpc" as const },
  ];

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        Loading Microbiology Report...
      </div>
    );
  }

  if (totalSamples === 0) {
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        No microbiology samples in this invoice.
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-xl shadow-xl max-w-full overflow-x-auto">
      <h1 className="text-3xl font-bold mb-10 text-blue-900 text-center">
        Microbiology Analysis Report – All Samples ({totalSamples})
      </h1>

      {/* Farmer Information */}
      <section className="mb-12 bg-gray-50 p-7 rounded-xl">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Farmer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farmer Name</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.farmerName}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, farmerName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.address}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.mobile}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, mobile: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farmer ID</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500"
              value={farmerUID}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={farmerInfo.date}
              onChange={(e) => setFarmerInfo({ ...farmerInfo, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">No. of Samples</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500"
              value={totalSamples}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sample Type</label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              placeholder="e.g. Microbiology"
            />
          </div>
        </div>
      </section>

      {/* Microbiology Results Table */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-10 text-gray-800 text-center">
          Microbiology Test Results (All {totalSamples} Samples)
        </h2>

        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border border-blue-400 px-4 py-3 text-left font-bold text-md">Parameter</th>
                {Array.from({ length: totalSamples }, (_, i) => {
                  const sampleNumber = i + 1;
                  const sampleSelectedIds = perSampleSelectedTests[sampleNumber] || [];
                  const sampleSelectedNames = sampleSelectedIds
                    .map((id: string) => testNameMap[id] || id)
                    .filter(Boolean);

                  return (
                    <th key={i} className="border border-blue-400 px-4 py-3 text-center font-bold text-md">
                      <div>Sample {sampleNumber}</div>
                      {sampleSelectedNames.length > 0 && (
                        <div className="mt-1 text-xs text-blue-100 font-normal">
                          {sampleSelectedNames.join(" • ")}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                // Skip rendering row if no sample has selected this parameter
                const anySampleHasThis = Array.from({ length: totalSamples }).some((_, i) => {
                  const sampleNumber = i + 1;
                  const selectedIds = perSampleSelectedTests[sampleNumber] || [];
                  return (
                    row.key === "testCode" || // always show testCode
                    selectedIds.some(id => testToFieldsMap[id]?.includes(row.key))
                  );
                });

                if (!anySampleHasThis && row.key !== "testCode") return null;

                return (
                  <tr key={row.key} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-400 px-4 py-3 font-semibold text-gray-800 text-md">
                      {row.label}
                    </td>
                    {microbiologyData[row.key].map((value: string, i: number) => {
                      const sampleNumber = i + 1;
                      const selectedIds = perSampleSelectedTests[sampleNumber] || [];
                      const isEnabled =
                        row.key === "testCode" ||
                        selectedIds.some(id => testToFieldsMap[id]?.includes(row.key));

                      return (
                        <td key={i} className="border border-gray-400 ">
                          {isEnabled ? (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateColumn(row.key, i, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center focus:ring-4 focus:ring-blue-300 focus:border-blue-600 font-medium"
                              placeholder="Enter value"
                            />
                          ) : (
                            <div className="w-full px-4 py-3 text-center text-gray-500">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Checked by input */}
      <div className="mb-12 max-w-md mx-auto">
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

      <div className="text-center">
        <button
          onClick={handleSave}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-md rounded-xl shadow-2xl transition transform hover:scale-105"
        >
          Complete and generate Report
        </button>
      </div>
    </div>
  );
}