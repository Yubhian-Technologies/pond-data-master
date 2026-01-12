import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../pages/firebase";
import { Invoice } from "../../types";
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
  invoice: any;
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function SoilForm({
  invoice,
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

  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const totalSamples = Number(
    invoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "soil")?.count || 1
  );

  // ──────────────────────────────────────────────────────────────
  // NEW: Per-sample selected soil tests from invoice
  // ──────────────────────────────────────────────────────────────
  const perSampleSelectedTests = invoice.perSampleSelectedTests?.soil || {};

  // Mapping from test ID → display name (adjust keys to match your actual test IDs)
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
    // Add any other soil test IDs you use in availableTests
  };
  // ──────────────────────────────────────────────────────────────

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
      if (!invoice || !locationId || !invoiceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load farmer info
        if (invoice.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", invoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmer = farmerSnap.data();
            setFormData(prev => ({
              ...prev,
              farmerName: farmer.name || "",
              farmerUID: farmer.farmerUID || "",
              farmerAddress: `${farmer.address || ""}, ${farmer.city || ""}`.trim(),
              mobile: farmer.phone || "",
              noOfSamples: String(totalSamples),
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
          }));
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
              pondNo: '',
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

    loadData();
  }, [invoice, invoiceId, locationId, technicianName, currentTime, totalSamples]);

  const saveAllData = async () => {
    if (!locationId || !invoiceId) return;

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
      }, { merge: true });

      // Save all samples
      const savePromises = samples.map((sample, index) => {
        const sampleDocRef = doc(
          collection(db, "locations", locationId, "reports", invoiceId, "soil samples"),
          `sample_${index + 1}`
        );
        return setDoc(sampleDocRef, sample);
      });

      await Promise.all(savePromises);

      // Mark as completed
      const invoiceRef = doc(db, "locations", locationId, "invoices", invoice.docId || invoiceId);
      await updateDoc(invoiceRef, {
        "reportsProgress.soil": "completed",
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
            <label className="block text-sm font-medium mb-1">Sample Collection Time</label>
            <input type="time" name="sampleCollectionTime" value={formData.sampleCollectionTime} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sample Time</label>
            <input type="time" name="sampleTime" value={formData.sampleTime} onChange={handleChange}
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
        // Get selected tests only for THIS sample
        const sampleSelectedIds = perSampleSelectedTests[sampleNumber] || [];
        const sampleSelectedNames = sampleSelectedIds
          .map(id => testNameMap[id] || id)
          .filter(Boolean);

        return (
          <div key={index} className="mb-10">
            {/* NEW: Selected tests for this specific sample */}
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
                {Object.entries(sample).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleSampleChange(index, key as keyof Sample, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

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