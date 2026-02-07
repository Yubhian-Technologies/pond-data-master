// src/components/reports/PCRReport.tsx

import React, { useEffect, useState } from "react";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/pages/firebase";
import ADC from "@/assets/ADC.jpg";
import AV from "@/assets/AV.jpg";
import { Printer } from "lucide-react";
import { useUserSession } from "@/contexts/UserSessionContext";

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
  const { session } = useUserSession();
  const [farmerInfo, setFarmerInfo] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [technicianName, setTechnicianName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    email: string;
    contactNumber: string;
  }>({
    address: "",
    email: "",
    contactNumber: "",
  });

  const [realInvoiceDocId, setRealInvoiceDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealDocId = async () => {
      if (!invoiceId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");

        let q = query(invoicesRef, where("invoiceId", "==", invoiceId));
        let snap = await getDocs(q);

        if (snap.empty) {
          q = query(invoicesRef, where("id", "==", invoiceId));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setRealInvoiceDocId(docSnap.id);
          console.log("PCRReport - Found real docId:", docSnap.id);
        } else {
          console.error("PCRReport - Invoice document not found for:", invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice docId:", err);
      }
    };

    fetchRealDocId();
  }, [invoiceId, locationId]);

  useEffect(() => {
    const fetchPCRReport = async () => {
      if (!realInvoiceDocId || !locationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const shouldShowAll = showAllSamples || (allSampleCount && allSampleCount > 1);

        let techName = "";

        if (shouldShowAll) {
          const collectionRef = collection(
            db,
            "locations",
            locationId,
            "invoices",
            realInvoiceDocId,
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

            if (!techName && (data.technicianName || data.reportedBy)) {
              techName = data.technicianName || data.reportedBy || "";
            }

            return {
              sampleCode: data.sampleCode || sampleId || "Unknown",
              sampleType: data.sampleType || "PL",
              pathogens: data.pathogens || [],
              gelImageUrl: data.gelImageUrl || null,
              farmerInfo: {
                farmerName: data.farmerName || "",
                address: data.address || "",
                mobile: data.mobile || "",
                farmerId: data.farmerId || "",
                sampleCollectionTime: data.sampleCollectionTime || "",
                sampleType: data.sampleType || "",
                noOfSamples: data.noOfSamples || "",
                reportDate: data.reportDate || "",
                docDifference: data.docDifference || "",
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
            realInvoiceDocId,
            "pcr_reports",
            `sample_${sampleNumber}`
          );

          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();

            techName = data.technicianName || data.reportedBy || "";

            setFarmerInfo({
              farmerName: data.farmerName || "",
              address: data.address || "",
              mobile: data.mobile || "",
              farmerId: data.farmerId || "",
              sampleCollectionTime: data.sampleCollectionTime || "",
              sampleType: data.sampleType || "",
              noOfSamples: data.noOfSamples || "",
              reportDate: data.reportDate || "",
              docDifference: data.docDifference || "",
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

        if (!techName && session?.technicianName) {
          techName = session.technicianName;
        }

        setTechnicianName(techName);
      } catch (err) {
        console.error("Error fetching PCR report:", err);
        setReports([]);
        setFarmerInfo(null);
        if (session?.technicianName) {
          setTechnicianName(session.technicianName);
        }
      } finally {
        setLoading(false);
      }
    };

    if (realInvoiceDocId) {
      fetchPCRReport();
    }
  }, [realInvoiceDocId, locationId, sampleNumber, showAllSamples, allSampleCount, compact, session]);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!locationId) return;

      try {
        const locDoc = await getDoc(doc(db, "locations", locationId));
        if (locDoc.exists()) {
          const data = locDoc.data();
          setLocationDetails({
            address: data.address || "Not available",
            email: data.email || "Not available",
            contactNumber: data.contactNumber || "Not available",
          });
        }
      } catch (error) {
        console.error("Error fetching location details:", error);
      }
    };

    fetchLocationDetails();
  }, [locationId]);

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
  const isSingleSample = reports.length === 1;

  const ResultTable = () => {
  const isSingleSample = reports.length === 1;

  return (
    <div className="overflow-x-auto mb-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-700 m-4">
          RT-qPCR Analysis
        </h2>
      </div>
      <table className="w-full border-2 border-gray-800 text-sm">
        <thead className="bg-blue-100">
          <tr>
            <th rowSpan={2} className="border px-4 py-2 align-middle">Sample Code</th>
            <th rowSpan={2} className="border px-4 py-2 align-middle">Sample Type</th>

            {isSingleSample ? (
              <>
                <th rowSpan={2} className="border px-4 py-2 align-middle font-bold">
                  {"Pathogen"}
                </th>
                <th className="border px-4 py-2">Result</th>
                <th className="border px-4 py-2">C.T</th>
              </>
            ) : (
              allPathogens.map((p) => (
                <th key={p} colSpan={2} className="border px-4 py-2 text-center">
                  {p}
                </th>
              ))
            )}
          </tr>

          {!isSingleSample && (
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

              {isSingleSample ? (
                <>
                  <td className="border px-4 py-2 text-center font-medium">
                    {allPathogens[0]}
                  </td>
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
};

  const GelImagesSection = () => {
    if (!reports.some((r) => r.gelImageUrl)) return null;

    return (
      <div className="mt-12">
        <h3 className="text-xl font-bold text-center mb-8 text-gray-800">
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
                  className="w-[50%] h-auto object-contain"
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
    <>
      <style>{`
        @media print {
          #report {
            padding: 4px !important;
            
            margin: 0 !important;
            box-shadow: none !important;
          }
          h1 { font-size: 1.8rem !important; }
          h2 { font-size: 1.3rem !important; }
          h3 { font-size: 1.4rem !important; }
          p, td, th, span { font-size: 0.75rem !important; line-height: 1.3 !important; }
          .px-8 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .mb-8, .mb-10, .mt-12, .mt-16 { margin-bottom: 1rem !important; margin-top: 1rem !important; }
          img.h-28 { height: 3.5rem !important; }
          table td, table th { padding: 0.25rem !important; }
          .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.5rem !important;
          }
          table, div, section { page-break-inside: avoid !important; }
          @page { size: A4 portrait; margin: 0.5cm; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="p-8 rounded-lg" id="report">
        <div className="print:hidden mb-8 text-right">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-md transition"
          >
            <Printer size={24} />
            Print Report
          </button>
        </div>

        <div className="flex justify-between items-center border-b-4 border-blue-700 pb-8 mb-8">
          <img src={ADC} alt="ADC Logo" className="h-28" />
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-800">
              WATERBASE AQUA DIAGNOSTIC CENTER
            </h1>
            <p className="text-sm text-black font-semibold">{locationDetails.address || "Loading lab address..."}</p>
            <p className="text-sm text-black">
              Contact No: {locationDetails.contactNumber || "Loading..."} | 
              Mail Id: {locationDetails.email || "Loading..."}
            </p>
            <p className="text-sm text-black">
              GSTIN: - 37AABCT0601L1ZJ
            </p>
          </div>
          <img src={AV} alt="AV Logo" className="h-28" />
        </div>

        {farmerInfo && (
          <table className="w-full mb-10 border-2 border-gray-800 text-sm">
            <tbody>
              <tr>
                <td className="border px-6 py-3 font-bold bg-gray-100">Farmer Name</td>
                <td className="border px-6 py-3">{farmerInfo.farmerName || "-"}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">Address</td>
                <td className="border px-6 py-3">{farmerInfo.address || "-"}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">Sample Collected</td>
                <td className="border px-6 py-3">{farmerInfo.sampleCollectionTime || "-"}</td>
              </tr>
              <tr>
                <td className="border px-6 py-3 font-bold bg-gray-100">Mobile</td>
                <td className="border px-6 py-3">{farmerInfo.mobile || "-"}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">Farmer ID</td>
                <td className="border px-6 py-3">{farmerInfo.farmerId || "-"}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">Report Date</td>
                <td className="border px-6 py-3">{farmerInfo.reportDate || "-"}</td>
              </tr>
              <tr>
                <td className="border px-6 py-3 font-bold bg-gray-100">Report Id</td>
                <td className="border px-6 py-3">{invoiceId || '-'}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">No of samples</td>
                <td className="border px-6 py-3">{farmerInfo.noOfSamples || allSampleCount || "-"}</td>
                <td className="border px-6 py-3 font-bold bg-gray-100">DOC</td>
                <td className="border px-6 py-3">{farmerInfo.docDifference || "-"}</td>
              </tr>
            </tbody>
          </table>
        )}

        <ResultTable />
        <GelImagesSection />
      </div>
    </>
  );
}