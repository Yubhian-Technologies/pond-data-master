import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Users,
  FlaskConical,
  FileText,
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  UserCircle,
  CheckCircle2,
  User,
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
  Query,
  CollectionReference,
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

interface Technician {
  id: string;
  name: string;
}

interface InvoiceItem {
  id: string;
  createdAt: Date;
  farmerName: string;
  invoiceId: string;
  title: string;
  typeDisplay: string;
  isReport: boolean;
  sampleCount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  technicianName: string;
  formattedDate: string;
  farmerId: string;
  farmerPhone: string;
  village: string;
  species: string;
  cultureAreas: number;
}

interface ModalFarmer {
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  species: string;
  cultureAreas: number;
}

interface ModalData {
  type: "farmers" | "samples" | "reports" | "revenue" | null;
  title: string;
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

  const [branchTechnicians, setBranchTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");

  const [exportData, setExportData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ type: null, title: "" });
  const [modalContent, setModalContent] = useState<any[]>([]);

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

  // Fetch Technicians for selected branch
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!selectedLocationId) return;
      try {
        const techRef = collection(db, "locations", selectedLocationId, "technicians");
        const snap = await getDocs(techRef);
        const techs: Technician[] = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name || "Unknown Technician"
        }));
        setBranchTechnicians(techs);
      } catch (err) {
        console.error("Error fetching technicians:", err);
      }
    };
    fetchTechnicians();
  }, [selectedLocationId]);

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
      // Farmers collection reference
      const farmersColl: CollectionReference<DocumentData> = collection(
        db,
        "locations",
        locationIdToUse,
        "farmers"
      );

      // Invoices collection reference
      const invoicesColl: CollectionReference<DocumentData> = collection(
        db,
        "locations",
        locationIdToUse,
        "invoices"
      );

      // Total farmers (all time)
      const farmersSnap = await getDocs(farmersColl);
      const totalFarmers = farmersSnap.size;

      // ── New farmers (this month or filtered period) ────────────────────────
      const isDateFiltered = !!startDate && !!endDate;

      let startT: Timestamp | null = null;
      let endT: Timestamp | null = null;

      if (isDateFiltered) {
        startT = Timestamp.fromDate(new Date(startDate));
        endT = Timestamp.fromDate(new Date(`${endDate}T23:59:59.999`));
      }

      let newFarmersQuery: Query<DocumentData> = farmersColl;

      if (isDateFiltered && startT && endT) {
        newFarmersQuery = query(
          farmersColl,
          where("createdAt", ">=", startT),
          where("createdAt", "<=", endT)
        );
      } else {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const monthStartT = Timestamp.fromDate(monthStart);
        const monthEndT = Timestamp.fromDate(new Date(monthEnd.getTime() + 86399999)); // end of day
        newFarmersQuery = query(
          farmersColl,
          where("createdAt", ">=", monthStartT),
          where("createdAt", "<=", monthEndT)
        );
      }

      const newFarmersSnap = await getDocs(newFarmersQuery);
      const newFarmers = newFarmersSnap.size;

      // ── Invoices ────────────────────────────────────────────────────────────
      let invoicesQuery: Query<DocumentData> = query(
        invoicesColl,
        orderBy("createdAt", "desc")
      );

      if (isDateFiltered && startT && endT) {
        invoicesQuery = query(
          invoicesColl,
          where("createdAt", ">=", startT),
          where("createdAt", "<=", endT),
          orderBy("createdAt", "desc")
        );
      }

      const invoicesSnap = await getDocs(invoicesQuery);

      const allInvoices: InvoiceItem[] = [];
      const tempExportRows: any[] = [];

      const locationName = allLocations.find((l) => l.id === locationIdToUse)?.name || "Unknown Lab";

      invoicesSnap.forEach((doc) => {
        const data = doc.data();

        if (selectedTechnicianId !== "all" && data.technicianId !== selectedTechnicianId) {
          return;
        }

        const createdAt = data.createdAt?.toDate() || new Date();
        const farmerName = data.farmerName || "Unknown Farmer";
        const invoiceId = data.invoiceId || doc.id;
        const techName = data.technicianName || "Unknown";

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

        const invoiceItem: InvoiceItem = {
          id: doc.id,
          createdAt,
          farmerName,
          invoiceId,
          title,
          typeDisplay,
          isReport,
          sampleCount,
          total: Number(data.total || 0),
          paidAmount: Number(data.paidAmount || 0),
          balanceAmount: Number(data.balanceAmount || 0),
          paymentMode: data.paymentMode || "pending",
          technicianName: techName,
          formattedDate: data.formattedDate || format(createdAt, "dd-MM-yyyy"),
          farmerId: data.farmerId || "N/A",
          farmerPhone: data.farmerPhone || data.phone || "N/A",
          village: data.village || data.city || "N/A",
          species: data.species || "N/A",
          cultureAreas: Number(data.cultureAreas || 0),
        };

        allInvoices.push(invoiceItem);

        // Prepare payment distribution for export
        const cash = data.paymentMode === "cash" ? Number(data.paidAmount || 0) : 0;
        const qr = data.paymentMode === "qr" ? Number(data.paidAmount || 0) : 0;
        const neft = data.paymentMode === "neft" ? Number(data.paidAmount || 0) : 0;
        const rtgs = data.paymentMode === "rtgs" ? Number(data.paidAmount || 0) : 0;

        tempExportRows.push({
          "Invoice ID": invoiceId,
          "Farmer Name": farmerName,
          "Location": locationName,
          "Technician": techName,
          "Sample Types": typeDisplay || "-",
          "Sample Count": sampleCount,
          "Bill Amount (₹)": Number(data.total || 0),
          "Amount Paid (₹)": Number(data.paidAmount || 0),
          "Cash (₹)": cash,
          "QR/UPI (₹)": qr,
          "NEFT (₹)": neft,
          "RTGS (₹)": rtgs,
          "Pending Amount (₹)": Number(data.balanceAmount || 0),
          "Status": isReport ? "Report Completed" : "Sample Submitted",
          "Date": data.formattedDate || format(createdAt, "dd-MM-yyyy"),
        });
      });

      setInvoices(allInvoices);

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

      const filteredExportRows = searchTerm
        ? tempExportRows.filter((row, index) => {
            const inv = allInvoices[index];
            if (!inv) return false;
            return (
              inv.farmerName.toLowerCase().includes(searchLower) ||
              inv.invoiceId.toLowerCase().includes(searchLower) ||
              inv.title.toLowerCase().includes(searchLower) ||
              inv.typeDisplay.toLowerCase().includes(searchLower)
            );
          })
        : tempExportRows;

      setExportData(filteredExportRows);

      let samplesProcessed = 0;
      let reportsGenerated = 0;
      let revenue = 0;

      filteredInvoices.forEach((inv) => {
        samplesProcessed += inv.sampleCount;
        revenue += inv.paidAmount;
        if (inv.isReport) reportsGenerated += 1;
      });

      const activities = filteredInvoices
        .map((inv) => ({
          id: inv.id,
          title: inv.title,
          subtitle: inv.farmerName,
          invoiceId: inv.invoiceId,
          timestamp: inv.createdAt,
          isReport: inv.isReport,
          technicianName: inv.technicianName,
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivities(activities);

      // Revenue change (only when no custom filters)
      let revenueChange = "";
      if (!isDateFiltered && !searchTerm && selectedTechnicianId === "all") {
        const lastMonthStart = Timestamp.fromDate(startOfMonth(subMonths(new Date(), 1)));
        const lastMonthEnd = Timestamp.fromDate(endOfMonth(subMonths(new Date(), 1)));
        const lastQuery = query(
          invoicesColl,
          where("createdAt", ">=", lastMonthStart),
          where("createdAt", "<=", lastMonthEnd)
        );
        const lastSnap = await getDocs(lastQuery);
        let lastRevenue = 0;
        lastSnap.forEach((d) => {
          const invData = d.data();
          lastRevenue += Number(invData.paidAmount || 0);
        });

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
  }, [selectedLocationId, selectedTechnicianId, session.locationId]);

  const handleApply = () => {
    fetchDashboardData();
  };

  // ── Fetch real farmers data for modal ─────────────────────────────────────
  const fetchRealFarmers = async () => {
    if (!selectedLocationId) return [];

    try {
      const farmersRef = collection(db, "locations", selectedLocationId, "farmers");
      const q = query(farmersRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      return snap.docs.map((doc) => {
        const data = doc.data();
        return {
          farmerId: data.farmerId || "N/A",
          farmerName: data.name || "Unknown",
          phone: data.phone || "N/A",
          village: data.city || data.village || "N/A",
          species: data.species || "Not specified",
          cultureAreas: Number(data.cultureAreas || 0),
        } as ModalFarmer;
      });
    } catch (err) {
      console.error("Error fetching real farmers:", err);
      return [];
    }
  };

  const openModal = async (type: ModalData["type"]) => {
    let title = "";
    let content: any[] = [];

    if (type === "farmers") {
      title = "All Farmers";
      content = await fetchRealFarmers();
    } else if (type === "samples") {
      title = "All Sample Submissions";
      content = invoices.map((inv) => ({
        invoiceId: inv.invoiceId || inv.id,
        farmerName: inv.farmerName,
        date: inv.formattedDate || "N/A",
        types: inv.typeDisplay || "Unknown",
        count: inv.sampleCount || 0,
        status: inv.isReport ? "Report Completed" : "Sample Submitted",
      }));
    } else if (type === "reports") {
      title = "Completed Reports";
      content = invoices
        .filter((inv) => inv.isReport)
        .map((inv) => ({
          invoiceId: inv.invoiceId || inv.id,
          farmerName: inv.farmerName,
          date: inv.formattedDate || "N/A",
          types: inv.typeDisplay || "Unknown",
        }));
    } else if (type === "revenue") {
      title = "Revenue Details";

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
      const pendingAmount = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);

      const cash = invoices
        .filter(inv => inv.paymentMode === "cash")
        .reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

      const qr = invoices
        .filter(inv => inv.paymentMode === "qr")
        .reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

      const neft = invoices
        .filter(inv => inv.paymentMode === "neft")
        .reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

      const rtgs = invoices
        .filter(inv => inv.paymentMode === "rtgs")
        .reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

      content = [
        { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}` },
        { label: "Paid via Cash", value: `₹${cash.toLocaleString("en-IN")}` },
        { label: "Paid via QR / UPI", value: `₹${qr.toLocaleString("en-IN")}` },
        { label: "Paid via NEFT", value: `₹${neft.toLocaleString("en-IN")}` },
        { label: "Paid via RTGS", value: `₹${rtgs.toLocaleString("en-IN")}` },
        { label: "Total Pending Amount", value: `₹${pendingAmount.toLocaleString("en-IN")}` },
      ];
    }

    setModalData({ type, title });
    setModalContent(content);
    setModalOpen(true);
  };

  const handleExportToExcel = () => {
    if (exportData.length === 0) return;

    const totals = exportData.reduce(
      (acc, row) => ({
        invoices: acc.invoices + 1,
        samples: acc.samples + row["Sample Count"],
        reports: acc.reports + (row["Status"] === "Report Completed" ? 1 : 0),
        billAmount: acc.billAmount + row["Bill Amount (₹)"],
        amountPaid: acc.amountPaid + row["Amount Paid (₹)"],
        cash: acc.cash + row["Cash (₹)"],
        qr: acc.qr + row["QR/UPI (₹)"],
        neft: acc.neft + row["NEFT (₹)"],
        rtgs: acc.rtgs + row["RTGS (₹)"],
        pending: acc.pending + row["Pending Amount (₹)"],
      }),
      { 
        invoices: 0, 
        samples: 0, 
        reports: 0, 
        billAmount: 0, 
        amountPaid: 0, 
        cash: 0,
        qr: 0,
        neft: 0,
        rtgs: 0,
        pending: 0 
      }
    );

    const summaryRow = {
      "Invoice ID": "TOTALS",
      "Farmer Name": "",
      "Location": "",
      "Technician": "",
      "Sample Types": "",
      "Sample Count": totals.samples,
      "Bill Amount (₹)": totals.billAmount,
      "Amount Paid (₹)": totals.amountPaid,
      "Cash (₹)": totals.cash,
      "QR/UPI (₹)": totals.qr,
      "NEFT (₹)": totals.neft,
      "RTGS (₹)": totals.rtgs,
      "Pending Amount (₹)": totals.pending,
      "Status": `${totals.reports} Reports Completed`,
      "Date": `${totals.invoices} Invoices`,
    };

    const worksheetData = [{}, ...exportData, {}, summaryRow];

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lab Report");

    ws["!cols"] = [
      { wch: 18 },  // Invoice ID
      { wch: 25 },  // Farmer Name
      { wch: 20 },  // Location
      { wch: 20 },  // Technician
      { wch: 16 },  // Sample Types
      { wch: 14 },  // Sample Count
      { wch: 18 },  // Bill Amount
      { wch: 18 },  // Amount Paid
      { wch: 14 },  // Cash
      { wch: 14 },  // QR/UPI
      { wch: 14 },  // NEFT
      { wch: 14 },  // RTGS
      { wch: 18 },  // Pending
      { wch: 22 },  // Status
      { wch: 15 },  // Date
    ];

    const currentLocationName = allLocations.find((l) => l.id === selectedLocationId)?.name || "Lab";
    const fileName = `Lab_Dashboard_${currentLocationName.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const hasAnyFilter = !!startDate || !!endDate || !!searchTerm || selectedTechnicianId !== "all";
  const currentLocationName = allLocations.find((l) => l.id === selectedLocationId)?.name || "Loading...";

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Laboratory operations overview</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-full shadow-sm border border-blue-100">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-700">
                    {session.technicianName || "Technician"}
                  </span>
                </div>
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
                      className="h-11 px-4 bg-green-600 hover:bg-green-700 text-white border-0"
                      onClick={handleExportToExcel}
                      disabled={loading || exportData.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Lab Branch & Technician Selector */}
                <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-6">
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Technician:</span>
                    </div>
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger className="w-64 h-11">
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
                <p className="text-xs text-muted-foreground mt-3 ml-1">
                  Currently viewing: <span className="font-semibold text-blue-800">{currentLocationName}</span>
                </p>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <Card 
                className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-white cursor-pointer"
                onClick={() => openModal("farmers")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
                    <div className="p-2.5 bg-blue-100 rounded-full">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{loading ? "-" : stats.totalFarmers}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    +{stats.newFarmers} new this month
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-white cursor-pointer"
                onClick={() => openModal("samples")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Samples Processed</CardTitle>
                    <div className="p-2.5 bg-purple-100 rounded-full">
                      <FlaskConical className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{loading ? "-" : stats.samplesProcessed}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasAnyFilter ? "In filtered results" : "All time"}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-white cursor-pointer"
                onClick={() => openModal("reports")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Reports Finalized</CardTitle>
                    <div className="p-2.5 bg-green-100 rounded-full">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">{loading ? "-" : stats.reportsGenerated}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasAnyFilter ? "In filtered results" : "All time"}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="shadow-md hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-emerald-50 to-white cursor-pointer"
                onClick={() => openModal("revenue")}
              >
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
                    {stats.revenueChange ? `${stats.revenueChange} vs last month` : "Selected period"}
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
                  Latest submissions and reports processed by technicians
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity matching filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${act.isReport ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                            {act.isReport ? <CheckCircle2 className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium text-gray-800">{act.title}</p>
                              {act.isReport && <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Completed</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium text-gray-700">{act.subtitle}</span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <UserCircle className="w-3.5 h-3.5 text-purple-500" />
                                <span>Submitted by: <span className="font-medium text-gray-700">{act.technicianName}</span></span>
                              </p>
                              <p className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded border">ID: {act.invoiceId}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(act.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{modalData.title}</DialogTitle>
            </DialogHeader>

            <div className="mt-6">
              {modalData.type === "farmers" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Farmers List</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Farmer ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Culture Areas (acres)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalContent.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No farmers found
                          </TableCell>
                        </TableRow>
                      ) : (
                        (modalContent as ModalFarmer[]).map((f, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{f.farmerId}</TableCell>
                            <TableCell>{f.farmerName}</TableCell>
                            <TableCell>{f.phone}</TableCell>
                            <TableCell>{f.village}</TableCell>
                            <TableCell>{f.species}</TableCell>
                            <TableCell>{f.cultureAreas}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              {modalData.type === "samples" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sample Submissions</h3>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Invoice ID</TableHead><TableHead>Farmer</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Count</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalContent.map((s, i) => (
                        <TableRow key={i}><TableCell>{s.invoiceId}</TableCell><TableCell>{s.farmerName}</TableCell><TableCell>{s.date}</TableCell><TableCell>{s.types}</TableCell><TableCell>{s.count}</TableCell><TableCell>{s.status}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {modalData.type === "reports" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Completed Reports</h3>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Invoice ID</TableHead><TableHead>Farmer</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {modalContent.map((r, i) => (
                        <TableRow key={i}><TableCell>{r.invoiceId}</TableCell><TableCell>{r.farmerName}</TableCell><TableCell>{r.date}</TableCell><TableCell>{r.types}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {modalData.type === "revenue" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Revenue Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modalContent.map((item, i) => (
                      <Card 
                        key={i} 
                        className={item.label.includes("Pending") ? "bg-red-50 border-red-200" : ""}
                      >
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-2xl font-bold mt-1">{item.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;