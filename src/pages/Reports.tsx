import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserSession } from "../contexts/UserSessionContext";

interface ReportEntry {
  invoiceId: string;
  types: ("Soil" | "Water")[];
  createdAt: string;
}

const Reports = () => {
  const { session } = useUserSession();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // dropdown state

  const locationId = session.locationId;

  useEffect(() => {
    const fetchReports = async () => {
      console.log("[Reports] Starting fetchReports()");
      if (!locationId) {
        console.warn("[Reports] No locationId found in session", { session });
        return;
      }

      console.log("[Reports] Using locationId", locationId);

      try {
        const reportsRef = collection(db, "locations", locationId, "reports");
        console.log("[Reports] Fetching reports collection at path:", `locations/${locationId}/reports`);

        const snap = await getDocs(reportsRef);
        console.log("[Reports] Raw snapshot", {
          size: snap.size,
          ids: snap.docs.map((d) => d.id),
        });

        const reportList: ReportEntry[] = [];

        for (const invoiceDoc of snap.docs) {
          const invoiceId = invoiceDoc.id;
          console.log(`[Reports] Checking invoiceId: ${invoiceId}`);

          const availableTypes: ("Soil" | "Water")[] = [];

          // Soil Samples
          const soilRef = collection(db, "locations", locationId, "reports", invoiceId, "soil samples");
          const soilSnap = await getDocs(soilRef);
          console.log(`[Reports] Invoice ${invoiceId} soil samples count:`, soilSnap.size);
          if (!soilSnap.empty) availableTypes.push("Soil");

          // Water Samples
          const waterRef = collection(db, "locations", locationId, "reports", invoiceId, "water samples");
          const waterSnap = await getDocs(waterRef);
          console.log(`[Reports] Invoice ${invoiceId} water samples count:`, waterSnap.size);
          if (!waterSnap.empty) availableTypes.push("Water");

          if (availableTypes.length > 0) {
            const createdAt = invoiceDoc.data()?.createdAt || "--";
            console.log(`[Reports] Invoice ${invoiceId} available types: ${availableTypes.join(", ")}`);
            reportList.push({ invoiceId, types: availableTypes, createdAt });
          }
        }

        console.log("[Reports] Final report list:", reportList);
        setReports(reportList);
      } catch (error) {
        console.error("[Reports] Error fetching reports:", error);
      }
    };

    fetchReports();
  }, [locationId]);

  const handleView = (invoiceId: string, type: "Soil" | "Water") => {
    console.log(`[Reports] Navigating to ${type} report for invoice ${invoiceId}`);
    if (type === "Soil") navigate(`/soil-report/${invoiceId}/${locationId}`);
    else navigate(`/water-report/${invoiceId}/${locationId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground mb-6">View and manage laboratory reports</p>

        <Card>
          <CardHeader className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <CardTitle>Report Management</CardTitle>
              <CardDescription>View soil and water reports</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Report Types</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.map((r, index) => (
                  <TableRow key={index}>
                    <TableCell>{r.invoiceId}</TableCell>
                    <TableCell>{r.types.join(", ")}</TableCell>
                    <TableCell>{r.createdAt}</TableCell>

                    <TableCell>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenDropdown(openDropdown === r.invoiceId ? null : r.invoiceId)
                          }
                          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-1 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                          View Reports
                          <ChevronDown className="ml-2 -mr-1 h-5 w-5" />
                        </button>

                        {openDropdown === r.invoiceId && (
                          <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              {r.types.map((type) => (
                                <button
                                  key={type}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => handleView(r.invoiceId, type)}
                                >
                                  {type} Report
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!reports.length && (
              <p className="text-center py-4 text-muted-foreground">No reports found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
