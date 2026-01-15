import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2, Calendar, FileText, Users, UserCircle, IndianRupee, RotateCcw, Pencil, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, Timestamp, query, where, orderBy } from "firebase/firestore";
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
import { Input } from "@/components/ui/input";

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
  pendingAmount: number;
}

const Reports = () => {
  const { session } = useUserSession();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [branchTechnicians, setBranchTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");

  // Date filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Search state (new)
  const [searchQuery, setSearchQuery] = useState<string>("");

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
        let invoicesQuery = query(
          collection(db, "locations", locationId, "invoices"),
          orderBy("createdAt", "desc")
        );

        // Apply date filters if provided
        if (startDate && endDate) {
          const startT = Timestamp.fromDate(new Date(startDate));
          const endT = Timestamp.fromDate(new Date(`${endDate}T23:59:59.999`));

          invoicesQuery = query(
            collection(db, "locations", locationId, "invoices"),
            where("createdAt", ">=", startT),
            where("createdAt", "<=", endT),
            orderBy("createdAt", "desc")
          );
        }

        const snap = await getDocs(invoicesQuery);

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
              pendingAmount,
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

        setReports(list);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchReports();
  }, [locationId, startDate, endDate, selectedTechnicianId]);

  const openReport = (invoiceId: string) => {
    navigate(`/lab-results/${invoiceId}?mode=view`);
  };

  const openInvoice = (invoiceId: string) => {
    navigate(`/invoice/${invoiceId}/${session.locationId}`);
  };

  const editReport = (invoiceId: string) => {
    navigate(`/lab-results/${invoiceId}?mode=edit`);
  };

  // Filtered reports (technician + text search)
  const filteredReports = useMemo(() => {
    let result = reports;

    // Technician filter
    if (selectedTechnicianId !== "all") {
      result = result.filter((report) => report.technicianId === selectedTechnicianId);
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((report) => {
        return (
          (report.farmerName || "").toLowerCase().includes(q) ||
          (report.invoiceId || "").toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [reports, selectedTechnicianId, searchQuery]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedTechnicianId("all");
    setSearchQuery(""); // also reset search
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header + Filters */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    Completed Reports
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    View all finalized laboratory reports for your farmers
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Technician Filter */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600 ml-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Tech:</span>
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

                  {/* Reset Filters Button */}
                  {(startDate || endDate || selectedTechnicianId !== "all" || searchQuery) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleResetFilters}
                      title="Reset all filters"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Date Range Filter + Search Box */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[240px]">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Search reports
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Farmer name / Invoice ID..."
                          className="pl-10 h-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                   

                    
                    
                  </div>
                </CardContent>
              </Card>
            </div>

            {loadingInvoices ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
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
                    {selectedTechnicianId !== "all" || startDate || endDate || searchQuery
                      ? "No reports found for selected filters"
                      : "No completed reports yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting the filters or search term
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserCircle className="w-4 h-4 text-purple-500" />
                              <span>
                                Submitted by:{" "}
                                <span className="font-medium text-gray-700">
                                  {report.technicianName}
                                </span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={
                                  report.isFullyPaid
                                    ? "text-green-600 font-medium"
                                    : "text-red-600 font-medium"
                                }
                              >
                                Payment {report.isFullyPaid ? "Completed" : "Pending"}
                              </span>
                              <span className="text-gray-600">|</span>
                              <span className="font-medium">₹{report.paidAmount}</span>
                              <span className="text-gray-600">|</span>
                              <span className="font-medium">
                                Pending: ₹{report.pendingAmount}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            onClick={() => openReport(report.invoiceId)}
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-sm px-5"
                          >
                            View Reports
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openInvoice(report.invoiceId)}
                            className="border-cyan-600 text-cyan-700 hover:bg-cyan-50 px-5"
                          >
                            View Invoice
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editReport(report.invoiceId)}
                            className="border-amber-600 text-amber-700 hover:bg-amber-50 px-5 flex items-center gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
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