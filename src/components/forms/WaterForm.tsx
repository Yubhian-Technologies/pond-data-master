import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../pages/firebase";
import { Invoice } from "../../types";
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

interface WaterFormProps {
  invoiceId: string;
  locationId: string;
  invoice: Invoice;
  onSubmit: () => void; // Parent (LabResults) handles completion
}

export default function WaterForm({
  invoiceId,
  locationId,
  invoice,
  onSubmit,
}: WaterFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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
    noOfSamples: "1",
    reportDate: "",
  });

  const emptyPond: Pond = {
    id: 1,
    pondNo: "",
    pH: "", salinity: "", co3: "", hco3: "", alkalinity: "", hardness: "", ca: "", mg: "", na: "", k: "",
    totalAmmonia: "", unionizedAmmonia: "", h2s: "", nitrite: "", nitrate: "", iron: "", chlorine: "",
    dissolvedOxygen: "", totalDissolvedMatter: "",
    yellowColonies: "", greenColonies: "", tpc: "",
    phacus: "", chlorella: "", desmids: "", scenedesmus: "", copepod: "", rotifer: "", nauplius: "",
    spirulina: "", chaetoceros: "", skeletonema: "", rhizosolenia: "",
    anabaena: "", oscillatoria: "", microcystis: "",
    coscinodiscus: "", nitzchia: "", navicula: "",
    noctiluca: "", ceratium: "", dinophysis: "", gymnodinium: "",
    zoothamnium: "", tintinnopsis: "", favella: "",
  };

  const [ponds, setPonds] = useState<Pond[]>([]);

  const totalSamples =
    Number(
      invoice.sampleType?.find(
        (s: any) => s.type?.toLowerCase() === "water"
      )?.count
    ) || 1;

  // Load data (farmer + all existing samples)
  useEffect(() => {
    const loadData = async () => {
      if (!invoice || !locationId || !invoiceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const today = new Date();
        const todayDate = today.toISOString().split("T")[0];
        const currentTime = today.toTimeString().slice(0, 5);

        // Load farmer details
        if (invoice.farmerId) {
          const farmerRef = doc(db, "locations", locationId, "farmers", invoice.farmerId);
          const farmerSnap = await getDoc(farmerRef);
          if (farmerSnap.exists()) {
            const farmer = farmerSnap.data();

            setFormData(prev => ({
              ...prev,
              farmerName: farmer.name || "",
              mobile: farmer.phone || "",
              farmerUID: invoice.farmerId || "",
              farmerAddress: [farmer.address, farmer.city].filter(Boolean).join(", "),
              sdDoc: invoice.dateOfCulture || "",
              sourceOfWater: farmer.waterSource || "",
              sampleDate: todayDate,
              reportDate: todayDate,
              reportTime: currentTime,
              sampleCollectionTime: prev.sampleCollectionTime || "",
              sampleTime: prev.sampleCollectionTime || "",
              noOfSamples: String(totalSamples),
            }));
          }
        }

        // Load all existing water reports
        const waterReportsRef = collection(
          db,
          "locations",
          locationId,
          "invoices",
          invoiceId,
          "water_reports"
        );
        const snapshot = await getDocs(waterReportsRef);

        const loadedPonds: Pond[] = [];

        for (let i = 1; i <= totalSamples; i++) {
          const docId = `sample_${i}`;
          const docSnap = snapshot.docs.find(d => d.id === docId);

          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            loadedPonds.push({
              id: i,
              pondNo: data.pondNo || "",
              pH: data.pH || "",
              salinity: data.salinity || "",
              co3: data.co3 || "",
              hco3: data.hco3 || "",
              alkalinity: data.alkalinity || "",
              hardness: data.hardness || "",
              ca: data.ca || "",
              mg: data.mg || "",
              na: data.na || "",
              k: data.k || "",
              totalAmmonia: data.totalAmmonia || "",
              unionizedAmmonia: data.unionizedAmmonia || "",
              h2s: data.h2s || "",
              nitrite: data.nitrite || "",
              nitrate: data.nitrate || "",
              iron: data.iron || "",
              chlorine: data.chlorine || "",
              dissolvedOxygen: data.dissolvedOxygen || "",
              totalDissolvedMatter: data.totalDissolvedMatter || "",
              yellowColonies: data.yellowColonies || "",
              greenColonies: data.greenColonies || "",
              tpc: data.tpc || "",
              phacus: data.phacus || "",
              chlorella: data.chlorella || "",
              desmids: data.desmids || "",
              scenedesmus: data.scenedesmus || "",
              copepod: data.copepod || "",
              rotifer: data.rotifer || "",
              nauplius: data.nauplius || "",
              spirulina: data.spirulina || "",
              chaetoceros: data.chaetoceros || "",
              skeletonema: data.skeletonema || "",
              rhizosolenia: data.rhizosolenia || "",
              anabaena: data.anabaena || "",
              oscillatoria: data.oscillatoria || "",
              microcystis: data.microcystis || "",
              coscinodiscus: data.coscinodiscus || "",
              nitzchia: data.nitzchia || "",
              navicula: data.navicula || "",
              noctiluca: data.noctiluca || "",
              ceratium: data.ceratium || "",
              dinophysis: data.dinophysis || "",
              gymnodinium: data.gymnodinium || "",
              zoothamnium: data.zoothamnium || "",
              tintinnopsis: data.tintinnopsis || "",
              favella: data.favella || "",
            });
          } else {
            loadedPonds.push({ ...emptyPond, id: i, pondNo: `P${i}` }); // Helpful default
          }
        }

        setPonds(loadedPonds);
      } catch (err) {
        console.error("Error loading water data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [invoice, invoiceId, locationId, totalSamples]);

  
  useEffect(() => {
    if (formData.sampleCollectionTime && !formData.sampleTime) {
      setFormData(prev => ({
        ...prev,
        sampleTime: formData.sampleCollectionTime,
      }));
    }
  }, [formData.sampleCollectionTime]);

  const handlePondChange = (id: number, field: keyof Pond, value: string) => {
    setPonds((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const saveAllPonds = async () => {
    const savePromises = ponds.map((pond, index) => {
      const ref = doc(
        collection(db, "locations", locationId, "invoices", invoiceId, "water_reports"),
        `sample_${index + 1}`
      );
      return setDoc(ref, {
        ...pond,
        sampleNumber: index + 1,
        savedAt: new Date(),
      }, { merge: true });
    });

    await Promise.all(savePromises);
  };

  const handleSubmit = async () => {
    try {
      await saveAllPonds();

      const invoiceRef = doc(db, "locations", locationId, "invoices", invoice.docId || invoiceId);

      await updateDoc(invoiceRef, {
        "reportsProgress.water": "completed",
        farmerName: formData.farmerName,
        farmerPhone: formData.mobile,
        farmerUID: formData.farmerUID,
        farmerAddress: formData.farmerAddress,
        sourceOfWater: formData.sourceOfWater,
        sdDoc: formData.sdDoc,
        sampleDate: formData.sampleDate,
        sampleCollectionTime: formData.sampleCollectionTime,
        sampleTime: formData.sampleTime,
        reportDate: formData.reportDate,
        reportTime: formData.reportTime,
      });

      onSubmit(); 
    } catch (err) {
      console.error("Error saving water reports:", err);
      alert("Failed to save. Please try again.");
    }
  };

  if (loading) {
    return <p className="text-center py-12 text-lg">Loading water analysis data...</p>;
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-blue-800 text-center">
        Water Quality Analysis - All Samples ({totalSamples})
      </h2>

      {/* Farmer & General Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-lg">
        {[
          { label: "Farmer Name", name: "farmerName" },
          { label: "Mobile", name: "mobile" },
          { label: "S.D/D.O.C", name: "sdDoc" },
          { label: "Farmer UID", name: "farmerUID" },
          { label: "Source of Water", name: "sourceOfWater" },
          { label: "Farmer Address", name: "farmerAddress" },
          { label: "Sample Date", name: "sampleDate", type: "date" },
          { label: "Sample Collection Time", name: "sampleCollectionTime", type: "time" },
          { label: "Sample Time", name: "sampleTime", type: "time" },
          { label: "Report Date", name: "reportDate", type: "date" },
          { label: "Report Time", name: "reportTime", type: "time" },
          { label: "No. of Samples", value: totalSamples, disabled: true },
        ].map((field) => (
          <div key={field.name || field.label}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type={field.type || "text"}
              value={field.value ?? formData[field.name as keyof typeof formData]}
              onChange={(e) => {
                if (field.name) {
                  setFormData({ ...formData, [field.name]: e.target.value });
                }
              }}
              disabled={field.disabled}
              className={`w-full border rounded px-3 py-2 text-sm ${
                field.disabled ? "bg-gray-200 cursor-not-allowed" : "border-gray-300"
              }`}
            />
          </div>
        ))}
      </div>

      
      {ponds.map((pond, index) => (
        <div key={pond.id} className="mb-12">
          
          <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-blue-900">
              Pond/Sample #{index + 1} - Physico-Chemical Parameters
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {([
                { key: "pondNo", label: "Pond No." },
                { key: "pH", label: "pH" },
                { key: "salinity", label: "Salinity (PPT)" },
                { key: "dissolvedOxygen", label: "DO (ppm)" },
                { key: "totalDissolvedMatter", label: "TDM (ppm)" },
                { key: "co3", label: "CO₃" },
                { key: "hco3", label: "HCO₃" },
                { key: "alkalinity", label: "Alkalinity" },
                { key: "hardness", label: "Hardness" },
                { key: "ca", label: "Calcium (Ca)" },
                { key: "mg", label: "Magnesium (Mg)" },
                { key: "na", label: "Sodium (Na)" },
                { key: "k", label: "Potassium (K)" },
                { key: "totalAmmonia", label: "Total Ammonia" },
                { key: "unionizedAmmonia", label: "Un-ionized NH₃" },
                { key: "h2s", label: "H₂S (ppm)" },
                { key: "nitrite", label: "Nitrite" },
                { key: "nitrate", label: "Nitrate" },
                { key: "iron", label: "Iron" },
                { key: "chlorine", label: "Chlorine" },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1">{label}</label>
                  <input
                    type="text"
                    value={pond[key]}
                    onChange={(e) => handlePondChange(pond.id, key, e.target.value)}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    placeholder={key === "pondNo" ? "e.g. P1" : ""}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bacteriology */}
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4 text-red-800">Bacteriology (CFU/ml)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(["yellowColonies", "greenColonies", "tpc"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1">
                    {field === "yellowColonies" ? "Yellow Colonies" :
                     field === "greenColonies" ? "Green Colonies" :
                     "Total Plate Count (TPC)"}
                  </label>
                  <input
                    type="text"
                    value={pond[field]}
                    onChange={(e) => handlePondChange(pond.id, field, e.target.value)}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Useful Plankton */}
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4 text-green-800">Useful Plankton (cells/ml or org/ml)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {([
                "phacus", "chlorella", "desmids", "scenedesmus",
                "copepod", "rotifer", "nauplius", "spirulina",
                "chaetoceros", "skeletonema", "rhizosolenia",
              ] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type="text"
                    value={pond[field]}
                    onChange={(e) => handlePondChange(pond.id, field, e.target.value)}
                    className="w-full border border-gray-400 rounded px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Harmful Plankton */}
          <div className="mb-8">
            <h4 className="text-xl font-bold mb-4 text-red-700">Harmful Plankton (cells/ml or org/ml)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {([
                "anabaena", "oscillatoria", "microcystis",
                "coscinodiscus", "nitzchia", "navicula",
                "noctiluca", "ceratium", "dinophysis", "gymnodinium",
                "zoothamnium", "tintinnopsis", "favella",
              ] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type="text"
                    value={pond[field]}
                    onChange={(e) => handlePondChange(pond.id, field, e.target.value)}
                    className="w-full border border-gray-400 rounded px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Final Submit Button */}
      <div className="flex justify-center mt-12">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold text-lg"
        >
          Complete & Generate Report
        </button>
      </div>
    </div>
  );
}