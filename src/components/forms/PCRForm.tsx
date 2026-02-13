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
  address: string;          // ← Changed from village to address
  mobile: string;
  farmerId: string;
  sampleCollectionTime: string;
  sampleType: string;
  noOfSamples: number;
  reportDate: string;
  docDifference: string;
}

interface PathogenResult {
  name: string;
  result: string;
  ctValue: string;
}

interface SamplePCRData {
  sampleCode: string;
  sampleType: string;
  pathogens: PathogenResult[];
  gelImageUrl: string;
}

interface PCRFormProps {
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function PCRForm({
  invoiceId,
  locationId,
  onSubmit,
}: PCRFormProps) {
  const { session } = useUserSession();
  const technicianName = session?.technicianName || "";

  const today = new Date().toISOString().split("T")[0];

  const [localInvoice, setLocalInvoice] = useState<any>(null);

  const totalSamples = useMemo(() => {
    const count = Number(
      localInvoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "pcr")?.count || 0
    );
    console.log("PCR totalSamples calculated:", {
      rawSampleType: localInvoice?.sampleType,
      foundPCR: localInvoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "pcr"),
      count
    });
    return count;
  }, [localInvoice]);

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo>({
    farmerName: "",
    address: "",                // ← Changed from village
    mobile: "",
    farmerId: "—",
    sampleCollectionTime: today,
    sampleType: "PL PCR",
    noOfSamples: totalSamples,
    reportDate: today,
    docDifference: "0 days",
  });

  const [samplesData, setSamplesData] = useState<SamplePCRData[]>([]);
  const [gelImages, setGelImages] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkedBy, setCheckedBy] = useState(technicianName);

  const PATHOGEN_NAME_MAP: Record<string, string> = {
    pl_ehp: "PL EHP",
    soil_ehp: "Soil EHP",
    water_ehp: "Water EHP",
    pl_wssv: "WSSV",
    pl_vibrio_pcr: "VIBRIO",
    pl_ihhnv: "IHHNV",
  };

  // Fetch invoice
  useEffect(() => {
    if (!locationId || !invoiceId) {
      console.warn("Missing locationId or invoiceId for PCRForm fetch");
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
          console.log("PCRForm - Invoice loaded OK:", { 
            docId, 
            invoiceId: data.invoiceId || data.id || "unknown" 
          });
        } else {
          console.error("PCRForm - Invoice NOT FOUND for ID:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice in PCRForm:", err);
      }
    };

    fetchInvoice();
  }, [locationId, invoiceId]);

  useEffect(() => {
    setFarmerInfo(prev => ({
      ...prev,
      noOfSamples: totalSamples
    }));
  }, [totalSamples]);

  useEffect(() => {
    const loadFarmerFromMaster = async () => {
      if (!localInvoice?.farmerId || !locationId) return;

      try {
        const farmerRef = doc(db, "locations", locationId, "farmers", localInvoice.farmerId);
        const snap = await getDoc(farmerRef);

        if (snap.exists()) {
          const farmer = snap.data();

          setFarmerInfo(prev => ({
            ...prev,
            farmerId: farmer.farmerId || "",   
            farmerName: farmer.name || prev.farmerName,
            mobile: farmer.phone || prev.mobile,
            address: farmer.address || prev.address   // ← Changed: use address from master
          }));
        }
      } catch (err) {
        console.error("Failed to load farmer master data in PCRForm:", err);
      }
    };

    if (localInvoice) {
      loadFarmerFromMaster();
    }
  }, [localInvoice?.farmerId, locationId]);

  // Auto-calculate difference
  useEffect(() => {
    if (farmerInfo.sampleCollectionTime && farmerInfo.reportDate) {
      const collectionDate = new Date(farmerInfo.sampleCollectionTime);
      const reportDateObj = new Date(farmerInfo.reportDate);
      const diffTime = Math.abs(reportDateObj.getTime() - collectionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFarmerInfo((prev) => ({
        ...prev,
        docDifference: diffDays === 0 ? "Same Day" : `${diffDays} days`,
      }));
    }
  }, [farmerInfo.sampleCollectionTime, farmerInfo.reportDate]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!localInvoice || !invoiceId || !locationId || totalSamples === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const loadedSamples: SamplePCRData[] = [];
        let firstCheckedBy = technicianName;  // Default fallback

        for (let i = 1; i <= totalSamples; i++) {
          const pcrDocRef = doc(
            db,
            "locations",
            locationId,
            "invoices",
            localInvoice.docId,
            "pcr_reports",
            `sample_${i}`
          );

          const snap = await getDoc(pcrDocRef);

          if (snap.exists()) {
            const data = snap.data();
            loadedSamples.push({
              sampleCode: data.sampleCode || "",
              sampleType: data.sampleType || "",
              pathogens: data.pathogens || [],
              gelImageUrl: data.gelImageUrl || "",
            });

            if (data.gelImageUrl) {
              setGelImages((prev) => ({ ...prev, [i]: data.gelImageUrl }));
            }

            // Load checkedBy from first saved sample
            if (i === 1 && data.checkedBy) {
              firstCheckedBy = data.checkedBy;
            }
          } else {
            const selectedForThisSample = localInvoice?.samplePathogens?.[i] || [];

            const initialPathogens = selectedForThisSample.map((testId: string) => ({
              name: PATHOGEN_NAME_MAP[testId] || testId,
              result: "",
              ctValue: "",
            }));

            loadedSamples.push({
              sampleCode: "",
              sampleType: "",
              pathogens: initialPathogens,
              gelImageUrl: "",
            });
          }
        }

        setSamplesData(loadedSamples);
        setCheckedBy(firstCheckedBy);
      } catch (err) {
        console.error("Error loading PCR data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (localInvoice) {
      loadAllData();
    }
  }, [localInvoice, invoiceId, locationId, totalSamples, technicianName]);

  const handleBasicInput = (sampleIndex: number, field: keyof SamplePCRData, value: string) => {
    setSamplesData((prev) => {
      const updated = [...prev];
      (updated[sampleIndex] as any)[field] = value;
      return updated;
    });
  };

  const handlePathogenChange = (
    sampleIndex: number,
    pathogenIndex: number,
    field: keyof Omit<PathogenResult, "name">,
    value: string
  ) => {
    setSamplesData((prev) => {
      const updated = [...prev];
      const pathogens = [...updated[sampleIndex].pathogens];
      pathogens[pathogenIndex] = { ...pathogens[pathogenIndex], [field]: value };
      updated[sampleIndex] = { ...updated[sampleIndex], pathogens };
      return updated;
    });
  };

  const handleImageUpload = async (sampleIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(sampleIndex);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        alert("Cloudinary config missing");
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append("file", file);
      formDataObj.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formDataObj }
      );
      const data = await res.json();

      if (data.secure_url) {
        setGelImages((prev) => ({ ...prev, [sampleIndex + 1]: data.secure_url }));
      } else {
        alert("Upload failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed");
    } finally {
      setUploading(null);
    }
  };

  const saveAllData = async () => {
    if (!invoiceId || !locationId || !localInvoice?.docId) {
      alert("Cannot save: Invoice not loaded or missing ID");
      return;
    }

    try {
      const savePromises = samplesData.map(async (sample, index) => {
        const sampleNum = index + 1;
        const ref = doc(
          db,
          "locations",
          locationId,
          "invoices",
          localInvoice.docId,
          "pcr_reports",
          `sample_${sampleNum}`
        );

        await setDoc(ref, {
          sampleNumber: sampleNum,
          ...farmerInfo,
          sampleCode: sample.sampleCode,
          sampleType: sample.sampleType,
          pathogens: sample.pathogens,
          gelImageUrl: gelImages[sampleNum] || "",
          updatedAt: new Date().toISOString(),
          checkedBy: checkedBy.trim() || technicianName || "N/A",
        }, { merge: true });
      });

      await Promise.all(savePromises);

      // Also save checkedBy to main invoice
      const invoiceRef = doc(db, "locations", locationId, "invoices", localInvoice.docId);
      await updateDoc(invoiceRef, {
        checkedBy: checkedBy.trim() || technicianName || "N/A",
      });

      onSubmit();
    } catch (err) {
      console.error("Error saving PCR reports:", err);
      alert("Failed to save PCR data");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-600">
        Loading PCR data...
      </div>
    );
  }

  if (totalSamples === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No PCR samples in this invoice.
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-10 text-blue-900 text-center">
        RT-qPCR Analysis – All Samples ({totalSamples})
      </h2>

      {/* Shared Farmer Info */}
      <section className="mb-10 bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-xl mb-5 text-gray-800">Farmer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(farmerInfo).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                {key === "sampleCollectionTime"
                  ? "Sample Collection Time"
                  : key === "dateOfCulture"
                  ? "Sample Collection Time"
                  : key === "docDifference"
                  ? "DOC"
                  : key === "noOfSamples"
                  ? "No. of Samples"
                  : key === "address"
                  ? "Address"             
                  : key.replace(/([A-Z])/g, " $1").trim()}
              </label>

              {key === "sampleCollectionTime" || key === "reportDate" ? (
                <input
                  type="date"
                  value={value}
                  onChange={(e) =>
                    setFarmerInfo((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              ) : key === "docDifference" ? (
                <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) =>
        setFarmerInfo((prev) => ({ ...prev, [key]: e.target.value }))
      }
      className="w-full border border-gray-300 rounded px-4 py-3 focus:ring-2 focus:ring-blue-500 pr-24"
      placeholder="e.g. 15 days"
    />
    
  </div>
              ) : key === "noOfSamples" || key === "farmerId" ? (
                <input
                  type="text"
                  value={value}
                  readOnly
                  className="w-full border bg-gray-100 rounded px-4 py-3 cursor-not-allowed"
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    setFarmerInfo((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <hr className="my-12 border-gray-300" />

      {/* Each Sample Section */}
      {samplesData.map((sample, sampleIndex) => {
        const sampleNum = sampleIndex + 1;

        const selectedForThisSample = localInvoice?.samplePathogens?.[sampleNum] || [];
        const selectedNames = selectedForThisSample.map(
          (id: string) => PATHOGEN_NAME_MAP[id] || id
        );

        return (
          <section key={sampleIndex} className="mb-16 pb-12 border-b-2 border-gray-200 last:border-0">
            <h3 className="text-2xl font-bold mb-8 text-blue-800">
              Sample {sampleNum}
            </h3>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Pathogens selected for Sample {sampleNum}:
              </p>
              {selectedNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedNames.map((name, i) => (
                    <span
                      key={i}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {name === "PL EHP" ? "EHP" : name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No pathogens selected for this sample
                </p>
              )}
            </div>

            <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium mb-1">Sample Code</label>
                <input
                  value={sample.sampleCode}
                  onChange={(e) => handleBasicInput(sampleIndex, "sampleCode", e.target.value)}
                  placeholder="e.g., S001-PCR"
                  className="w-full border rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sample Type</label>
                <input
                  value={sample.sampleType}
                  onChange={(e) => handleBasicInput(sampleIndex, "sampleType", e.target.value)}
                  placeholder="PL / Water / Soil"
                  className="w-full border rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-10">
              <h4 className="font-semibold text-lg mb-5">Pathogen Results</h4>
              {sample.pathogens.length === 0 ? (
                <p className="text-gray-500 italic">No pathogens selected for this sample.</p>
              ) : (
                <div className="space-y-5">
                  {sample.pathogens.map((p, i) => (
                    <div key={i} className="grid grid-cols-3 gap-6 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pathogen</label>
                        <input
                          value={p.name === "PL EHP" ? "EHP" : p.name}
                          disabled
                          className="w-full border bg-gray-100 rounded px-4 py-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Result</label>
                        <select
                          value={p.result}
                          onChange={(e) =>
                            handlePathogenChange(sampleIndex, i, "result", e.target.value)
                          }
                          className="w-full border rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                          <option value="Suspect">Suspect</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CT Value</label>
                        <input
                          placeholder="e.g., 25.4"
                          value={p.ctValue}
                          onChange={(e) =>
                            handlePathogenChange(sampleIndex, i, "ctValue", e.target.value)
                          }
                          className="w-full border rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-12">
              <h4 className="font-semibold text-lg mb-4">Gel Electrophoresis Image</h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(sampleIndex, e)}
                disabled={uploading === sampleIndex}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading === sampleIndex && <p className="mt-2 text-sm text-blue-600">Uploading image...</p>}
              {gelImages[sampleNum] && (
                <div className="mt-6">
                  <img
                    src={gelImages[sampleNum]}
                    alt={`Gel image for Sample ${sampleNum}`}
                    className="max-w-lg rounded-lg border shadow-lg"
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}

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

      <div className="text-center mt-12">
        <button
          onClick={saveAllData}
          disabled={uploading !== null}
          className="px-12 py-5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-xl rounded-lg shadow-xl transition"
        >
          Save All PCR Reports & Continue
        </button>
      </div>
    </div>
  );
}