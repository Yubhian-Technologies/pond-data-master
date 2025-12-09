import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SoilForm from "../components/forms/SoilForm";
import WaterForm from "../components/forms/WaterForm";
import SoilReport from "../components/reports/SoilReport";
import WaterReport from "../components/reports/WaterReport";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUserSession } from "../contexts/UserSessionContext";


export default function LabResults() {
  const [invoice, setInvoice] = useState(null);
  const { session } = useUserSession();
  const { invoiceId } = useParams();

  const [currentType, setCurrentType] = useState(null); // soil | water
  const [currentIndex, setCurrentIndex] = useState(1);
  const [step, setStep] = useState("loading");

  useEffect(() => {
    if (!session?.locationId || !invoiceId) return;
    fetchInvoice();
  }, [session, invoiceId]);

  const fetchInvoice = async () => {
    const ref = collection(db, "locations", session.locationId, "invoices");
    const q = query(ref, where("id", "==", invoiceId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const docData = docSnap.data();
      const docId = docSnap.id;

      const fullData = { ...docData, docId };
      setInvoice(fullData);
      console.log(fullData);

      startFlow(fullData);
    } else {
      console.error("Invoice not found");
      setStep("error");
    }
  };

  const startFlow = (data) => {
  const types = data.sampleType || [];

  const soil = types.find((t) => (t?.type ?? "").toLowerCase().trim() === "soil");
const water = types.find((t) => (t?.type ?? "").toLowerCase().trim() === "water");


  const progress = data.reportsProgress || {};

  console.log("soil:", soil, "water:", water, "progress:", progress);

  if (progress.soil === "completed" && progress.water === "completed") {
    setStep("waterReport");
    return;
  }

  if (progress.soil === "completed" && water) {
    setCurrentType("water");
    setStep("waterForm");
    return;
  }

  if (progress.water === "completed" && soil) {
    setCurrentType("soil");
    setStep("soilForm");
    return;
  }

  if (soil) {
    setCurrentType("soil");
    setStep("soilForm");
    return;
  }

  if (water) {
    setCurrentType("water");
    setStep("waterForm");
    return;
  }

  // fallback
  setStep("error");
};


  const handleSoilSubmit = async () => {
    const maxCount = Number(invoice.sampleType.find((t) => t.type === "soil")?.count);

    if (currentIndex < maxCount) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    const ref = doc(db, "locations", session.locationId, "invoices", invoice.docId);
    await updateDoc(ref, {
      reportsProgress: { ...(invoice.reportsProgress || {}), soil: "completed", water: "pending" },
    });

    setInvoice((prev) => ({
      ...prev,
      reportsProgress: { soil: "completed", water: "pending" },
    }));

    setStep("soilReport");
  };

  const handleWaterSubmit = async () => {
    const maxCount = Number(invoice.sampleType.find((t) => t.type === "water")?.count);

    if (currentIndex < maxCount) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    const ref = doc(db, "locations", session.locationId, "invoices", invoice.docId);
    await updateDoc(ref, {
      reportsProgress: { soil: "completed", water: "completed" },
    });

    setInvoice((prev) => ({
      ...prev,
      reportsProgress: { soil: "completed", water: "completed" },
    }));

    setStep("waterReport");
  };

  const handleTypeClick = (type) => {
    setCurrentType(type);
    setCurrentIndex(1);
    setStep(type === "soil" ? "soilForm" : "waterForm");
  };

  if (!invoice || step === "loading") return <p>Loading...</p>;

  return (
    <div className="p-6">

      {/* ─────────── TOP SAMPLE TYPE PROGRESS BAR UI ─────────── */}
      <div className="flex gap-4 mb-6">
        {invoice.sampleType?.map((s) => {
          const completed = invoice?.reportsProgress?.[s.type] === "completed";
          return (
            <button
              key={s.type}
              onClick={() => handleTypeClick(s.type)}
              className={`px-4 py-3 rounded-lg border font-semibold ${
                completed ? "bg-green-600 text-white" : "bg-yellow-300"
              }`}
            >
              {s.type.toUpperCase()} ({s.count}) - {completed ? "Completed" : "Pending"}
            </button>
          );
        })}
      </div>

      {/* ─────────── DYNAMIC FORM INVOKING ─────────── */}
      {step === "soilForm" && currentType === "soil" && (
        <SoilForm
     
          invoice={invoice}
          invoiceId={invoiceId}
          locationId={session.locationId}
          onSubmit={handleSoilSubmit}
        />
      )}

      {step === "soilReport" && (
        <SoilReport/>
      )}

      {step === "waterForm" && currentType === "water" && (
        <WaterForm
          sampleNumber={currentIndex}
          invoice={invoice}
          invoiceId={invoiceId}
          locationId={session.locationId}
          onSubmit={handleWaterSubmit}
        />
      )}

      {step === "waterReport" && (
        <WaterReport
      
        />
      )}
    </div>
  );
}
