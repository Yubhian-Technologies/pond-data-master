import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from "../../pages/firebase"; // update path if needed
import { collection, doc, getDoc, setDoc,updateDoc } from "firebase/firestore";
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
  onSubmit: (data: FormData, samples: Sample[]) => void;
}

export default function SoilForm({
  onSubmit,
  invoice,
  invoiceId,
  locationId,
}: SoilFormProps) {
  const [formData, setFormData] = useState<FormData>({
    farmerName: '',
    farmerUID: '',
    farmerAddress: '',
    soilType: '',
    sourceOfSoil: '',
    noOfSamples: '',
    mobile: '',
    sampleDate: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    reportedBy: '',
    checkedBy: '',
    cmisBy: ''
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([
    {
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
    }
  ]);
  const [soilType, setSoilType] = useState("");
const [sourceOfSoil, setSourceOfSoil] = useState("");
  const { session } = useUserSession();
  let technicianName = session.technicianName;
  const [currentPondIndex, setCurrentPondIndex] = useState(0);

  // Derived value: total number of samples
  const totalSamples = Number(formData.noOfSamples) || 1;

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle pond/sample field changes
  const handleSampleChange = (index: number, field: keyof Sample, value: string) => {
    const newSamples = [...samples];
    newSamples[index][field] = value;
    setSamples(newSamples);
  };

  // Fetch farmer details from invoice
  useEffect(() => {
    
    const fetchFarmerFromInvoice = async () => {
      if (!invoice || !locationId) return;

      try {
        setLoading(true);
        const farmerId = invoice.farmerId;
        if (!farmerId) return;

        const farmerRef = doc(db, "locations", locationId, "farmers", farmerId);
        const farmerSnap = await getDoc(farmerRef);
        if (!farmerSnap.exists()) return;

        const farmer = farmerSnap.data();
        const soilSample = invoice.sampleType?.find((s: any) => s.type === "soil");

        setFormData(prev => ({
          ...prev,
          cmisBy : technicianName,
          checkedBy: technicianName,
          reportedBy: technicianName,
          farmerName: farmer.name || "",
          farmerUID: farmer.farmerUID || "",
          farmerAddress: (farmer.address || "") + ", " + (farmer.city || ""),
          mobile: farmer.phone || "",
          noOfSamples: soilSample?.count || "1",
        }));
      } catch (err) {
        console.error("Error fetching farmer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerFromInvoice();
  }, [invoice, locationId]);

  // Save a single pond/sample to Firestore
  const savePondReport = async (
  pondData: Sample,
  sampleIndex: number,
  sourceOfSoil: string,
  soilType: string,
  technicianName: string
) => {
  if (!locationId || !invoiceId) return;

  try {
    // 1️⃣ Save HEADER INFORMATION at: locations/{id}/reports/{invoiceId}
    const reportHeaderRef = doc(
      db,
      "locations",
      locationId,
      "reports",
      invoiceId
    );

    await setDoc(
      reportHeaderRef,
      {
        sourceOfSoil,
        soilType,
        technicianName,
      },
      { merge: true } // prevents overwriting existing data
    );

    // 2️⃣ Save SAMPLE DATA inside subcollection
    const samplesCollectionRef = collection(
      db,
      "locations",
      locationId,
      "reports",
      invoiceId,
      "soil samples"
    );

    const sampleDocRef = doc(samplesCollectionRef, `sample_${sampleIndex + 1}`);
    await setDoc(sampleDocRef, pondData);

    console.log(
      `Sample ${sampleIndex + 1} & report metadata saved successfully`
    );
  } catch (err) {
    console.error("Error saving sample report:", err);
  }
};


  // Handle next pond/sample
  const handleNextPond = async () => {
    await savePondReport(samples[currentPondIndex],currentPondIndex,sourceOfSoil,soilType,technicianName)
    if (currentPondIndex < totalSamples - 1) {
      if (!samples[currentPondIndex + 1]) {
        setSamples(prev => [
          ...prev,
          {
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

          }
        ]);
      }
      setCurrentPondIndex(currentPondIndex + 1);
    }
  };

  // Final submit
  const handleSubmit = async () => {
  try {
    // Save the last pond
    await savePondReport(
  samples[currentPondIndex],
  currentPondIndex,
  sourceOfSoil,
  soilType,
  technicianName
);

    // Mark water report as completed in invoice.progressReports
    if (invoiceId && locationId) {
      const invoiceRef = doc(db, "locations", locationId, "invoices", invoice.docId);

      await updateDoc(invoiceRef, {
    [`reportsProgress.soil`]: "completed",
    });
      navigate(`/soil-report/${invoice.id}/${locationId}`);

      console.log("Report progress updated -> Soil Completed");
    }

    onSubmit(formData, samples);

  } catch (error) {
    console.error("Error updating water report status:", error);
  }
};


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4" style={{color: '#1e40af'}}>Enter Report Details</h2>

      {/* Farmer Details */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-700">Farmer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Farmer Name</label>
            <input type="text" name="farmerName" value={formData.farmerName} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Farmer UID</label>
            <input type="text" name="farmerUID" value={formData.farmerUID} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile</label>
            <input type="text" name="mobile" value={formData.mobile} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Farmer Address</label>
            <input type="text" name="farmerAddress" value={formData.farmerAddress} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
      </div>

      {/* Sample Details */}
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
            <input type="text" name="noOfSamples" value={formData.noOfSamples} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
      </div>

      {/* Test Results - Only current pond */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-700">Test Results - Sample {currentPondIndex + 1}</h3>
        <div className="border border-gray-300 rounded p-4 mb-4" style={{ backgroundColor: '#f9fafb' }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(samples[currentPondIndex]).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleSampleChange(currentPondIndex, key as keyof Sample, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* Verification Details */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-700">Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reported By</label>
            <input type="text" name="reportedBy" value={formData.reportedBy} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Checked By</label>
            <input type="text" name="checkedBy" value={formData.checkedBy} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CMIS By</label>
            <input type="text" name="cmisBy" value={formData.cmisBy} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        {currentPondIndex > 0 && (
          <button
            onClick={() => setCurrentPondIndex(currentPondIndex - 1)}
            className="px-4 py-2 rounded bg-gray-400 text-white hover:opacity-90"
          >
            Previous
          </button>
        )}

        {currentPondIndex < totalSamples - 1 ? (
          <button
            onClick={handleNextPond}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-green-600 text-white hover:opacity-90"
          >
            Generate Report
          </button>
        )}
      </div>
    </div>
  );
}
