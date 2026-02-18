import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, Users, Search, X, IndianRupee, Calendar } from "lucide-react";
import { Farmer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../contexts/UserSessionContext";
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Samples = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useUserSession();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [branchTechnicians, setBranchTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [allOtherTechnicians, setAllOtherTechnicians] = useState<{ id: string; name: string; branchId: string }[]>([]);

  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("all");           // filter for table only
  const [selectedOtherTechId, setSelectedOtherTechId] = useState<string>("none");           // only for NEW submissions

  // Date filter states
  

  type SampleGroup = "water" | "soil" | "pl_pcr" | "microbiology" ;
  const sampleTypeOptions: SampleGroup[] = ["water", "soil", "pl_pcr", "microbiology","wssv"];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [dateOfCulture, setDateOfCulture] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<SampleGroup[]>([]);
  const [quantities, setQuantities] = useState<Record<SampleGroup, number>>(() => ({} as Record<SampleGroup, number>));

  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

// Read values from URL (fallback to empty string)
const searchQuery = searchParams.get("q") || "";
const startDate   = searchParams.get("start") || "";
const endDate     = searchParams.get("end") || "";

  // Payment Dialog State 
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [paymentModeLocal, setPaymentModeLocal] = useState<"cash" | "qr" | "neft" | "">("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Fetch current branch technicians (for filter dropdown)
  useEffect(() => {
    const fetchTechnicians = async () => {
      const locationId = session.locationId;
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
        console.error("Error fetching branch technicians:", err);
      }
    };
    fetchTechnicians();
  }, [session.locationId]);

  // Fetch technicians from ALL OTHER branches (for new submission choice)
  useEffect(() => {
    const fetchAllOtherTechnicians = async () => {
      if (!session.locationId) return;

      try {
        const locationsSnap = await getDocs(collection(db, "locations"));
        const otherTechs: { id: string; name: string; branchId: string }[] = [];

        for (const locDoc of locationsSnap.docs) {
          const locId = locDoc.id;
          if (locId === session.locationId) continue;

          const techRef = collection(db, "locations", locId, "technicians");
          const techSnap = await getDocs(techRef);

          techSnap.docs.forEach(techDoc => {
            const name = techDoc.data().name || "Unknown Technician";
            otherTechs.push({
              id: techDoc.id,
              name,
              branchId: locId
            });
          });
        }

        otherTechs.sort((a, b) => a.name.localeCompare(b.name));
        setAllOtherTechnicians(otherTechs);
      } catch (err) {
        console.error("Error fetching other branches technicians:", err);
      }
    };

    fetchAllOtherTechnicians();
  }, [session.locationId]);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const locationId = session.locationId;
        if (!locationId) return;
        const ref = collection(db, "locations", locationId, "farmers");
        const snap = await getDocs(ref);
        const list: Farmer[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Farmer[];
        setFarmers(list);
      } catch (error) {
        console.error("Failed to fetch farmers:", error);
      }
    };
    fetchFarmers();
  }, [session.locationId]);

  useEffect(() => {
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const locationId = session.locationId;
      if (!locationId) return;

      let invoicesQuery = query(
        collection(db, "locations", locationId, "invoices"),
        orderBy("createdAt", "desc")
      );

      if (startDate && endDate) {
        const startT = new Date(startDate);
        const endT = new Date(`${endDate}T23:59:59.999`);

        // Make sure dates are valid
        if (!isNaN(startT.getTime()) && !isNaN(endT.getTime())) {
          invoicesQuery = query(
            collection(db, "locations", locationId, "invoices"),
            where("createdAt", ">=", startT),
            where("createdAt", "<=", endT),
            orderBy("createdAt", "desc")
          );
        }
      }

      const snap = await getDocs(invoicesQuery);

      const data = snap.docs.map((doc) => {
        const docData = doc.data();
        if ('id' in docData) delete (docData as any).id;
        return { id: doc.id, ...docData };
      });

      setInvoices(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  fetchInvoices();
}, [session.locationId, searchParams]);  

  const resetForm = () => {
    setStep(1);
    setSelectedFarmer(null);
    setDateOfCulture("");
    setSelectedTypes([]);
    setQuantities({} as Record<SampleGroup, number>);
    setFarmerSearchQuery("");
    setOpen(false);
    setSelectedOtherTechId("none"); // reset for next time
  };

  const isReportFullyCompleted = (sample: any) => {
  if (!sample.reportsProgress) return false;
  if (!sample.sampleType || !Array.isArray(sample.sampleType)) return false;

  const activeTypes = sample.sampleType
    .map((s: any) => {
      if (typeof s === "string") return s.toLowerCase().trim();
      if (s && typeof s === "object" && s.type) return s.type.toString().toLowerCase().trim();
      return null;
    })
    .filter((type: string | null): type is string => 
      type !== null && 
      type !== "" && 
      type !== "pl_pcr" && 
      type !== "wssv"          // ← Add this line: ignore WSSV completely
    )
    .filter((type: string, index: number) => {
      const originalEntry = sample.sampleType[index];
      let count = 0;
      if (typeof originalEntry === "object" && originalEntry.count !== undefined) {
        count = Number(originalEntry.count);
      } else {
        const match = sample.sampleType.find((t: any) =>
          (typeof t === "object" ? t.type?.toLowerCase() : t?.toLowerCase()) === type
        );
        count = typeof match === "object" ? Number(match?.count || 0) : 0;
      }
      return count > 0;
    });

  if (activeTypes.length === 0) return true;

  return activeTypes.every((type: string) => sample.reportsProgress[type] === "completed");
};

  const filteredInvoices = useMemo(() => {
  let result = invoices;

  // Technician filter
  if (selectedTechnicianId !== "all") {
    result = result.filter((inv) => inv.technicianId === selectedTechnicianId);
  }

  // Text search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((inv) => {
      return (
        (inv.farmerName || "").toLowerCase().includes(q) ||
        (inv.farmerPhone || "").toLowerCase().includes(q) ||
        (inv.invoiceId || inv.id || "").toLowerCase().includes(q)
      );
    });
  }

  return result;
}, [invoices, selectedTechnicianId, searchQuery]);

const sortedInvoices = useMemo(() => {
  return [...filteredInvoices].sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
    const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
    return timeB - timeA;
  });
}, [filteredInvoices]);

  const filteredFarmerSelection = useMemo(() => {
    return farmers.filter(f => 
      f.name.toLowerCase().includes(farmerSearchQuery.toLowerCase()) || 
      f.phone.includes(farmerSearchQuery) ||
      f.id.toLowerCase().includes(farmerSearchQuery.toLowerCase())
    );
  }, [farmers, farmerSearchQuery]);

  const handleAddPayment = async () => {
    if (!currentInvoice || !paymentModeLocal || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if ((paymentModeLocal === "qr" || paymentModeLocal === "neft") && !transactionRef.trim()) {
      toast({
        title: "Error",
        description: "Transaction reference is required for QR/NEFT",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPaid = (currentInvoice.paidAmount || 0) + amount;
      const newBalance = currentInvoice.total - newPaid;

      const invoiceRef = doc(db, "locations", session.locationId!, "invoices", currentInvoice.id);

      await updateDoc(invoiceRef, {
        paidAmount: newPaid,
        balanceAmount: newBalance > 0 ? newBalance : 0,
        isPartialPayment: newBalance > 0,
        paymentMode: paymentModeLocal,
        transactionRef: paymentModeLocal !== "cash" ? transactionRef.trim() : null,
        lastPaymentDate: new Date(),
      });

      setInvoices(prev => prev.map(inv => 
        inv.id === currentInvoice.id 
          ? { ...inv, paidAmount: newPaid, balanceAmount: newBalance > 0 ? newBalance : 0 }
          : inv
      ));

      toast({
        title: "Success",
        description: `₹${amount} payment recorded successfully!`,
      });

      setPaymentDialogOpen(false);
      resetPaymentForm();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPaymentDialog = (invoice: any) => {
    setCurrentInvoice(invoice);
    const pending = invoice.total - (invoice.paidAmount || 0);
    setPaymentAmount(pending.toString());
    setPaymentModeLocal("");
    setTransactionRef("");
    setPaymentDialogOpen(true);
  };

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentModeLocal("");
    setTransactionRef("");
    setCurrentInvoice(null);
  };

  const handleSubmitAndGenerate = () => {
    if (!selectedFarmer || !dateOfCulture || selectedTypes.length === 0) return;

    const sampleSummary = selectedTypes.flatMap((type) => {
      const count = quantities[type] ?? 1;
      if (type === "pl_pcr") {
        return [{ type: "pl", count }, { type: "pcr", count }];
      }
      return [{ type, count }];
    });

    // Decide which technician to use for this NEW invoice
    let technicianForThisInvoice = {
      technicianId: session.technicianId || "unknown",
      technicianName: session.technicianName || "Current Technician"
    };

    if (selectedOtherTechId && selectedOtherTechId !== "none") {
      const chosen = allOtherTechnicians.find(t => t.id === selectedOtherTechId);
      if (chosen) {
        technicianForThisInvoice = {
          technicianId: chosen.id,
          technicianName: chosen.name
        };
      }
    }

    navigate("/invoice", {
      state: { 
        sampleSummary, 
        dateOfCulture, 
        farmer: selectedFarmer,
        technician: technicianForThisInvoice  // ← this is passed correctly
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Sample Submission</h1>
                <p className="text-muted-foreground">Submit and manage sample testing requests</p>
              </div>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Sample Submission
              </Button>
            </div>

            <Card className="shadow-sm mb-8">
  <CardContent className="pt-6">
    
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[240px]">
        <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Search samples
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
  placeholder="Farmer / Phone / Invoice ID..."
  className="pl-10 h-10"
  value={searchQuery}
  onChange={(e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newParams.set("q", value.trim());
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams, { replace: true }); // replace → no extra history entry
  }}
/>
        </div>
      </div>
      <div className="flex-1 min-w-[180px]">
        <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
          Start Date
        </Label>
        <Input
  type="date"
  value={startDate}
  onChange={(e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("start", value);
    } else {
      newParams.delete("start");
    }
    setSearchParams(newParams, { replace: true });
  }}
/>
      </div>
      <div className="flex-1 min-w-[180px]">
        <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
          End Date
        </Label>
        <Input
  type="date"
  value={endDate}
  onChange={(e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("end", value);
    } else {
      newParams.delete("end");
    }
    setSearchParams(newParams, { replace: true });
  }}
/>
      </div>

   
      {/* <Button
        className="h-10 bg-cyan-600 hover:bg-cyan-700"
        onClick={() => {}} 
      >
        Search
      </Button> */}

      
      
    </div>
  </CardContent>
</Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-4">
                <div>
                  <CardTitle>Recent Samples</CardTitle>
                  <CardDescription>View all submitted samples</CardDescription>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Filter by Tech:</span>
                    </div>
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger className="w-56 h-10">
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

                  {/* <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">Submit as Tech:</span>
                    </div>
                    <Select 
                      value={selectedOtherTechId} 
                      onValueChange={setSelectedOtherTechId}
                    >
                      <SelectTrigger className="w-64 h-10">
                        <SelectValue placeholder="Current technician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Current technician (me)</SelectItem>
                        {allOtherTechnicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Farmer Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Bill Amount</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Pending Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInvoices ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
                            <p className="text-muted-foreground">Loading samples...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : sortedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No samples found for selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedInvoices.map((sample) => {
                        const fullyCompleted = isReportFullyCompleted(sample);
                        const invoiceId = sample.invoiceId ?? sample.id;

                        const grandTotal = Number(sample.total || 0);
                        const paidSoFar = Number(sample.paidAmount || 0);
                        const pendingAmount = grandTotal - paidSoFar;

                        const isPaidAtGeneration = sample.paymentMode && sample.paymentMode !== "pending";
                        const displayPaid = isPaidAtGeneration ? grandTotal : paidSoFar;
                        const displayPending = isPaidAtGeneration ? 0 : pendingAmount;
                        const showAddPaymentButton = sample.paymentMode === "pending" && displayPending > 0;

                        const sampleDate = sample.createdAt
                          ? format(
                              sample.createdAt.toDate ? sample.createdAt.toDate() : new Date(sample.createdAt.seconds * 1000),
                              "dd MMM yyyy"
                            )
                          : "N/A";

                        // Always use the real stored name from Firestore
                        const displayTechnicianName = sample.technicianName || "Unknown";

                        return (
                          <TableRow key={sample.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {sampleDate}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{invoiceId}</TableCell>
                            <TableCell>{sample.farmerName}</TableCell>
                            <TableCell>{sample.farmerPhone ?? "N/A"}</TableCell>
                            <TableCell>{displayTechnicianName}</TableCell>
                            <TableCell>₹{grandTotal}</TableCell>
                            <TableCell className="font-medium text-green-600">₹{displayPaid}</TableCell>
                            <TableCell
                              className={
                                displayPending > 0
                                  ? "text-red-600 font-medium"
                                  : "text-green-600 font-medium"
                              }
                            >
                              ₹{displayPending}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
                                <Button
                                  className="bg-transparent text-black border hover:bg-cyan-700 hover:text-white"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/lab-results/${sample.invoiceId}${fullyCompleted ? "?mode=view" : ""}`)
                                  }
                                >
                                  {fullyCompleted ? "View Report" : "Generate Report"}
                                </Button>

                                <Button
                                  className="bg-transparent text-black border hover:bg-green-600 hover:text-white"
                                  size="sm"
                                  onClick={() => navigate(`/invoice/${invoiceId}/${session.locationId}`)}
                                >
                                  View Invoice
                                </Button>

                                {showAddPaymentButton && (
                                  <Button
                                    className="bg-transparent text-black border hover:bg-blue-600 hover:text-white flex items-center gap-1"
                                    size="sm"
                                    onClick={() => openPaymentDialog(sample)}
                                  >
                                    <IndianRupee className="w-4 h-4" />
                                    Add Payment
                                  </Button>
                                )}

                                <Button
                                  className="bg-transparent text-black border hover:bg-red-600 hover:text-white"
                                  size="sm"
                                  disabled={!fullyCompleted}
                                  onClick={() => navigate(`/lab-results/${sample.invoiceId}?mode=edit`)}
                                  title={!fullyCompleted ? "Edit available only after report is fully generated" : "Edit report data"}
                                >
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* New Sample Submission Dialog */}
            <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); }}>
              <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-xl">
                    {step === 1 ? "Select Farmer" : "Sample Details"}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Search and Select Farmer</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="Type name, phone or ID to search..." 
                            className="pl-10 h-11"
                            value={farmerSearchQuery}
                            onChange={(e) => setFarmerSearchQuery(e.target.value)}
                          />
                          {farmerSearchQuery && (
                            <button 
                              onClick={() => setFarmerSearchQuery("")}
                              className="absolute right-3 top-3"
                            >
                              <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>

                        <div className="border rounded-lg mt-2 overflow-hidden bg-white">
                          <div className="max-h-[220px] overflow-y-auto divide-y">
                            {filteredFarmerSelection.length > 0 ? (
                              filteredFarmerSelection.map((farmer) => (
                                <div
                                  key={farmer.id}
                                  onClick={() => {
                                    setSelectedFarmer(farmer);
                                    setFarmerSearchQuery(""); 
                                  }}
                                  className={`p-3 cursor-pointer transition-colors flex items-center justify-between hover:bg-cyan-50 ${selectedFarmer?.id === farmer.id ? 'bg-cyan-50 border-l-4 border-cyan-500' : ''}`}
                                >
                                  <div>
                                    <p className="font-semibold text-gray-800">{farmer.name}</p>
                                    <p className="text-xs text-muted-foreground">Ph: {farmer.phone}</p>
                                  </div>
                                  {selectedFarmer?.id === farmer.id && (
                                    <Check className="w-5 h-5 text-cyan-600" />
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-muted-foreground">
                                No farmers found matching your search.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedFarmer && (
                        <Card className="bg-muted/30 border-none shadow-none">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                              <div>
                                <span className="text-muted-foreground font-medium">Selected Farmer:</span>
                                <p className="text-lg font-bold text-cyan-700">{selectedFarmer.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Phone:</span>
                                <p className="font-semibold">{selectedFarmer.phone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Species:</span>
                                <p className="font-semibold">{selectedFarmer.species}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium">Location:</span>
                                <p className="font-semibold">{selectedFarmer.city}, {selectedFarmer.state}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 pb-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="font-semibold">Sample Type(s)</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {sampleTypeOptions.map((type) => (
                              <button
                                key={type}
                                onClick={() => {
                                  const willAdd = !selectedTypes.includes(type);
                                  setSelectedTypes(prev =>
                                    willAdd ? [...prev, type] : prev.filter(t => t !== type)
                                  );
                                  if (willAdd) {
                                    setQuantities(q => ({ ...q, [type]: 1 }));
                                  } else {
                                    setQuantities(prev => {
                                      const newQ = { ...prev };
                                      delete newQ[type];
                                      return newQ;
                                    });
                                  }
                                }}
                                className={`flex items-center justify-between p-3 rounded-md border text-sm font-medium transition-all ${
                                  selectedTypes.includes(type) 
                                    ? "bg-cyan-600 text-white border-cyan-700" 
                                    : "bg-white hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                {type === "pl_pcr" ? "PL / PCR" : type.charAt(0).toUpperCase() + type.slice(1)}
                                {selectedTypes.includes(type) && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-semibold">Date of Culture</Label>
                          <input
                            type="date"
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={dateOfCulture}
                            onChange={(e) => setDateOfCulture(e.target.value)}
                          />
                          <div className="bg-blue-50 p-4 rounded-lg mt-4">
                             <p className="text-xs text-blue-700 font-medium uppercase mb-1">Target Farmer</p>
                             <p className="font-bold text-gray-800">{selectedFarmer?.name}</p>
                             <p className="text-xs text-gray-600">{selectedFarmer?.phone}</p>
                          </div>
                        </div>
                      </div>

                      {selectedTypes.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                          <Label className="font-bold text-gray-800 uppercase tracking-wider text-xs">Quantity for each type</Label>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedTypes.map((type) => (
                              <div key={type} className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Label className="text-xs font-bold text-gray-600 uppercase">
                                  {type === "pl_pcr" ? "PL / PCR Samples" : `${type} Samples`}
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  className="bg-white"
                                  value={quantities[type] ?? 1}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                                    setQuantities(prev => ({ ...prev, [type]: val }));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="p-6 pt-2 border-t bg-gray-50/50">
                  {step === 1 ? (
                    <>
                      <Button onClick={resetForm} variant="outline" className="h-11 px-8">Cancel</Button>
                      <Button 
                        onClick={() => setStep(2)} 
                        disabled={!selectedFarmer} 
                        className="h-11 px-10 bg-cyan-600 hover:bg-cyan-700"
                      >
                        Next: Sample Details
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setStep(1)} variant="outline" className="h-11 px-8">Back</Button>
                      <Button
                        onClick={handleSubmitAndGenerate}
                        disabled={!dateOfCulture || selectedTypes.length === 0}
                        className="h-11 px-10 bg-cyan-600 hover:bg-cyan-700"
                      >
                        Submit & Generate Invoice
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Invoice: <span className="font-semibold">{currentInvoice?.invoiceId}</span> | 
                    Farmer: <span className="font-semibold">{currentInvoice?.farmerName}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Bill</p>
                      <p className="font-bold text-lg">₹{currentInvoice?.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending Amount</p>
                      <p className="font-bold text-lg text-red-600">
                        ₹{currentInvoice ? currentInvoice.total - (currentInvoice.paidAmount || 0) : 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount to Pay</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      max={currentInvoice ? currentInvoice.total - (currentInvoice.paidAmount || 0) : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={paymentModeLocal} onValueChange={(v) => setPaymentModeLocal(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="qr">QR Code / UPI</SelectItem>
                        <SelectItem value="neft">NEFT / Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentModeLocal === "qr" || paymentModeLocal === "neft") && (
                    <div className="space-y-2">
                      <Label>Transaction Reference</Label>
                      <Input
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="Enter UPI ID / Reference No."
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setPaymentDialogOpen(false); resetPaymentForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700">
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Samples;