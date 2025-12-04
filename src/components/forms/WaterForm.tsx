import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {  collection,doc, getDoc, setDoc,updateDoc } from "firebase/firestore";
import { db } from "../../pages/firebase"; // update path if needed
import { Invoice } from "../../types/index"; 
import { useNavigate } from "react-router-dom";

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

interface WaterFormProps {
  sampleNumber: number;
  invoiceId: string;
  locationId: string;
  invoice: Invoice;
  onSubmit: (formData: any, ponds: Pond[]) => void;
}

export default function WaterForm({ sampleNumber, invoiceId, invoice,locationId, onSubmit }: WaterFormProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const [ponds, setPonds] = useState<Pond[]>([
    {
      id: 1,
      pondNo: "",
      pH: "",
      salinity: "",
      co3: "",
      hco3: "",
      alkalinity: "",
      hardness: "",
      ca: "",
      mg: "",
      na: "",
      k: "",
      totalAmmonia: "",
      unionizedAmmonia: "",
      h2s: "",
      nitrite: "",
      nitrate: "",
      iron: "",
      chlorine: "",
      dissolvedOxygen: "",
      totalDissolvedMatter: "",
    },
  ]);

  // Set sample number and dates
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      noOfSamples: String(sampleNumber),
      sampleDate: new Date().toISOString().split("T")[0],
      reportDate: new Date().toISOString().split("T")[0],
    }));
  }, [sampleNumber]);

  // ---------- FETCH FARMER USING INVOICE ----------
 useEffect(() => {
    const fetchFarmerFromInvoice = async () => {
      if (!invoice || !locationId) return;

      try {
        setLoading(true);

        console.log("Fetching invoice →", invoice);

        // Fetch invoice
        

        const farmerId = invoice.farmerId;  // correct key

        if (!farmerId) {
          console.log("Invoice does not contain farmerId");
          return;
        }

        console.log("Fetching Farmer =>", farmerId);

        // Fetch farmer data
        const farmerRef = doc(db, "locations", locationId, "farmers", farmerId);
        const farmerSnap = await getDoc(farmerRef);

        if (!farmerSnap.exists()) {
          console.log("Farmer not found");
          return;
        }

        const farmer = farmerSnap.data();
        console.log("Farmer Data:", farmer);
         const waterSample = invoice.sampleType?.find(
    (sample: any) => sample.type === "water"
  );

        // Auto-fill fields
        setFormData((prev: any) => ({
          ...prev,
          farmerName: farmer.name || "",
          farmerUID: farmer.farmerUID || "",
          farmerAddress: farmer.address + " " + " ," + farmer.city || "",
          mobile: farmer.phone || "",
          sdDoc: invoice.dateOfCulture || "",
          sourceOfWater: farmer.waterSource || "",
          noOfSamples: waterSample.count,


        }));

      } catch (err) {
        console.error("Error fetching farmer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerFromInvoice();
  }, [invoiceId, locationId]);
  const [currentPondIndex, setCurrentPondIndex] = useState(0);

// Derived value: total number of samples
const totalSamples = Number(formData.noOfSamples) || 1;

const handleNextPond = async ()=> {
  const pondData = ponds[currentPondIndex];
  await savePondReport(pondData, currentPondIndex);
  if (currentPondIndex < totalSamples - 1) {
    // add new pond if it doesn't exist
    if (!ponds[currentPondIndex + 1]) {
      setPonds([
        ...ponds,
        {
          ...ponds[0],
          id: currentPondIndex + 2, // unique id
          pondNo: "",
        },
      ]);
    }
    setCurrentPondIndex(currentPondIndex + 1);
  }
  else {
    console.log("All samples saved!");
  }
};
const navigate = useNavigate();
const savePondReport = async (pondData: any, sampleIndex: number) => {
  if (!locationId || !invoiceId) return;

  try {
    // "samples" collection under invoice document
    const samplesCollectionRef = collection(
      db,
      "locations",
      locationId,
      "reports",
      invoiceId,
      "water samples"
    );

    // Each sample is a document inside samples collection
    const sampleDocRef = doc(samplesCollectionRef, `sample_${sampleIndex + 1}`);

    await setDoc(sampleDocRef, pondData);
    console.log(`Sample ${sampleIndex + 1} saved successfully`);
  } catch (err) {
    console.error("Error saving sample report:", err);
  }
};


  // handle form input
  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePondChange = (id: number, field: keyof Pond, value: string) => {
    setPonds(
      ponds.map((pond) => (pond.id === id ? { ...pond, [field]: value } : pond))
    );
  };


  const handleSubmit = async () => {
    await savePondReport(ponds[currentPondIndex], currentPondIndex);
    if (invoiceId && locationId) {
      const invoiceRef = doc(db, "locations", locationId, "invoices", invoice.docId);

      await updateDoc(invoiceRef, {
    [`reportsProgress.water`]: "completed",
  });
  navigate(`/water-report/${invoice.docId}/${invoice.locationId}`);

      console.log("Report progress updated -> Water Completed");
    }
    console.log("All samples submitted!");
    onSubmit(formData, ponds);
  };
  return (
    <div className="p-6 bg-white shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Water Quality Report - Data Entry</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Farmer Name</label>
          <input
            type="text"
            name="farmerName"
            value={formData.farmerName}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">S.D/D.O.C</label>
          <input
            type="text"
            name="sdDoc"
            value={formData.sdDoc}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sample Collection Time</label>
          <input
            type="text"
            name="sampleCollectionTime"
            value={formData.sampleCollectionTime}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Farmer UID</label>
          <input
            type="text"
            name="farmerUID"
            value={formData.farmerUID}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source of Water</label>
          <input
            type="text"
            name="sourceOfWater"
            value={formData.sourceOfWater}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sample Date</label>
          <input
            type="date"
            name="sampleDate"
            value={formData.sampleDate}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sample Time</label>
          <input
            type="time"
            name="sampleTime"
            value={formData.sampleTime}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Farmer Address</label>
          <input
            type="text"
            name="farmerAddress"
            value={formData.farmerAddress}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">No. of Samples</label>
          <input
            type="text"
            name="noOfSamples"
            value={formData.noOfSamples}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Report Date</label>
          <input
            type="date"
            name="reportDate"
            value={formData.reportDate}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Report Time</label>
          <input
            type="time"
            name="reportTime"
            value={formData.reportTime}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-blue-700">Water Analysis Data</h3>
      
      <div key={ponds[currentPondIndex].id} className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
        <div className="mb-3">
          <h4 className="font-semibold text-lg">Pond #{currentPondIndex + 1}</h4>
        </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {/* Pond fields same as before */}
    <div>
      <label className="block text-xs font-medium mb-1">Pond No.</label>
      <input
        type="text"
        value={ponds[currentPondIndex].pondNo}
        onChange={(e) =>
          handlePondChange(ponds[currentPondIndex].id, "pondNo", e.target.value)
        }
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
      />
    </div>
            <div>
              <label className="block text-xs font-medium mb-1">pH</label>
              <input
                type="text"
                value={ponds[currentPondIndex].pH}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'pH', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Salinity (PPT)</label>
              <input
                type="text"
                value={ponds[currentPondIndex].salinity}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'salinity', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">CO₃</label>
              <input
                type="text"
                value={ponds[currentPondIndex].co3}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'co3', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">HCO₃</label>
              <input
                type="text"
                value={ponds[currentPondIndex].hco3}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'hco3', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Alkalinity</label>
              <input
                type="text"
                value={ponds[currentPondIndex].alkalinity}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'alkalinity', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Hardness</label>
              <input
                type="text"
                value={ponds[currentPondIndex].hardness}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'hardness', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ca⁺⁺</label>
              <input
                type="text"
                value={ponds[currentPondIndex].ca}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'ca', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mg⁺⁺</label>
              <input
                type="text"
                value={ponds[currentPondIndex].mg}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'mg', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Na⁺</label>
              <input
                type="text"
                value={ponds[currentPondIndex].na}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'na', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">K⁺</label>
              <input
                type="text"
                value={ponds[currentPondIndex].k}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'k', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Total Ammonia</label>
              <input
                type="text"
                value={ponds[currentPondIndex].totalAmmonia}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'totalAmmonia', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Unionized Ammonia</label>
              <input
                type="text"
                value={ponds[currentPondIndex].unionizedAmmonia}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'unionizedAmmonia', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">H₂S (ppm)</label>
              <input
                type="text"
                value={ponds[currentPondIndex].h2s}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'h2s', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nitrite NO₂</label>
              <input
                type="text"
                value={ponds[currentPondIndex].nitrite}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'nitrite', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nitrate NO₃</label>
              <input
                type="text"
                value={ponds[currentPondIndex].nitrate}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'nitrate', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Iron (Fe)</label>
              <input
                type="text"
                value={ponds[currentPondIndex].iron}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'iron', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Chlorine</label>
              <input
                type="text"
                value={ponds[currentPondIndex].chlorine}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'chlorine', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">DO (ppm)</label>
              <input
                type="text"
                value={ponds[currentPondIndex].dissolvedOxygen}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'dissolvedOxygen', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">TDM (ppm)</label>
              <input
                type="text"
                value={ponds[currentPondIndex].totalDissolvedMatter}
                onChange={(e) => handlePondChange(ponds[currentPondIndex].id, 'totalDissolvedMatter', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

      <div className="flex gap-4 mt-4">
    {currentPondIndex < totalSamples - 1 && (
      <button
        onClick={handleNextPond}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Next Sample
      </button>
    )}
    {currentPondIndex === totalSamples - 1 && (
      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Generate Report
      </button>
    )}
  </div>
    </div>
  );
}