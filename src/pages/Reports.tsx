import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2, Calendar, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserSession } from "../contexts/UserSessionContext";

type ReportType = "Soil" | "Water" | "PL" | "PCR" | "Microbiology";

interface ReportEntry {
  invoiceId: string;
  farmerName: string;
  farmerInitials: string;
  types: ReportType[];
  createdAt: Timestamp | null;
  displayDate: string;
}

const Reports = () => {
  const { session } = useUserSession();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportEntry[]>([]);

  const locationId = session.locationId;

  useEffect(() => {
    const fetchReports = async () => {
      if (!locationId) return;

      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const snap = await getDocs(invoicesRef);

        const list: ReportEntry[] = [];

        for (const doc of snap.docs) {
          const data = doc.data();
          const invoiceId = data.invoiceId || doc.id;
          const farmerName = data.farmerName || "Unknown Farmer";
          const createdAt = data.createdAt as Timestamp | null;

          const progress = data.reportsProgress || {};
          const types: ReportType[] = [];

          if (progress.soil === "completed") types.push("Soil");
          if (progress.water === "completed") types.push("Water");
          if (progress.pl === "completed") types.push("PL");
          if (progress.pcr === "completed") types.push("PCR");
          if (progress.microbiology === "completed") types.push("Microbiology");

          if (types.length > 0) {
            const farmerInitials = farmerName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            list.push({
              invoiceId,
              farmerName,
              farmerInitials,
              types,
              createdAt,
              displayDate: createdAt
                ? createdAt.toDate().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Unknown",
            });
          }
        }

        list.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        setReports(list);
      } catch (err) {
        console.error("Failed to load reports:", err);
      }
    };

    fetchReports();
  }, [locationId]);

  const openReport = (invoiceId: string) => {
    navigate(`/lab-results/${invoiceId}?mode=view`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            
            Completed Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            View all finalized laboratory reports for your farmers
          </p>
        </div>

        {reports.length === 0 ? (
          <Card className="border-dashed border-2 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                No completed reports yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Reports will appear here once lab analysis is fully completed and finalized.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 ">
            {reports.map((report) => (
              <Card
                key={report.invoiceId}
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border bg-gradient-to-br from-white to-cyan-50/30"
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50/50 py-4 border">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {report.farmerName}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <FileText className="w-3.5 h-3.5" />
                        Invoice: <span className="font-mono text-gray-700">{report.invoiceId}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.displayDate}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs px-3 py-1">
                        {report.types.length} report{report.types.length > 1 ? "s" : ""} ready
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Completed Analysis:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.types.map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="px-3 py-1 text-xs font-medium border-blue-200 bg-blue-50/70 text-cyan-800"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => openReport(report.invoiceId)}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-sm px-5"
                    >
                      
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;