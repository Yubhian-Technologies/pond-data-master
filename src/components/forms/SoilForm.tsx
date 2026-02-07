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
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../../contexts/UserSessionContext";

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
  sampleCollectionTime: string;
  sampleTime: string;
  reportTime: string;
  reportedBy: string;
  checkedBy: string;
  cmisBy: string;
}

interface Sample {
  pondNo: string;
  pH: string;
  ec: string;
  caco3: string;
  soilTexture: string;
  organicCarbon: string;
  availableNitrogen: string;
  availablePhosphorus: string;
  redoxPotential: string;
  remarks: string;
}

interface SoilFormProps {
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function SoilForm({
  invoiceId,
  locationId,
  onSubmit,
}: SoilFormProps) {
  const navigate = useNavigate();
  const { session } = useUserSession();
  const technicianName = session?.technicianName || "";

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState<FormData>({
    farmerName: '',
    farmerUID: '',
    farmerAddress: '',
    soilType: '',
    sourceOfSoil: '',
    noOfSamples: '1',
    mobile: '',
    sampleDate: today,
    reportDate: today,
    sampleCollectionTime: '',
    sampleTime: '',
    reportTime: currentTime,
    reportedBy: technicianName,
    checkedBy: technicianName,
    cmisBy: technicianName,
  });

  const [checkedBy, setCheckedBy] = useState(technicianName);

  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [localInvoice, setLocalInvoice] = useState<any>(null);

  // ────────────────────────────────────────────────
  // Mapping: which test IDs control which soil fields
  // ────────────────────────────────────────────────
  const testToSoilFields: Record<string, (keyof Sample)[]> = {
    // Assuming these are the possible test IDs for soil (adjust if different)
    "soil_ph": ["pH"],
    "soil_ec": ["ec"],
    "soil_oc": ["organicCarbon"],
    // Add others if you have more granular soil tests
    // If you have a "basic_soil" or similar that includes multiple, add here
  };

  // Always show these (common / header-like fields)
  const alwaysShowFields = new Set<keyof Sample>(["pondNo", "remarks"]);

  // ────────────────────────────────────────────────
  // Fetch invoice
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!locationId || !invoiceId) {
      console.warn("Missing locationId or invoiceId for SoilForm fetch");
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
          console.log("SoilForm - Invoice loaded OK:", { 
            docId, 
            invoiceId: data.invoiceId || data.id || "unknown" 
          });
        } else {
          console.error("SoilForm - Invoice NOT FOUND for ID:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice in SoilForm:", err);
      }
    };

    fetchInvoice();
  }, [locationId, invoiceId]);

  const totalSamples = Number(
    localInvoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "soil")?.count || 1
  );

  const perSampleSelectedTests = localInvoice?.perSampleSelectedTests?.soil || {};

  const testNameMap: Record<string, string> = {
    pondNo: "Pond No.",
    pH: "pH",
    ec: "EC",
    caco3: "CaCO₃",
    soilTexture: "Soil Texture",
    organicCarbon: "Organic Carbon",
    availableNitrogen: "Available Nitrogen",
    availablePhosphorus: "Available Phosphorus",
    redoxPotential: "Redox Potential",
    remarks: "Remarks",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSampleChange = (index: number, field: keyof Sample, value: string) => {
    setSamples(prev => {
      const newSamples = [...prev];
      newSamples[index] = { ...newSamples[index], [field]: value };
      return newSamples;
    });
  };

  useEffect(() => {
    if (formData.sampleCollectionTime && !formData.sampleTime) {
      setFormData(prev => ({ ...prev, sampleTime: formData.sampleCollectionTime }));
    }
  }, [formData.sampleCollectionTime]);

  useEffect(() => {
    const loadData = async () => {
      if (!localInvoice || !locationId || !invoiceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Pre-fill farmer info
        if (localInvoice.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmer = farmerSnap.data();
            setFormData(prev => ({
              ...prev,
              farmerName: farmer.name || "",
              farmerUID: farmer.farmerId || "",
              farmerAddress: `${farmer.address || ""}, ${farmer.city || ""}`.trim(),
              mobile: farmer.phone || "",
              noOfSamples: String(totalSamples),
              sampleDate: localInvoice.dateOfCulture || today,
            }));
          }
        }

        // Load existing report header
        const reportHeaderRef = doc(db, "locations", locationId, "reports", invoiceId);
        const headerSnap = await getDoc(reportHeaderRef);
        if (headerSnap.exists()) {
          const headerData = headerSnap.data();
          setFormData(prev => ({
            ...prev,
            soilType: headerData.soilType || "",
            sourceOfSoil: headerData.sourceOfSoil || "",
            sampleCollectionTime: headerData.sampleCollectionTime || "",
            sampleTime: headerData.sampleTime || "",
            reportTime: headerData.reportTime || currentTime,
            reportedBy: headerData.technicianName || technicianName,
            checkedBy: headerData.technicianName || technicianName,
            cmisBy: headerData.technicianName || technicianName,
            sampleDate: headerData.sampleDate || localInvoice.dateOfCulture || today,
          }));
          setCheckedBy(headerData.checkedBy || technicianName || "");
        }

        // Load all soil samples
        const samplesCollection = collection(
          db,
          "locations",
          locationId,
          "reports",
          invoiceId,
          "soil samples"
        );
        const samplesSnap = await getDocs(samplesCollection);

        const loadedSamples: Sample[] = [];

        for (let i = 1; i <= totalSamples; i++) {
          const sampleDoc = samplesSnap.docs.find(d => d.id === `sample_${i}`);
          if (sampleDoc) {
            loadedSamples.push(sampleDoc.data() as Sample);
          } else {
            loadedSamples.push({
              pondNo: `S${i}`,
              pH: '',
              ec: '',
              caco3: '',
              soilTexture: '',
              organicCarbon: '',
              availableNitrogen: '',
              availablePhosphorus: '',
              redoxPotential: '',
              remarks: ''
            });
          }
        }

        setSamples(loadedSamples);
      } catch (err) {
        console.error("Error loading soil report data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (localInvoice) {
      loadData();
    }
  }, [localInvoice, invoiceId, locationId, technicianName, totalSamples]);

  // ────────────────────────────────────────────────
  // Save with unselected fields forced to "-"
  // ────────────────────────────────────────────────
  const saveAllData = async () => {
    if (!locationId || !invoiceId || !localInvoice?.docId) {
      alert("Cannot save: Invoice not loaded or missing ID");
      return;
    }

    try {
      // Save shared header
      const reportHeaderRef = doc(db, "locations", locationId, "reports", invoiceId);
      await setDoc(reportHeaderRef, {
        soilType: formData.soilType,
        sourceOfSoil: formData.sourceOfSoil,
        sampleCollectionTime: formData.sampleCollectionTime,
        sampleTime: formData.sampleTime,
        reportTime: formData.reportTime,
        technicianName: technicianName,
        sampleDate: formData.sampleDate,
        checkedBy: checkedBy.trim() || technicianName || "N/A",
      }, { merge: true });

      // Save all samples with filtering
      const savePromises = samples.map(async (sample, index) => {
        const sampleNumber = index + 1;
        const selectedIds = perSampleSelectedTests[sampleNumber] || [];

        // Create clean copy
        const dataToSave: Partial<Sample> = { ...sample };

        // Reset all analyzable fields to "-"
        [
          "pH", "ec", "caco3", "soilTexture", "organicCarbon",
          "availableNitrogen", "availablePhosphorus", "redoxPotential"
        ].forEach(field => {
          (dataToSave as any)[field] = "-";
        });

        // Restore only selected ones
        selectedIds.forEach(testId => {
          const fields = testToSoilFields[testId];
          if (fields) {
            fields.forEach(field => {
              (dataToSave as any)[field] = sample[field] || "";
            });
          }
        });

        const sampleDocRef = doc(
          collection(db, "locations", locationId, "reports", invoiceId, "soil samples"),
          `sample_${sampleNumber}`
        );

        return setDoc(sampleDocRef, dataToSave, { merge: true });
      });

      await Promise.all(savePromises);

      // Mark as completed
      const invoiceRef = doc(db, "locations", locationId, "invoices", localInvoice.docId);
      await updateDoc(invoiceRef, {
        "reportsProgress.soil": "completed",
        checkedBy: checkedBy.trim() || technicianName || "N/A",
      });

    } catch (err) {
      console.error("Error saving soil data:", err);
      alert("Failed to save. Please try again.");
    }
  };

  const handleSubmit = async () => {
    await saveAllData();
    onSubmit();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading report data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4" style={{ color: '#1e40af' }}>
        Enter Soil Report Details - All Samples ({totalSamples})
      </h2>

      {/* Farmer Details */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-700">Farmer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Farmer Name</label>
            <input type="text" value={formData.farmerName} readOnly className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Farmer UID</label>
            <input type="text" value={formData.farmerUID} readOnly className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile</label>
            <input type="text" value={formData.mobile} readOnly className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Farmer Address</label>
            <input type="text" value={formData.farmerAddress} readOnly className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>
        </div>
      </div>

      {/* Sample Details + Time Fields */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-700">Sample Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Soil Type</label>
            <input type="text" name="soilType" value={formData.soilType} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source of Soil</label>
            <input type="text" name="sourceOfSoil" value={formData.sourceOfSoil} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No. of Samples</label>
            <input type="text" value={totalSamples} readOnly className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sample Date</label>
            <input 
              type="date" 
              name="sampleDate" 
              value={formData.sampleDate} 
              readOnly 
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sample Collection Time</label>
            <input type="time" name="sampleCollectionTime" value={formData.sampleCollectionTime} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Report Time</label>
            <input type="time" value={formData.reportTime} readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"/>
          </div>
        </div>
      </div>

      {/* All Samples - One Section Per Sample */}
      {samples.map((sample, index) => {
        const sampleNumber = index + 1;
        const sampleSelectedIds = perSampleSelectedTests[sampleNumber] || [];
        const sampleSelectedNames = sampleSelectedIds
          .map(id => testNameMap[id] || id)
          .filter(Boolean);

        // Determine which fields to show for this sample
        const enabledFields = new Set<keyof Sample>();

        sampleSelectedIds.forEach(testId => {
          const fields = testToSoilFields[testId];
          if (fields) {
            fields.forEach(f => enabledFields.add(f));
          }
        });

        // Define all possible fields with labels
        const allSoilFields: { key: keyof Sample; label: string }[] = [
          { key: "pondNo", label: "Pond No." },
          { key: "pH", label: "pH" },
          { key: "ec", label: "Electrical Conductivity (EC)" },
          { key: "caco3", label: "CaCO₃" },
          { key: "soilTexture", label: "Soil Texture" },
          { key: "organicCarbon", label: "Organic Carbon" },
          { key: "availableNitrogen", label: "Available Nitrogen" },
          { key: "availablePhosphorus", label: "Available Phosphorus" },
          { key: "redoxPotential", label: "Redox Potential" },
          { key: "remarks", label: "Remarks" },
        ];

        // Filter to show only enabled + always shown
        const displayedFields = allSoilFields.filter(
          f => alwaysShowFields.has(f.key) || enabledFields.has(f.key)
        );

        return (
          <div key={index} className="mb-10">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Tests selected for Sample #{sampleNumber}:
              </p>
              {sampleSelectedNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sampleSelectedNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No specific tests selected for this sample
                </p>
              )}
            </div>

            <h3 className="font-bold mb-3 text-gray-700">
              Test Results - Sample {sampleNumber} of {totalSamples}
            </h3>
            <div className="border border-gray-300 rounded p-4 mb-4" style={{ backgroundColor: '#f9fafb' }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {displayedFields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={sample[key] || ""}
                      onChange={(e) => handleSampleChange(index, key, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Checked by input field */}
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

      {/* Final Submit Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          className="px-8 py-4 rounded bg-green-600 text-white hover:bg-green-700 font-semibold text-lg"
        >
          Complete & Generate Report
        </button>
      </div>
    </div>
  );
}