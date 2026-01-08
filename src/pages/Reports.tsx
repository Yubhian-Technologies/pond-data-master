import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2, Calendar, FileText, Users, UserCircle, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserSession } from "../contexts/UserSessionContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReportType = "Soil" | "Water" | "PL" | "PCR" | "Microbiology";

interface ReportEntry {
  invoiceId: string;
  farmerName: string;
  farmerInitials: string;
  types: ReportType[];
  createdAt: Timestamp | null;
  displayDate: string;
  technicianId?: string;
  technicianName: string;
  total: number;
  paidAmount: number;
  isFullyPaid: boolean;
  pendingAmount: number; // ← ADDED THIS LINE
}

const Reports = () => {
  const { session } = useUserSession();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [branchTechnicians, setBranchTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");

  const locationId = session.locationId;

  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!locationId) return;
      try {
        const techRef = collection(db, "locations", locationId, "technicians");
        const snap = await getDocs(techRef);
        const techs = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name || "Unknown Technician"
        }));
        setBranchTechnicians(techs);
      } catch (err) {
        console.error("Error fetching technicians:", err);
      }
    };
    fetchTechnicians();
  }, [locationId]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!locationId) return;
      setLoadingInvoices(true);
      try {
        const invoicesRef = collection(db, "locations", locationId, "invoices");
        const snap = await getDocs(invoicesRef);

        const list: ReportEntry[] = [];

        for (const doc of snap.docs) {
          const data = doc.data();
          const invoiceId = data.invoiceId || doc.id;
          const farmerName = data.farmerName || "Unknown Farmer";
          const createdAt = data.createdAt as Timestamp | null;
          const techId = data.technicianId || "";
          const techName = data.technicianName || "Unknown";

          const total = Number(data.total || 0);
          const paidAmount = Number(data.paidAmount || 0);
          const pendingAmount = Math.max(0, total - paidAmount);
          const isFullyPaid = paidAmount >= total && total > 0;

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
              technicianId: techId,
              technicianName: techName,
              total,
              paidAmount,
              isFullyPaid,
              pendingAmount, // Now valid
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
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchReports();
  }, [locationId]);

  const openReport = (invoiceId: string) => {
    navigate(`/lab-results/${invoiceId}?mode=view`);
  };

  const filteredReports = reports.filter((report) => {
    if (selectedTechnicianId === "all") return true;
    return report.technicianId === selectedTechnicianId;
  });

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  Completed Reports
                </h1>
                <p className="text-muted-foreground mt-2">
                  View all finalized laboratory reports for your farmers
                </p>
              </div>

              {/* Technician Filter */}
              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Filter by Tech:</span>
                </div>
                <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                  <SelectTrigger className="w-56 h-10 border-none shadow-none focus:ring-0">
                    <SelectValue placeholder="All Technicians" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Technicians</SelectItem>
                    {branchTechnicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingInvoices === true ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
                <p className="text-muted-foreground">Loading Reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <Card className="border-dashed border-2 shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    {selectedTechnicianId === "all" ? "No completed reports yet" : "No reports found for this technician"}
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 ">
                {filteredReports.map((report) => (
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
                        <div className="space-y-3">
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
                          
                          <div className="space-y-2">
                            {/* Technician Name */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserCircle className="w-4 h-4 text-purple-500" />
                              <span>Submitted by: <span className="font-medium text-gray-700">{report.technicianName}</span></span>
                            </div>

                            {/* Payment Status with Amounts */}
                            <div className="flex items-center gap-2 text-sm">
                              {/* <IndianRupee className="w-4 h-4" /> */}
                              <span className={report.isFullyPaid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                Payment {report.isFullyPaid ? "Completed" : "Pending"}
                              </span>
                              <span className="text-gray-600">|</span>
                              <span className="font-medium">
                                Paid: ₹{report.paidAmount}
                              </span>
                              <span className="text-gray-600">|</span>
                              <span className="font-medium">
                                Pending: ₹{report.pendingAmount}
                              </span>
                            </div>
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;