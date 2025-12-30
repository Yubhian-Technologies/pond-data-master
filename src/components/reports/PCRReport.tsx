import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { Printer } from "lucide-react";

interface PCRReportProps {
  invoiceId: string;
  locationId: string;
  sampleNumber?: number;
  showAllSamples?: boolean;
  allSampleCount?: number;
  compact?: boolean;
}

export default function PCRReport({
  invoiceId,
  locationId,
  sampleNumber = 1,
  showAllSamples = false,
  allSampleCount = 1,
  compact = false,
}: PCRReportProps) {
  const [farmerInfo, setFarmerInfo] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPCRReport = async () => {
      try {
        setLoading(true);

        const shouldShowAll = showAllSamples || (allSampleCount && allSampleCount > 1);

        if (shouldShowAll) {
          const collectionRef = collection(
            db,
            "locations",
            locationId,
            "invoices",
            invoiceId,
            "pcr_reports"
          );

          const snap = await getDocs(collectionRef);

          if (snap.empty) {
            setReports([]);
            setFarmerInfo(null);
            return;
          }

          const allReports = snap.docs.map((d) => {
            const data = d.data();
            const sampleId = d.id.replace(/^sample_/, "");

            return {
              sampleCode: data.sampleCode || sampleId || "Unknown",
              sampleType: data.sampleType || "PL",
              pathogens: data.pathogens || [],
              gelImageUrl: data.gelImageUrl || null,
              farmerInfo: {
                farmerName: data.farmerName || "",
                village: data.village || "",
                mobile: data.mobile || "",
                date: data.date || "",
              },
            };
          });

          allReports.sort((a, b) => {
            const numA = parseInt(a.sampleCode.toString().replace(/\D/g, "")) || 0;
            const numB = parseInt(b.sampleCode.toString().replace(/\D/g, "")) || 0;
            return numA - numB;
          });

          if (!compact && allReports.length > 0) {
            setFarmerInfo(allReports[0].farmerInfo);
          }

          setReports(allReports);
        } else {
          const docRef = doc(
            db,
            "locations",
            locationId,
            "invoices",
            invoiceId,
            "pcr_reports",
            `sample_${sampleNumber}`
          );

          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            setFarmerInfo({
              farmerName: data.farmerName || "",
              village: data.village || "",
              mobile: data.mobile || "",
              date: data.date || "",
            });

            setReports([
              {
                sampleCode: data.sampleCode || sampleNumber,
                sampleType: data.sampleType || "PL",
                pathogens: data.pathogens || [],
                gelImageUrl: data.gelImageUrl || null,
              },
            ]);
          } else {
            setReports([]);
            setFarmerInfo(null);
          }
        }
      } catch (err) {
        console.error("Error fetching PCR report:", err);
        setReports([]);
        setFarmerInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPCRReport();
  }, [invoiceId, locationId, sampleNumber, showAllSamples, allSampleCount, compact]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-lg">Loading PCR Report...</p>
      </div>
    );
  }

  if (!reports.length) {
    return <p className="text-center py-12 text-red-600 text-xl">No PCR report found.</p>;
  }

  const allPathogens = Array.from(
    new Set(reports.flatMap((r) => (r.pathogens || []).map((p: any) => p.name)))
  );
  const singlePathogen = allPathogens.length === 1;

  const ResultTable = () => (
    <div className="overflow-x-auto mb-8">
      <table className="w-full border-2 border-gray-800 text-sm">
        <thead className="bg-blue-100">
          <tr>
            <th rowSpan={2} className="border px-4 py-2 align-middle">Sample Code</th>
            <th rowSpan={2} className="border px-4 py-2 align-middle">Sample Type</th>

            {singlePathogen ? (
              <>
                <th className="border px-4 py-2">{allPathogens[0]} Result</th>
                <th className="border px-4 py-2">{allPathogens[0]} C.T</th>
              </>
            ) : (
              allPathogens.map((p) => (
                <th key={p} colSpan={2} className="border px-4 py-2 text-center">
                  {p}
                </th>
              ))
            )}
          </tr>

          {!singlePathogen && (
            <tr>
              {allPathogens.map((p) => (
                <React.Fragment key={p}>
                  <th className="border px-4 py-2">Result</th>
                  <th className="border px-4 py-2">C.T</th>
                </React.Fragment>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {reports.map((r, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border px-4 py-2 text-center font-semibold">{r.sampleCode}</td>
              <td className="border px-4 py-2 text-center">{r.sampleType}</td>

              {singlePathogen ? (
                <>
                  <td className="border px-4 py-2 text-center font-bold text-red-600">
                    {r.pathogens[0]?.result || "-"}
                  </td>
                  <td className="border px-4 py-2 text-center font-bold text-red-600">
                    {r.pathogens[0]?.ctValue || "-"}
                  </td>
                </>
              ) : (
                allPathogens.map((p) => {
                  const found = r.pathogens.find((x: any) => x.name === p);
                  return (
                    <React.Fragment key={p}>
                      <td className="border px-4 py-2 text-center font-bold text-red-600">
                        {found?.result || "-"}
                      </td>
                      <td className="border px-4 py-2 text-center font-bold text-red-600">
                        {found?.ctValue || "-"}
                      </td>
                    </React.Fragment>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* =========================
     GEL IMAGES SECTION (Reusable)
  ========================= */
  const GelImagesSection = () => {
    if (!reports.some((r) => r.gelImageUrl)) return null;

    return (
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Report Images
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reports
            .filter((r) => r.gelImageUrl)
            .map((r, idx) => (
              <div
                key={idx}
                className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-md"
              >
                <p className="text-center font-bold text-lg py-3 bg-gray-100">
                  Sample {r.sampleCode}
                </p>
                <img
                  src={r.gelImageUrl}
                  alt={`Gel Image - Sample ${r.sampleCode}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="bg-white">
        <ResultTable />
        <GelImagesSection />
      </div>
    );
  }

  
  return (
    <div className="bg-white p-8 shadow-lg rounded-lg" id="report">
      
      <div className="print:hidden mb-8 text-right">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-md transition"
        >
          <Printer size={24} />
          Print Report
        </button>
      </div>

      <div className="flex justify-between items-center border-b-4 border-blue-700 pb-8 mb-10">
        <img src={ADC} alt="ADC Logo" className="h-28" />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-800">
            WATERBASE AQUA DIAGNOSTIC CENTER
          </h1>
          <h2 className="text-2xl font-bold text-red-700 mt-4">
            RT-q PCR Analysis Test Report
          </h2>
        </div>
        <img src={AV} alt="AV Logo" className="h-28" />
      </div>

      <div className="text-right mb-6">
        <span className="font-bold text-lg">Report Id:- {invoiceId || "-"}</span>
      </div>

    
      {farmerInfo && (
        <table className="w-full mb-10 border-2 border-gray-800 text-sm">
          <tbody>
            <tr>
              <td className="border px-6 py-3 font-bold bg-gray-100">Farmer Name</td>
              <td className="border px-6 py-3">{farmerInfo.farmerName || "-"}</td>
              <td className="border px-6 py-3 font-bold bg-gray-100">Village</td>
              <td className="border px-6 py-3">{farmerInfo.village || "-"}</td>
              <td className="border px-6 py-3 font-bold bg-gray-100">Date</td>
              <td className="border px-6 py-3">{farmerInfo.date || "-"}</td>
            </tr>
            <tr>
              <td className="border px-6 py-3 font-bold bg-gray-100">Mobile</td>
              <td className="border px-6 py-3">{farmerInfo.mobile || "-"}</td>
              <td className="border px-6 py-3 font-bold bg-gray-100">No. of Samples</td>
              <td className="border px-6 py-3">{reports.length}</td>
              <td className="border px-6 py-3 font-bold bg-gray-100">Test</td>
              <td className="border px-6 py-3 font-medium">RT-qPCR</td>
            </tr>
          </tbody>
        </table>
      )}

      <ResultTable />
      <GelImagesSection />
    </div>
  );
}