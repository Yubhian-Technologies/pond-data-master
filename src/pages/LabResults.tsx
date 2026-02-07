import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

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
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';
import { Download } from "lucide-react";

export default function LabResults() {
  const [invoice, setInvoice] = useState<any>(null);
  const { session } = useUserSession();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const [currentType, setCurrentType] = useState<string | null>(null);
  const [checkedByName, setCheckedByName] = useState<string>("");
  const [step, setStep] = useState("loading");
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [activeEnvReport, setActiveEnvReport] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.locationId || !invoiceId) return;
    fetchInvoice();
  }, [session, invoiceId]);

  const fetchInvoice = async () => {
    const ref = collection(db, "locations", session.locationId, "invoices");

    let q = query(ref, where("invoiceId", "==", invoiceId));
    let snap = await getDocs(q);

    if (snap.empty) {
      q = query(ref, where("id", "==", invoiceId));
      snap = await getDocs(q);
    }

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const docData = docSnap.data();
      const docId = docSnap.id;

      if ('id' in docData) {
        delete (docData as any).id;
      }

      const fullData = { ...docData, docId };
      setInvoice(fullData);
      startFlow(fullData);
      setCheckedByName(docData.checkedBy || "______________________");
    } else {
      console.error("Invoice not found even in fallback query");
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
    if (type.toLowerCase() === "wssv") return;

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

    @page {
      size: A4 portrait;
      margin: 1cm;
    }

    table, img, div, section { 
      page-break-inside: avoid !important; 
    }

    .print\\:hidden { display: none !important; }
  }
`;

  const renderSignatureAndNote = () => (
    <div className="signature-section mt-12 print:mt-8">
      <div className="border-t-2 border-black pt-8">
        <div className="flex justify-between text-sm px-10 mb-10">
          <div>
            <p className="font-semibold">Reported by:</p>
            <p className="mt-8 font-medium">{session?.technicianName || ""}</p>
          </div>
          <div>
            <p className="font-semibold">Checked by:</p>
            <p className="mt-8 font-semibold">{checkedByName}</p>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-800 mt-8 px-4">
        {(hasPCR || hasPathology) && (
          <p className="font-bold mb-4">
            <strong className="text-red-600">Important Note :</strong> EHP - Enterocytozoon hepatopanaei, WSSV - White spot syndrome virus, 
            IHHNV - Infectious hypodermal and hematopoietic necrosis virus, VIBRIO - Vibrio parahaemolyticus 
            and Vibrio harveyi
          </p>
        )}
        <p className="font-bold mb-2 text-red-600">Note:</p>
        <p className="mb-4">
          PL: Post Larve, MGR: Muscle Gut Ratio, SHG: Swollen Hind Gut, HP: Hepatopancreas, F: Full, S: Shrunken,
          FBI: Filamentous Bacterial Infection, PZ: Protozoal Infection, Infection Level: Light: &lt;10%, Moderate: 10 to 30%, Heavy:40%
        </p>

        <p className="font-bold mb-2 text-red-600">PL Quality Selection - Scoring</p>
        <p className="mb-4">
          <span className="text-red-600 font-bold">Rostral Spines:</span> 15 Points (&gt;4 Spines), Average Length: 10 points(&gt;11mm), Size Variation: 10 points (&lt;10%), Muscle Gut Ratio: 15 points (&gt;4:1
          Spine), Hepatopancreas: 15 points (Full), Necrosis: 10 points (Absent) Fouling: 10 points (Absent), Swollen Hind Gut: 15 points (Absent)
        </p>

        <p className="mt-6">
          <span className="text-red-600 font-bold">Note:</span> The samples brought by Farmer, the Results Reported above are meant for guidance only for Aquaculture Purpose. Not for any Litigation.
        </p>
      </div>

      <div className="text-center mt-16 text-red-600 font-bold">
        TWL ADC committed for Complete farming Solutions
      </div>
    </div>
  );

  const renderPathologyReportContent = () => (
    <>
      {hasPL && (
        <div className={hasPL && hasPCR ? "pl-page pl-tight-bottom" : ""}>
          <PLReport 
            invoiceId={invoiceId!} 
            locationId={session.locationId} 
            allSampleCount={plCount}
            showSignature={false}
          />
        </div>
      )}

      {hasPCR && (
        <div className={hasPL && hasPCR ? "pcr-page" : ""}>
          <PCRReport
            invoiceId={invoiceId!}
            locationId={session.locationId}
            allSampleCount={pcrCount}
            compact={hasPL && hasPCR}
            showAllSamples={true}
          />
        </div>
      )}

      {renderSignatureAndNote()}
    </>
  );

  const handleDownloadJpeg = async () => {
  if (!reportRef.current) {
    alert("Report not ready. Please wait or try again.");
    return;
  }

  const element = reportRef.current;

  // ────────────────────────────────────────────────
  // Find problematic containers (wide tables usually wrapped in overflow-x-auto)
  // ────────────────────────────────────────────────
  const scrollContainers = element.querySelectorAll('.overflow-x-auto');

  // Save original styles
  const originalElementStyles = {
    overflow: element.style.overflow,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    position: element.style.position,
  };

  const originalScrollStyles: { [key: string]: string }[] = [];

  scrollContainers.forEach((container) => {
    const el = container as HTMLElement;
    originalScrollStyles.push({
      overflowX: el.style.overflowX,
      overflow: el.style.overflow,
      width: el.style.width,
      maxWidth: el.style.maxWidth,
    });
  });

  try {
    // ────────────────────────────────────────────────
    // Force full visibility — remove scrollbars & constraints
    // ────────────────────────────────────────────────
    element.style.overflow = 'hidden';
    element.style.width = 'auto';
    element.style.maxWidth = 'none';
    element.style.position = 'relative';

    scrollContainers.forEach((container) => {
      const el = container as HTMLElement;
      el.style.overflowX = 'visible';
      el.style.overflow = 'visible';
      el.style.width = 'auto';
      el.style.maxWidth = 'none';
    });

    await new Promise(r => setTimeout(r, 500)); 

    const fullWidth = Math.max(element.scrollWidth, 794); // min A4 width ~794px @96dpi
    const fullHeight = element.scrollHeight;

    const dataUrl = await htmlToImage.toJpeg(element, {
      quality: 0.92,
      backgroundColor: '#ffffff',
      canvasWidth: fullWidth * 1.5,
      canvasHeight: fullHeight * 1.5,
      pixelRatio: 1.5,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        const style = window.getComputedStyle(node);
        // Hide anything that looks like a scrollbar or hidden
        return !(
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          node.classList.contains('print:hidden') ||
          node.id === 'print-buttons' ||
          node.id === 'view-mode-nav' ||
          // Extra safety: hide typical scrollbar pseudo-elements if rendered as nodes
          node.classList.contains('scrollbar') ||
          node.classList.contains('::-webkit-scrollbar')
        );
      }
    });

    saveAs(dataUrl, `Lab-Report_${invoiceId || 'report'}.jpg`);
  } catch (err) {
    console.error("JPEG download failed:", err);
    alert("Failed to generate JPEG.\nTry using Print → Save as PDF instead.");
  } finally {
    // ────────────────────────────────────────────────
    // Restore ALL original styles
    // ────────────────────────────────────────────────
    element.style.overflow = originalElementStyles.overflow || '';
    element.style.width = originalElementStyles.width || '';
    element.style.maxWidth = originalElementStyles.maxWidth || '';
    element.style.position = originalElementStyles.position || '';

    scrollContainers.forEach((container, index) => {
      const el = container as HTMLElement;
      const orig = originalScrollStyles[index];
      if (orig) {
        el.style.overflowX = orig.overflowX || '';
        el.style.overflow = orig.overflow || '';
        el.style.width = orig.width || '';
        el.style.maxWidth = orig.maxWidth || '';
      }
    });
  }
};

  return (
  <div className="p-6 max-w-7xl mx-auto relative pb-24">
    <style>{combinedPrintStyles}</style>

    {/* Top navigation / type selection buttons — only in entry/edit mode */}
    {showTopButtons && (
      <>
        <div className="overflow-x-auto pb-4 mb-8 print:hidden">
          <div className="flex gap-4 justify-center min-w-max px-4">
            <button
              onClick={() => navigate("/samples")}
              className="px-3 py-2 rounded-xl font-bold text-md transition-all shadow-lg bg-red-500 hover:bg-red-600 text-white"
            >
              BACK TO SAMPLES
            </button>

            {invoice.sampleType?.map((s: any) => {
              const type = s.type.toLowerCase();
              const completed = invoice?.reportsProgress?.[type] === "completed";
              const count = s.count || 0;

              if (type === "wssv" || count === 0) return null;

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

        <p className="text-center text-gray-600 mb-8 text-lg print:hidden">
          Click a button to enter results for <strong>all samples</strong> of that type on one page.
        </p>
      </>
    )}

    {/* ────────────────────────────────────────────────
        REPORT VIEWING MODE HEADER CONTROLS
        Download button + immediately below it: report selector buttons
    ──────────────────────────────────────────────── */}
    {isViewingReports && (
      <div className="mb-8 print:hidden">
        {/* Download button first */}
        <div className="flex justify-center mb-6" id="print-buttons">
          <button
            onClick={handleDownloadJpeg}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition"
          >
            <Download size={20} />
            Download Full Report as JPEG
          </button>
        </div>

        {/* Right below it: the report type selector buttons + BACK */}
        <div className="overflow-x-auto pb-4" id="view-mode-nav">
          <div className="flex gap-4 justify-center min-w-max px-4">
            <button
              onClick={() => navigate("/samples")}
              className="px-5 py-1.5 rounded-xl font-bold text-md transition-all shadow-lg bg-red-500 hover:bg-red-600 text-white"
            >
              BACK
            </button>

            {hasSoil && (
              <button
                onClick={() => setActiveEnvReport("soil")}
                className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${
                  activeEnvReport === "soil"
                    ? "bg-green-700 text-white border-green-900"
                    : "bg-green-600 text-white hover:bg-green-700 border-green-800"
                }`}
              >
                SOIL REPORT
              </button>
            )}
            {hasWater && (
              <button
                onClick={() => setActiveEnvReport("water")}
                className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${
                  activeEnvReport === "water"
                    ? "bg-green-700 text-white border-green-900"
                    : "bg-green-600 text-white hover:bg-green-700 border-green-800"
                }`}
              >
                WATER REPORT
              </button>
            )}
            {hasMicro && (
              <button
                onClick={() => setActiveEnvReport("microbiology")}
                className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${
                  activeEnvReport === "microbiology"
                    ? "bg-green-700 text-white border-green-900"
                    : "bg-green-600 text-white hover:bg-green-700 border-green-800"
                }`}
              >
                MICROBIOLOGY REPORT
              </button>
            )}
            {hasPathology && (
              <button
                onClick={() => setActiveEnvReport("pathology")}
                className={`px-3 py-1.5 rounded-xl border-4 font-bold text-md transition-all shadow-lg ${
                  activeEnvReport === "pathology"
                    ? "bg-green-700 text-white border-green-900"
                    : "bg-green-600 text-white hover:bg-green-700 border-green-800"
                }`}
              >
                PL/PCR REPORT
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Download button in non-viewReports report preview steps (after form submit) */}
    {(!isViewingReports && (step === "pathologyReport" || step.includes("Report"))) && (
      <div className="flex justify-center mb-6 print:hidden" id="print-buttons">
        <button
          onClick={handleDownloadJpeg}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          <Download size={20} />
          Download Full Report as JPEG
        </button>
      </div>
    )}

    {/* The actual report content — this is captured for JPEG */}
    <div ref={reportRef} className="bg-white">
      {/* Forms */}
      {step === "soilForm" && hasSoil && <SoilForm invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("soil"); setStep("soilReport"); }} />}
      {step === "waterForm" && hasWater && <WaterForm invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("water"); setStep("waterReport"); }} />}
      {step === "plForm" && hasPL && <PLForm invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("pl"); checkPathologyCompletion("pl"); }} />}
      {step === "pcrForm" && hasPCR && <PCRForm invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("pcr"); checkPathologyCompletion("pcr"); }} />}
      {step === "microbiologyForm" && hasMicro && <MicrobiologyForm invoiceId={invoiceId!} locationId={session.locationId} onSubmit={() => { updateProgress("microbiology"); setStep("microbiologyReport"); }} />}

      {/* Single report previews */}
      {step === "soilReport" && <SoilReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={soilCount} />}
      {step === "waterReport" && <WaterReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={waterCount} />}
      {step === "microbiologyReport" && <MicrobiologyReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={microCount} />}

      {/* Pathology combined view */}
      {(step === "pathologyReport" || (isViewingReports && activeEnvReport === "pathology")) && renderPathologyReportContent()}

      {/* Individual reports when switching tabs in view mode */}
      {isViewingReports && activeEnvReport === "soil" && <SoilReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={soilCount} />}
      {isViewingReports && activeEnvReport === "water" && <WaterReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={waterCount} />}
      {isViewingReports && activeEnvReport === "microbiology" && <MicrobiologyReport invoiceId={invoiceId!} locationId={session.locationId} allSampleCount={microCount} />}
    </div>
  </div>
);
}