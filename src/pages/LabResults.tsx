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

  const [activeEnvReport, setActiveEnvReport] = useState<string>(null);

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
    const micro = types.find(
      (t: any) => t?.type?.toLowerCase() === "microbiology"
    );

    const allCompleted =
      (!soil || progress.soil === "completed") &&
      (!water || progress.water === "completed") &&
      (!pl || progress.pl === "completed") &&
      (!pcr || progress.pcr === "completed") &&
      (!micro || progress.microbiology === "completed");

    if (isEditMode) {
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
      if (pl) {
        setCurrentType("pl");
        setStep("plForm");
        return;
      }
      if (pcr) {
        setCurrentType("pcr");
        setStep("pcrForm");
        return;
      }
      if (micro) {
        setCurrentType("microbiology");
        setStep("microbiologyForm");
        return;
      }
    }

    if (allCompleted) {
      setStep("viewReports");
      if (soil) setActiveEnvReport("soil");
      else if (water) setActiveEnvReport("water");
      else if (micro) setActiveEnvReport("microbiology");
      else setActiveEnvReport("pathology");
      return;
    }

    // Default: go to first incomplete type
    if (soil && progress.soil !== "completed") {
      setCurrentType("soil");
      setStep("soilForm");
    } else if (water && progress.water !== "completed") {
      setCurrentType("water");
      setStep("waterForm");
    } else if (pl && progress.pl !== "completed") {
      setCurrentType("pl");
      setStep("plForm");
    } else if (pcr && progress.pcr !== "completed") {
      setCurrentType("pcr");
      setStep("pcrForm");
    } else if (micro && progress.microbiology !== "completed") {
      setCurrentType("microbiology");
      setStep("microbiologyForm");
    } else {
      setStep("viewReports");
    }
  };

  const updateProgress = async (type: string) => {
    if (!invoice?.docId) return;
    const ref = doc(
      db,
      "locations",
      session.locationId,
      "invoices",
      invoice.docId
    );
    await updateDoc(ref, {
      reportsProgress: {
        ...(invoice.reportsProgress || {}),
        [type]: "completed",
      },
    });

    setInvoice((prev: any) => ({
      ...prev,
      reportsProgress: { ...(prev.reportsProgress || {}), [type]: "completed" },
    }));
  };

  const handleSaveAllReports = async () => {
    if (!invoice?.docId) return;

    const updates: any = {};
    if (hasSoil) updates.soil = "completed";
    if (hasWater) updates.water = "completed";
    if (hasPL) updates.pl = "completed";
    if (hasPCR) updates.pcr = "completed";
    if (hasMicro) updates.microbiology = "completed";

    if (Object.keys(updates).length > 0) {
      const ref = doc(
        db,
        "locations",
        session.locationId,
        "invoices",
        invoice.docId
      );
      await updateDoc(ref, {
        reportsProgress: {
          ...(invoice.reportsProgress || {}),
          ...updates,
        },
      });

      setInvoice((prev: any) => ({
        ...prev,
        reportsProgress: { ...(prev.reportsProgress || {}), ...updates },
      }));
    }

    setStep("viewReports");
    if (hasSoil) setActiveEnvReport("soil");
    else if (hasWater) setActiveEnvReport("water");
    else if (hasMicro) setActiveEnvReport("microbiology");
    else if (hasPathology) setActiveEnvReport("pathology");
  };

  const handleTypeClick = (type: string) => {
  setCurrentType(type);

  // === NEW: In edit mode, ALWAYS go to the form, ignore completion ===
  if (isEditMode) {
    setStep(type + "Form");
    return;
  }

  // === Existing logic for normal (non-edit) mode only ===
  const progress = invoice.reportsProgress?.[type];
  if (progress === "completed" && ["soil", "water", "microbiology"].includes(type)) {
    setStep(type + "Report");
  } else if (progress === "completed" && ["pl", "pcr"].includes(type)) {
    if ((hasPL && invoice.reportsProgress?.pl === "completed") || !hasPL) {
      if ((hasPCR && invoice.reportsProgress?.pcr === "completed") || !hasPCR) {
        setStep("pathologyReport");
      } else {
        setStep(type + "Form");
      }
    } else {
      setStep(type + "Form");
    }
  } else {
    setStep(type + "Form");
  }
};

  const handleSoilSubmit = async () => {
    await updateProgress("soil");
    setStep("soilReport");
  };

  const handleWaterSubmit = async () => {
    await updateProgress("water");
    setStep("waterReport");
  };

  const handleMicroSubmit = async () => {
    await updateProgress("microbiology");
    setStep("microbiologyReport");
  };

  const handlePLSubmit = async () => {
    await updateProgress("pl");
    checkPathologyCompletion("pl");
  };

  const handlePCRSubmit = async () => {
    await updateProgress("pcr");
    checkPathologyCompletion("pcr");
  };

  const checkPathologyCompletion = (justCompletedType?: string) => {
    let tempProgress = { ...(invoice.reportsProgress || {}) };
    if (justCompletedType) {
      tempProgress[justCompletedType] = "completed";
    }

    const plCompleted = !hasPL || tempProgress.pl === "completed";
    const pcrCompleted = !hasPCR || tempProgress.pcr === "completed";

    if (plCompleted && pcrCompleted) {
      setStep("pathologyReport");
    } else if (!plCompleted) {
      setCurrentType("pl");
      setStep("plForm");
    } else if (!pcrCompleted) {
      setCurrentType("pcr");
      setStep("pcrForm");
    } else {
      setStep(null); // Go back to buttons
    }
  };

  // === UPDATED: Use actual counts saved in invoice (only samples with selected tests) ===
  const soilCount = Number(
    invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "soil")
      ?.count || 0
  );
  const waterCount = Number(
    invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "water")
      ?.count || 0
  );
  const plCount = Number(
    invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "pl")
      ?.count || 0
  );
  const pcrCount = Number(
    invoice?.sampleType?.find((t: any) => t.type?.toLowerCase() === "pcr")
      ?.count || 0
  );
  const microCount = Number(
    invoice?.sampleType?.find(
      (t: any) => t.type?.toLowerCase() === "microbiology"
    )?.count || 0
  );

  const hasSoil = soilCount > 0;
  const hasWater = waterCount > 0;
  const hasPL = plCount > 0;
  const hasPCR = pcrCount > 0;
  const hasMicro = microCount > 0;

  const hasEnvironmental = hasSoil || hasWater;
  const hasPathology = hasPL || hasPCR;

  const isViewingReports = step === "viewReports";

  if (!invoice || step === "loading")
    return <p className="text-center py-12 text-lg">Loading invoice...</p>;
  if (step === "error")
    return (
      <p className="text-center py-12 text-red-600 text-xl">
        Invoice or samples not found.
      </p>
    );

  const showTopButtons = !isViewingReports;

  return (
    <div className="p-6 max-w-7xl mx-auto relative pb-24">
      {/* Data Entry Buttons - Always show unless in full viewReports */}
      {showTopButtons && (
        <>
          <div className="overflow-x-auto pb-4 mb-8">
            <div className="flex gap-4 justify-center min-w-max px-4">
              {invoice.sampleType?.map((s: any) => {
                const type = s.type.toLowerCase();
                const completed =
                  invoice?.reportsProgress?.[type] === "completed";
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
                    {s.type.toUpperCase()} ({count}) -{" "}
                    {completed ? "Completed" : "Pending"}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-gray-600 mb-8 text-lg">
            Click a button to enter results for <strong>all samples</strong> of
            that type on one page.
          </p>
        </>
      )}

      {/* Forms */}
      {step === "soilForm" && hasSoil && (
        <SoilForm
          invoice={invoice}
          invoiceId={invoiceId!}
          locationId={session.locationId}
          onSubmit={handleSoilSubmit}
        />
      )}

      {step === "waterForm" && hasWater && (
        <WaterForm
          invoice={invoice}
          invoiceId={invoiceId!}
          locationId={session.locationId}
          onSubmit={handleWaterSubmit}
        />
      )}

      {step === "plForm" && hasPL && (
        <PLForm
          invoice={invoice}
          invoiceId={invoiceId!}
          locationId={session.locationId}
          onSubmit={handlePLSubmit}
        />
      )}

      {step === "pcrForm" && hasPCR && (
        <PCRForm
          invoice={invoice}
          invoiceId={invoiceId!}
          locationId={session.locationId}
          onSubmit={handlePCRSubmit}
        />
      )}

      {step === "microbiologyForm" && hasMicro && (
        <MicrobiologyForm
          invoice={invoice}
          invoiceId={invoiceId!}
          locationId={session.locationId}
          onSubmit={handleMicroSubmit}
        />
      )}

      {/* Individual Report Previews */}
      {step === "soilReport" && (
        <div>
          <SoilReport
            invoiceId={invoiceId!}
            locationId={session.locationId}
            allSampleCount={soilCount}
          />
          {/* <div className="mt-12 text-center">
            <button
              onClick={() => setStep("viewReports")}
              className="bg-green-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-700 shadow-lg"
            >
              View All Final Reports
            </button>
          </div> */}
        </div>
      )}

      {step === "waterReport" && (
        <div>
          <WaterReport
            invoiceId={invoiceId!}
            locationId={session.locationId}
            allSampleCount={waterCount}
          />
          {/* <div className="mt-12 text-center">
            <button
              onClick={() => setStep("viewReports")}
              className="bg-green-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-700 shadow-lg"
            >
              View All Final Reports
            </button>
          </div> */}
        </div>
      )}

      {step === "microbiologyReport" && (
        <div>
          <MicrobiologyReport
            invoiceId={invoiceId!}
            locationId={session.locationId}
            allSampleCount={microCount}
          />
          {/* <div className="mt-12 text-center">
            <button
              onClick={() => setStep("viewReports")}
              className="bg-green-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-700 shadow-lg"
            >
              View All Final Reports
            </button>
          </div> */}
        </div>
      )}

      {step === "pathologyReport" && (
        <div>
          {hasPL && (
            <div className="mb-16">
              <PLReport
                invoiceId={invoiceId!}
                locationId={session.locationId}
                allSampleCount={plCount}
              />
            </div>
          )}
          {hasPCR && (
            <PCRReport
              invoiceId={invoiceId!}
              locationId={session.locationId}
              allSampleCount={pcrCount}
              compact={hasPL}
            />
          )}
          {/* <div className="mt-12 text-center">
            <button
              onClick={() => setStep("viewReports")}
              className="bg-green-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-700 shadow-lg"
            >
              View All Final Reports
            </button>
          </div> */}
        </div>
      )}

      {/* FINAL REPORTS VIEW */}
      {isViewingReports && (
        <div>
          <div className="overflow-x-auto pb-4 mb-10">
            <div className="flex gap-4 justify-center min-w-max px-4">
              {hasSoil && (
                <button
                  onClick={() => setActiveEnvReport("soil")}
                  className={`px-6 py-3 rounded-xl border-4 font-bold text-lg transition-all shadow-lg ${
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
                  className={`px-6 py-3 rounded-xl border-4 font-bold text-lg transition-all shadow-lg ${
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
                  className={`px-6 py-3 rounded-xl border-4 font-bold text-lg transition-all shadow-lg ${
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
                  className={`px-6 py-3 rounded-xl border-4 font-bold text-lg transition-all shadow-lg ${
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

          <div className="mt-8">
            {activeEnvReport === "soil" && (
              <SoilReport
                invoiceId={invoiceId!}
                locationId={session.locationId}
                allSampleCount={soilCount}
              />
            )}
            {activeEnvReport === "water" && (
              <WaterReport
                invoiceId={invoiceId!}
                locationId={session.locationId}
                allSampleCount={waterCount}
              />
            )}
            {activeEnvReport === "microbiology" && (
              <MicrobiologyReport
                invoiceId={invoiceId!}
                locationId={session.locationId}
                allSampleCount={microCount}
              />
            )}
            {activeEnvReport === "pathology" && (
              <div>
                {hasPL && (
                  <div className="mb-16">
                    <PLReport
                      invoiceId={invoiceId!}
                      locationId={session.locationId}
                      allSampleCount={plCount}
                    />
                  </div>
                )}
                {hasPCR && (
                  <PCRReport
                    invoiceId={invoiceId!}
                    locationId={session.locationId}
                    allSampleCount={pcrCount}
                    compact={hasPL}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVE CHANGES BUTTON - ONLY IN EDIT MODE
      {isEditMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleSaveAllReports}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-2xl font-bold shadow-2xl transition-all border-4 border-blue-800 flex items-center gap-4"
          >
            SAVE CHANGES & GENERATE FINAL REPORTS
          </button>
        </div>
      )} */}
    </div>
  );
}