import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import SoilForm from "../components/forms/SoilForm";
import WaterForm from "../components/forms/WaterForm";
import PLForm from "@/components/forms/PLForm";
import PCRForm from "@/components/forms/PCRForm";
import MicrobiologyForm from "@/components/forms/MicrobiologyForm";

import SoilReport from "../components/reports/SoilReport";
import WaterReport from "../components/reports/WaterReport";
import PLReport from "@/components/reports/PLReport";
import PCRReport from "@/components/reports/PCRReport";
import MicrobiologyReport from "@/components/reports/MicrobiologyReport";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { useUserSession } from "../contexts/UserSessionContext";
import { useSearchParams } from "react-router-dom";

export default function LabResults() {
  const [invoice, setInvoice] = useState<any>(null);
  const { session } = useUserSession();
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [currentType, setCurrentType] = useState<string | null>(null);
  const [step, setStep] = useState("loading");
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [activeEnvReport, setActiveEnvReport] = useState<string | null>(null);

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
      startFlow(fullData);
    } else {
      console.error("Invoice not found");
      setStep("error");
    }
  };

  const startFlow = (data: any) => {
    const types = data.sampleType || [];
    const progress = data.reportsProgress || {};

    const soil = types.find((t: any) => t?.type?.toLowerCase() === "soil");
    const water = types.find((t: any) => t?.type?.toLowerCase() === "water");
    const pl = types.find((t: any) => t?.type?.toLowerCase() === "pl");
    const pcr = types.find((t: any) => t?.type?.toLowerCase() === "pcr");
    const micro = types.find((t: any) => t?.type?.toLowerCase() === "microbiology");

    const allCompleted =
      (!soil || progress.soil === "completed") &&
      (!water || progress.water === "completed") &&
      (!pl || progress.pl === "completed") &&
      (!pcr || progress.pcr === "completed") &&
      (!micro || progress.microbiology === "completed");

    if (isEditMode) {
      if (soil) { setCurrentType("soil"); setStep("soilForm"); return; }
      if (water) { setCurrentType("water"); setStep("waterForm"); return; }
      if (pl) { setCurrentType("pl"); setStep("plForm"); return; }
      if (pcr) { setCurrentType("pcr"); setStep("pcrForm"); return; }
      if (micro) { setCurrentType("microbiology"); setStep("microbiologyForm"); return; }
    }

    if (allCompleted) {
      setStep("viewReports");
      if (soil) setActiveEnvReport("soil");
      else if (water) setActiveEnvReport("water");
      else if (micro) setActiveEnvReport("microbiology");
      else setActiveEnvReport("pathology");
      return;
    }

    if (soil && progress.soil !== "completed") {
      setCurrentType("soil"); setStep("soilForm");
    } else if (water && progress.water !== "completed") {
      setCurrentType("water"); setStep("waterForm");
    } else if (pl && progress.pl !== "completed") {
      setCurrentType("pl"); setStep("plForm");
    } else if (pcr && progress.pcr !== "completed") {
      setCurrentType("pcr"); setStep("pcrForm");
    } else if (micro && progress.microbiology !== "completed") {
      setCurrentType("microbiology"); setStep("microbiologyForm");
    } else {
      setStep("viewReports");
    }
  };

  const updateProgress = async (type: string) => {
    if (!invoice?.docId) return;
    const ref = doc(db, "locations", session.locationId, "invoices", invoice.docId);
    await updateDoc(ref, {
      reportsProgress: { ...(invoice.reportsProgress || {}), [type]: "completed" },
    });
    setInvoice((prev: any) => ({
      ...prev,
      reportsProgress: { ...(prev.reportsProgress || {}), [type]: "completed" },
    }));
  };

  const handleTypeClick = (type: string) => {
    setCurrentType(type);
    if (isEditMode) {
      setStep(type + "Form");
      return;
    }
    const progress = invoice.reportsProgress?.[type];
    if (["soil", "water", "microbiology"].includes(type) && progress === "completed") {
      setStep(type + "Report");
    } else if (["pl", "pcr"].includes(type) && progress === "completed") {
      if ((!hasPL || invoice.reportsProgress?.pl === "completed") && (!hasPCR || invoice.reportsProgress?.pcr === "completed")) {
        setStep("pathologyReport");
      } else {
        setStep(type + "Form");
      }
    } else {
      setStep(type + "Form");
    }
  };

  const checkPathologyCompletion = (justCompletedType?: string) => {
    let tempProgress = { ...(invoice.reportsProgress || {}) };
    if (justCompletedType) tempProgress[justCompletedType] = "completed";

    const plDone = !hasPL || tempProgress.pl === "completed";
    const pcrDone = !hasPCR || tempProgress.pcr === "completed";

    if (plDone && pcrDone) {
      setStep("pathologyReport");
    } else if (!plDone) {
      setCurrentType("pl"); setStep("plForm");
    } else if (!pcrDone) {
      setCurrentType("pcr"); setStep("pcrForm");
    }
  };

  const soilCount = Number(invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "soil")?.count || 0);
  const waterCount = Number(invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "water")?.count || 0);
  const plCount = Number(invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "pl")?.count || 0);
  const pcrCount = Number(invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "pcr")?.count || 0);
  const microCount = Number(invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "microbiology")?.count || 0);

  const hasSoil = soilCount > 0;
  const hasWater = waterCount > 0;
  const hasPL = plCount > 0;
  const hasPCR = pcrCount > 0;
  const hasMicro = microCount > 0;
  const hasPathology = hasPL || hasPCR;

  const isViewingReports = step === "viewReports";

  if (!invoice || step === "loading") return <p className="text-center py-12 text-lg">Loading invoice...</p>;
  if (step === "error") return <p className="text-center py-12 text-red-600 text-xl">Invoice or samples not found.</p>;

  const showTopButtons = !isViewingReports;

  const combinedPrintStyles = `
  @media print {
    .pl-page { 
      ${hasPL && hasPCR ? 'page-break-after: always !important;' : ''} 
    }
    .pcr-page { 
      ${hasPL && hasPCR ? 'page-break-before: always !important;' : ''} 
    }
    .pl-tight-bottom { 
      margin-bottom: 1rem !important; 
      padding-bottom: 0 !important; 
    }
    .signature-section {
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
    }

    /* REMOVE BROWSER HEADER/FOOTER (TITLE, URL, DATE, PAGE NO) */
    @page {
      size: A4 portrait;
      margin: 1cm;
      /* These rules remove the default header/footer */
      @top-left { content: none; }
      @top-center { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-center { content: none; }
      @bottom-right { content: none; }
    }

    table, img, div, section { 
      page-break-inside: avoid !important; 
    }

    /* Hide any accidental headers */
    .print\\:hidden { display: none !important; }
  }
`;

  const renderSignatureAndNote = () => (
    <div className="mt-20 border-t-2 border-black pt-8 signature-section">
      <div className="flex justify-between text-sm px-10 mb-10">
        <div>
          <p className="font-semibold">Reported by:</p>
          <p className="mt-8 font-medium">{session?.technicianName || ""}</p>
        </div>
        <div>
          <p className="font-semibold">Checked by:</p>
          <p className="mt-8">______________________</p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-700">
        <p>
          <strong>Note:</strong> The samples brought by Farmer, the Results Reported above are meant for Guidance only for Aquaculture purpose, Not for any Litigation.
        </p>
      </div>
    </div>
  );

  const renderPathologyReport = () => (
    <>
      <style>{combinedPrintStyles}</style>
{hasPL && (
  <div className={hasPL && hasPCR ? "pl-page" : ""}>
    <div className={hasPL && hasPCR ? "pl-tight-bottom" : ""}>
      {/* Hide signature in PLReport when combined with PCR */}
      <PLReport 
        invoiceId={invoiceId!} 
        locationId={session.locationId} 
        allSampleCount={plCount}
        showSignature={!hasPCR}
      />
    </div>
  </div>
)}

      {hasPCR && (
        <div className={hasPL && hasPCR ? "pcr-page" : ""}>
          <PCRReport
            invoiceId={invoiceId!}
            locationId={session.locationId}
            allSampleCount={pcrCount}
            compact={hasPL && hasPCR}
          />

          {/* Single signature — always shown after PCR */}
          {renderSignatureAndNote()}
        </div>
      )}
    </>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto relative pb-24">
      {showTopButtons && (
        <>
          <div className="overflow-x-auto pb-4 mb-8">
            <div className="flex gap-4 justify-center min-w-max px-4">
              {invoice.sampleType?.map((s: any) => {
                const type = s.type.toLowerCase();
                const completed = invoice?.reportsProgress?.[type] === "completed";
                const count = s.count || 0;
                if (count === 0) return null;

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeClick(type)}
                    className={`px-3 py-2 rounded-xl border-4 font-bold text-md transition-all shadow-lg whitespace-nowrap ${
                      completed
                        ? "bg-green-600 text-white hover:bg-green-700 border-green-800"
                        : currentType === type
                        ? "bg-yellow-400 border-yellow-600 text-gray-900 ring-4 ring-yellow-300"
                        : "bg-yellow-300 hover:bg-yellow-400 border-yellow-600 text-gray-800"
                    }`}
                  >
                    {s.type.toUpperCase()} ({count}) - {completed ? "Completed" : "Pending"}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-gray-600 mb-8 text-lg">
            Click a button to enter results for <strong>all samples</strong> of that type on one page.
          </p>
        </>
      )}

      {/* Forms */}
      {step === "soilForm" && hasSoil && <SoilForm invoice={invoice} invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("soil"); setStep("soilReport"); }} />}
      {step === "waterForm" && hasWater && <WaterForm invoice={invoice} invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("water"); setStep("waterReport"); }} />}
      {step === "plForm" && hasPL && <PLForm invoice={invoice} invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("pl"); checkPathologyCompletion("pl"); }} />}
      {step === "pcrForm" && hasPCR && <PCRForm invoice={invoice} invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("pcr"); checkPathologyCompletion("pcr"); }} />}
      {step === "microbiologyForm" && hasMicro && <MicrobiologyForm invoice={invoice} invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("microbiology"); setStep("microbiologyReport"); }} />}

      {/* Individual Previews */}
      {step === "soilReport" && <div id="printable-report"><SoilReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={soilCount} /></div>}
      {step === "waterReport" && <div id="printable-report"><WaterReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={waterCount} /></div>}
      {step === "microbiologyReport" && <div id="printable-report"><MicrobiologyReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={microCount} /></div>}

      {/* Pathology Preview during entry */}
      {step === "pathologyReport" && <div id="printable-report">{renderPathologyReport()}</div>}

      {/* Final Reports View */}
      {isViewingReports && (
        <div>
          <div className="overflow-x-auto pb-4 mb-10">
            <div className="flex gap-4 justify-center min-w-max px-4">
              {hasSoil && <button onClick={() => setActiveEnvReport("soil")} className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${activeEnvReport === "soil" ? "bg-green-700 text-white border-green-900" : "bg-green-600 text-white hover:bg-green-700 border-green-800"}`}>SOIL REPORT</button>}
              {hasWater && <button onClick={() => setActiveEnvReport("water")} className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${activeEnvReport === "water" ? "bg-green-700 text-white border-green-900" : "bg-green-600 text-white hover:bg-green-700 border-green-800"}`}>WATER REPORT</button>}
              {hasMicro && <button onClick={() => setActiveEnvReport("microbiology")} className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${activeEnvReport === "microbiology" ? "bg-green-700 text-white border-green-900" : "bg-green-600 text-white hover:bg-green-700 border-green-800"}`}>MICROBIOLOGY REPORT</button>}
              {hasPathology && <button onClick={() => setActiveEnvReport("pathology")} className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${activeEnvReport === "pathology" ? "bg-green-700 text-white border-green-900" : "bg-green-600 text-white hover:bg-green-700 border-green-800"}`}>PL/PCR REPORT</button>}
            </div>
          </div>

          <div id="printable-report" className="mt-8">
            {activeEnvReport === "soil" && <SoilReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={soilCount} />}
            {activeEnvReport === "water" && <WaterReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={waterCount} />}
            {activeEnvReport === "microbiology" && <MicrobiologyReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={microCount} />}
            {activeEnvReport === "pathology" && renderPathologyReport()}
          </div>
        </div>
      )}
    </div>
  );
}