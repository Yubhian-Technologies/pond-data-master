import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Users,
  FlaskConical,
  FileText,
  TrendingUp,
  User,
  Calendar,
  CheckCircle2,
  MapPin,
  Download,
} from "lucide-react";
import { useUserSession } from "../contexts/UserSessionContext";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  Query as FirestoreQuery,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { formatDistanceToNow, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import * as XLSX from "xlsx";

interface Location {
  id: string;
  name: string;
  code: string;
}

const Dashboard = () => {
  const { session, clearTechnician } = useUserSession();

  const [stats, setStats] = useState({
    totalFarmers: 0,
    newFarmers: 0,
    samplesProcessed: 0,
    reportsGenerated: 0,
    revenue: 0,
    revenueChange: "",
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const [exportData, setExportData] = useState<any[]>([]);

  const handleExit = () => {
    clearTechnician();
    window.location.href = `/technicians/${session.locationId}`;
  };

  // Fetch all lab branches
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsRef = collection(db, "locations");
        const snap = await getDocs(locationsRef);
        const locs: Location[] = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || d.data().code || "Unknown Lab",
          code: d.data().code || d.id,
        }));
        locs.sort((a, b) => a.name.localeCompare(b.name));
        setAllLocations(locs);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };

    fetchLocations();
  }, []);

  // Default to technician's location
  useEffect(() => {
    if (session.locationId && allLocations.length > 0) {
      setSelectedLocationId(session.locationId);
    }
  }, [session.locationId, allLocations]);

  const fetchDashboardData = async () => {
    const locationIdToUse = selectedLocationId || session.locationId;
    if (!locationIdToUse) return;

    setLoading(true);

    try {
      const farmersRef = collection(db, "locations", locationIdToUse, "farmers");
      const invoicesRef = collection(db, "locations", locationIdToUse, "invoices");

      // Total Farmers
      const farmersSnap = await getDocs(farmersRef);
      const totalFarmers = farmersSnap.size;

      // Date filtering
      const isDateFiltered = !!startDate && !!endDate;
      let startT: Timestamp | null = null;
      let endT: Timestamp | null = null;

      if (isDateFiltered) {
        startT = Timestamp.fromDate(new Date(startDate));
        endT = Timestamp.fromDate(new Date(`${endDate}T23:59:59.999`));
      }

      // New Farmers
      let newFarmersQuery: CollectionReference<DocumentData> | FirestoreQuery<DocumentData> = farmersRef;
      if (isDateFiltered && startT && endT) {
        newFarmersQuery = query(farmersRef, where("createdAt", ">=", startT), where("createdAt", "<=", endT));
      } else {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthStartT = Timestamp.fromDate(monthStart);
        const monthEndT = Timestamp.fromDate(new Date(monthEnd.getTime() + 86399999));
        newFarmersQuery = query(farmersRef, where("createdAt", ">=", monthStartT), where("createdAt", "<=", monthEndT));
      }
      const newFarmersSnap = await getDocs(newFarmersQuery);
      const newFarmers = newFarmersSnap.size;

      // Invoices query
      let invoicesQuery: CollectionReference<DocumentData> | FirestoreQuery<DocumentData> = invoicesRef;
      if (isDateFiltered && startT && endT) {
        invoicesQuery = query(
          invoicesRef,
          where("createdAt", ">=", startT),
          where("createdAt", "<=", endT),
          orderBy("createdAt", "desc")
        );
      } else {
        invoicesQuery = query(invoicesRef, orderBy("createdAt", "desc"));
      }
      const invoicesSnap = await getDocs(invoicesQuery);

      const allInvoices: any[] = [];
      const tempExportRows: any[] = [];

      const locationName = allLocations.find((l) => l.id === locationIdToUse)?.name || "Unknown Lab";

      invoicesSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const farmerName = data.farmerName || "Unknown Farmer";
        const invoiceId = data.invoiceId || doc.id;

        let typeDisplay = "";
        let sampleCount = 0;

        if (data.sampleType && Array.isArray(data.sampleType)) {
          const types = data.sampleType.map((s: any) => s?.type?.toUpperCase()).filter(Boolean);
          const uniqueTypes = [...new Set(types)];
          typeDisplay = uniqueTypes.join("/");
          if (uniqueTypes.includes("PL") && uniqueTypes.includes("PCR")) typeDisplay = "PL/PCR";

          data.sampleType.forEach((s: any) => {
            if (s && typeof s === "object") {
              let count = Number(s.count) || 0;
              if (s.type?.toLowerCase() === "pl" && data.actualPlCount !== undefined) {
                count = Number(data.actualPlCount) || count;
              }
              sampleCount += count;
            }
          });
        }

        const isReport =
          data.reportsProgress &&
          Object.values(data.reportsProgress).every((status: any) => status === "completed");

        const title = isReport
          ? `${typeDisplay || "Analysis"} Report Generated`
          : `${typeDisplay || "Sample"} Submitted`;

        const invoiceItem = {
          id: doc.id,
          createdAt,
          farmerName,
          invoiceId,
          title,
          typeDisplay,
          isReport,
          sampleCount,
          total: Number(data.total || 0),
        };

        allInvoices.push(invoiceItem);

        tempExportRows.push({
          "Invoice ID": invoiceId,
          "Farmer Name": farmerName,
          "Location": locationName,
          "Sample Types": typeDisplay || "-",
          "Sample Count": sampleCount,
          "Revenue (₹)": Number(data.total || 0),
          "Status": isReport ? "Report Completed" : "Sample Submitted",
          "Date": format(createdAt, "dd-MM-yyyy"),
        });
      });

      // Apply search filter
      const searchLower = searchTerm.toLowerCase();
      const filteredInvoices = searchTerm
        ? allInvoices.filter(
            (inv) =>
              inv.farmerName.toLowerCase().includes(searchLower) ||
              inv.invoiceId.toLowerCase().includes(searchLower) ||
              inv.title.toLowerCase().includes(searchLower) ||
              inv.typeDisplay.toLowerCase().includes(searchLower)
          )
        : allInvoices;

      // Filter export rows based on same search logic
      const filteredExportRows = searchTerm
        ? tempExportRows.filter((row, index) => {
            const inv = allInvoices[index];
            return (
              inv.farmerName.toLowerCase().includes(searchLower) ||
              inv.invoiceId.toLowerCase().includes(searchLower) ||
              inv.title.toLowerCase().includes(searchLower) ||
              inv.typeDisplay.toLowerCase().includes(searchLower)
            );
          })
        : tempExportRows;

      setExportData(filteredExportRows);

      // Calculate stats from filtered invoices
      let samplesProcessed = 0;
      let reportsGenerated = 0;
      let revenue = 0;

      filteredInvoices.forEach((inv) => {
        samplesProcessed += inv.sampleCount;
        revenue += inv.total;
        if (inv.isReport) reportsGenerated += 1;
      });

      // Recent activities
      const activities = filteredInvoices
        .map((inv) => ({
          id: inv.id,
          title: inv.title,
          subtitle: inv.farmerName,
          invoiceId: inv.invoiceId,
          timestamp: inv.createdAt,
          isReport: inv.isReport,
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivities(activities);

      // Revenue change (only when no filters)
      let revenueChange = "";
      if (!isDateFiltered && !searchTerm) {
        const lastMonthStart = Timestamp.fromDate(startOfMonth(subMonths(new Date(), 1)));
        const lastMonthEnd = Timestamp.fromDate(endOfMonth(subMonths(new Date(), 1)));
        const lastQuery = query(
          invoicesRef,
          where("createdAt", ">=", lastMonthStart),
          where("createdAt", "<=", lastMonthEnd)
        );
        const lastSnap = await getDocs(lastQuery);
        let lastRevenue = 0;
        lastSnap.forEach((d) => (lastRevenue += Number(d.data().total) || 0));

        if (lastRevenue > 0) {
          const change = ((revenue - lastRevenue) / lastRevenue) * 100;
          revenueChange = change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
        } else if (revenue > 0) {
          revenueChange = "+New";
        }
      }

      setStats({
        totalFarmers,
        newFarmers,
        samplesProcessed,
        reportsGenerated,
        revenue,
        revenueChange,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocationId) {
      fetchDashboardData();
    }
  }, [selectedLocationId, session.locationId]);

  const handleApply = () => {
    fetchDashboardData();
  };

  // Excel Export
  const handleExportToExcel = () => {
    if (exportData.length === 0) {
      alert("No data to export with current filters.");
      return;
    }

    const totals = exportData.reduce(
      (acc, row) => ({
        invoices: acc.invoices + 1,
        samples: acc.samples + row["Sample Count"],
        reports: acc.reports + (row["Status"] === "Report Completed" ? 1 : 0),
        revenue: acc.revenue + row["Revenue (₹)"],
      }),
      { invoices: 0, samples: 0, reports: 0, revenue: 0 }
    );

    const summaryRow = {
      "Invoice ID": "",
      "Farmer Name": "",
      "Location": "",
      "Sample Types": "",
      "Sample Count": totals.samples,
      "Revenue (₹)": totals.revenue,
      "Status": `${totals.reports} Reports Completed`,
      "Date": `${totals.invoices} Invoices`,
    };

    const worksheetData = [{ "Invoice ID": "" }, ...exportData,summaryRow];

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lab Report");

    ws["!cols"] = [
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 14 },
      { wch: 15 },
      { wch: 22 },
      { wch: 15 },
    ];

    const currentLocationName = allLocations.find((l) => l.id === selectedLocationId)?.name || "Lab";
    const fileName = `Lab_Dashboard_${currentLocationName.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const hasAnyFilter = !!startDate || !!endDate || !!searchTerm;

  const currentLocationName = allLocations.find((l) => l.id === selectedLocationId)?.name || "Loading...";

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Laboratory operations overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-full shadow-sm">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">
                {session.technicianName || "Technician"}
              </span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleExit}>
              Exit Technician
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-sm border-0">
          <CardHeader className="from bg-cyan-50 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by farmer, invoice, or type..."
                  className="pl-10 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Input type="date" className="h-11" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" className="h-11" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className="flex gap-2">
                <Button className="h-11 flex-1" onClick={handleApply}>
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-4 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleExportToExcel}
                  disabled={loading || exportData.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Lab Branch Selector */}
            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Lab Branch:</span>
                </div>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger className="w-64 h-11">
                    <SelectValue placeholder="Select lab branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-6">
                Currently viewing: <span className="font-semibold text-blue-800">{currentLocationName}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
                <div className="p-2.5 bg-blue-100 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "-" : stats.totalFarmers}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +{stats.newFarmers} new {startDate && endDate ? "in period" : "this month"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Samples Processed</CardTitle>
                <div className="p-2.5 bg-purple-100 rounded-full">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "-" : stats.samplesProcessed}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {hasAnyFilter ? "In filtered results" : "All time"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fully Finalized Reports</CardTitle>
                <div className="p-2.5 bg-green-100 rounded-full">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "-" : stats.reportsGenerated}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {hasAnyFilter ? "In filtered results" : "All time"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <div className="p-2.5 bg-emerald-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {loading ? "-" : `₹${stats.revenue.toLocaleString("en-IN")}`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.revenueChange
                  ? `${stats.revenueChange} vs last month`
                  : hasAnyFilter
                  ? "In filtered results"
                  : "All time"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl flex items-center gap-3 text-blue-800">
              <Calendar className="w-6 h-6" />
              Recent Activity
            </CardTitle>
            <CardDescription className="mt-1">
              Latest sample submissions and completed reports
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                <p className="mt-4 text-muted-foreground">Loading activity...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg text-muted-foreground">No recent activity yet</p>
                <p className="text-sm text-muted-foreground mt-2">New actions will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          act.isReport
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {act.isReport ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <FlaskConical className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-gray-800">{act.title}</p>
                          {act.isReport && (
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-gray-700">{act.subtitle}</span>
                          </p>
                          <p>
                            Invoice:{" "}
                            <span className="font-mono font-medium text-gray-800">{act.invoiceId}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(act.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;