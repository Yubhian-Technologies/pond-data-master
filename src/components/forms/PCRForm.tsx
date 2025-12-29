import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../pages/firebase";

interface FarmerInfo {
  farmerName: string;
  village: string;
  mobile: string;
  date: string;
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
  invoice: any;
  invoiceId: string;
  locationId: string;
  onSubmit: () => void;
}

export default function PCRForm({
  invoice,
  invoiceId,
  locationId,
  onSubmit,
}: PCRFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const totalSamples =
    Number(
      invoice?.sampleType?.find((s: any) => s.type?.toLowerCase() === "pcr")?.count || 0
    );

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo>({
    farmerName: invoice?.farmerName || "",
    village: invoice?.village || "",
    mobile: invoice?.farmerPhone || invoice?.mobile || "",
    date: invoice?.formattedDate || today,
  });

  const [samplesData, setSamplesData] = useState<SamplePCRData[]>([]);
  const [gelImages, setGelImages] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const PATHOGEN_NAME_MAP: Record<string, string> = {
    pl_ehp: "PL EHP",
    soil_ehp: "Soil EHP",
    water_ehp: "Water EHP",
    pl_wssv: "WSSV",
    pl_vibrio_pcr: "VIBRIO",
    pl_ihhnv: "IHHNV",
  };

  // Load all PCR samples
  useEffect(() => {
    const loadAllData = async () => {
      if (!invoice || !invoiceId || !locationId || totalSamples === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const loadedSamples: SamplePCRData[] = [];

        for (let i = 1; i <= totalSamples; i++) {
          const pcrDocRef = doc(
            db,
            "locations",
            locationId,
            "invoices",
            invoiceId,
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
          } else {
            // New sample — initialize pathogens from invoice
            const samplePathogens = invoice?.samplePathogens?.[i] || [];

            const initialPathogens = samplePathogens.map((testId: string) => ({
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
      } catch (err) {
        console.error("Error loading PCR data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [invoice, invoiceId, locationId, totalSamples]);

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
    if (!invoiceId || !locationId) {
      alert("Missing invoice/location info");
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
          invoiceId,
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
        });
      });

      await Promise.all(savePromises);
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
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <input
                value={value}
                onChange={(e) =>
                  setFarmerInfo((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-4 py-3 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </section>

      <hr className="my-12 border-gray-300" />

      {/* Each Sample Section */}
      {samplesData.map((sample, sampleIndex) => {
        const sampleNum = sampleIndex + 1;

        return (
          <section key={sampleIndex} className="mb-16 pb-12 border-b-2 border-gray-200 last:border-0">
            <h3 className="text-2xl font-bold mb-8 text-blue-800">
              Sample {sampleNum}
            </h3>

            {/* Sample Details */}
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

            {/* Pathogens */}
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
                          value={p.name}
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

            {/* Gel Image */}
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

      {/* Final Submit */}
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