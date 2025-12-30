import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, DollarSign, Package, Edit, Search, Download } from "lucide-react";
import { toast } from "sonner";

import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

import { useUserSession } from "../contexts/UserSessionContext";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface Payment {
  id: string;
  date: string;
  particulars: string;
  toPay: string;
  amount: number;
  invoiceId: string;
  createdAt: Timestamp;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  value: number;
  acquiredDate: string;
  workingCondition: string;
  createdAt: Timestamp;
}

const CMIS = () => {
  const { session } = useUserSession();

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editPaymentMode, setEditPaymentMode] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    date: "",
    particulars: "",
    toPay: "",
    amount: "",
    invoiceId: "",
  });

  // Assets state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [openAssetDialog, setOpenAssetDialog] = useState(false);
  const [editAssetMode, setEditAssetMode] = useState(false);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [assetFormData, setAssetFormData] = useState({
    name: "",
    description: "",
    value: "",
    acquiredDate: "",
    workingCondition: "Working",
  });

  // Fetch payments
  const fetchPayments = async () => {
    if (!session.locationId) return;
    const ref = collection(db, "locations", session.locationId, "payments");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Payment[] = snap.docs.map((d) => ({
      id: d.id,
      date: d.data().date || "",
      particulars: d.data().particulars || d.data().paidTo || "",
      toPay: d.data().toPay || d.data().paidFrom || "",
      amount: d.data().amount || 0,
      invoiceId: d.data().invoiceId || "",
      createdAt: d.data().createdAt,
    })) as Payment[];
    setPayments(list);
  };

  // Fetch assets
  const fetchAssets = async () => {
    if (!session.locationId) return;
    const ref = collection(db, "locations", session.locationId, "assets");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Asset[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      workingCondition: d.data().workingCondition || "Working",
    })) as Asset[];
    setAssets(list);
  };

  useEffect(() => {
    fetchPayments();
    fetchAssets();
  }, [session.locationId]);

  // Handle payment submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.locationId) return;

    const paymentData = {
      date: paymentFormData.date,
      particulars: paymentFormData.particulars,
      toPay: paymentFormData.toPay,
      amount: Number(paymentFormData.amount),
      invoiceId: paymentFormData.invoiceId,
      createdAt: Timestamp.now(),
    };

    try {
      if (editPaymentMode && editPaymentId) {
        const ref = doc(db, "locations", session.locationId, "payments", editPaymentId);
        await updateDoc(ref, paymentData);
        toast.success("Payment updated successfully!");
      } else {
        await addDoc(collection(db, "locations", session.locationId, "payments"), paymentData);
        toast.success("Payment added successfully!");
      }
      setOpenPaymentDialog(false);
      resetPaymentForm();
      fetchPayments();
    } catch (err) {
      toast.error("Failed to save payment.");
    }
  };

  // Handle asset submit
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.locationId) return;

    const assetData = {
      name: assetFormData.name,
      description: assetFormData.description,
      value: Number(assetFormData.value),
      acquiredDate: assetFormData.acquiredDate,
      workingCondition: assetFormData.workingCondition,
      createdAt: Timestamp.now(),
    };

    try {
      if (editAssetMode && editAssetId) {
        const ref = doc(db, "locations", session.locationId, "assets", editAssetId);
        await updateDoc(ref, assetData);
        toast.success("Asset updated successfully!");
      } else {
        await addDoc(collection(db, "locations", session.locationId, "assets"), assetData);
        toast.success("Asset added successfully!");
      }
      setOpenAssetDialog(false);
      resetAssetForm();
      fetchAssets();
    } catch (err) {
      toast.error("Failed to save asset.");
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      date: "",
      particulars: "",
      toPay: "",
      amount: "",
      invoiceId: "",
    });
    setEditPaymentMode(false);
    setEditPaymentId(null);
  };

  const resetAssetForm = () => {
    setAssetFormData({
      name: "",
      description: "",
      value: "",
      acquiredDate: "",
      workingCondition: "Working",
    });
    setEditAssetMode(false);
    setEditAssetId(null);
  };

  // Edit payment
  const handleEditPayment = (payment: Payment) => {
    setPaymentFormData({
      date: payment.date,
      particulars: payment.particulars,
      toPay: payment.toPay,
      amount: payment.amount.toString(),
      invoiceId: payment.invoiceId,
    });
    setEditPaymentMode(true);
    setEditPaymentId(payment.id);
    setOpenPaymentDialog(true);
  };

  // Edit asset
  const handleEditAsset = (asset: Asset) => {
    setAssetFormData({
      name: asset.name,
      description: asset.description,
      value: asset.value.toString(),
      acquiredDate: asset.acquiredDate,
      workingCondition: asset.workingCondition || "Working",
    });
    setEditAssetMode(true);
    setEditAssetId(asset.id);
    setOpenAssetDialog(true);
  };

  // Filtered payments
  const filteredPayments = payments.filter(
    (p) =>
      p.particulars.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.toPay.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.invoiceId.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  // Filtered assets
  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.description.toLowerCase().includes(assetSearch.toLowerCase())
  );

  // Excel Export Functions
  const exportPaymentsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.addRow(["S.No", "Date", "Particulars", "To Pay", "Amount (₹)", "Invoice ID"]);

    filteredPayments.forEach((payment, index) => {
      sheet.addRow([
        index + 1,
        payment.date,
        payment.particulars,
        payment.toPay,
        payment.amount,
        payment.invoiceId,
      ]);
    });

    sheet.getRow(1).font = { bold: true };
    sheet.columns = [
      { width: 10 },
      { width: 15 },
      { width: 30 },
      { width: 25 },
      { width: 15 },
      { width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `Lab_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportAssetsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Assets");

    sheet.addRow(["S.No", "Name", "Description", "Value (₹)", "Acquired Date", "Working Condition"]);

    filteredAssets.forEach((asset, index) => {
      sheet.addRow([
        index + 1,
        asset.name,
        asset.description || "N/A",
        asset.value,
        asset.acquiredDate,
        asset.workingCondition,
      ]);
    });

    sheet.getRow(1).font = { bold: true };
    sheet.columns = [
      { width: 10 },
      { width: 25 },
      { width: 35 },
      { width: 15 },
      { width: 18 },
      { width: 20 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `Lab_Assets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
  <div className="flex-1 overflow-y-auto p-6 md:p-8">
    <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">CMIS - Lab Management</h1>
          <p className="text-muted-foreground">Manage laboratory expenses, assets, and payments</p>
        </div>

        {/* Payments Section */}
        <Card className="mb-12 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-2xl">Payments</CardTitle>
                  <CardDescription>Track and manage lab payments</CardDescription>
                </div>
              </div>
              <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editPaymentMode ? "Edit Payment" : "Add New Payment"}</DialogTitle>
                    <DialogDescription>
                      {editPaymentMode ? "Update payment details." : "Enter payment details below."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={paymentFormData.date}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Particulars *</Label>
                      <Input
                        placeholder="Enter particulars"
                        value={paymentFormData.particulars}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, particulars: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Pay *</Label>
                      <Input
                        placeholder="Enter payee"
                        value={paymentFormData.toPay}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, toPay: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice ID *</Label>
                      <Input
                        placeholder="Enter invoice ID"
                        value={paymentFormData.invoiceId}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceId: e.target.value })}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { setOpenPaymentDialog(false); resetPaymentForm(); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{editPaymentMode ? "Update" : "Add"} Payment</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md mt-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments by particulars, to pay, or invoice ID..."
                  className="pl-10"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
              </div>
              <Button onClick={exportPaymentsToExcel} variant="outline" className="mt-5 gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead>To Pay</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payments recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment, index) => (
                      <TableRow key={payment.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.particulars}</TableCell>
                        <TableCell>{payment.toPay}</TableCell>
                        <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.invoiceId}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Assets Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-2xl">Lab Equipment & Inventory</CardTitle>
                  <CardDescription>Manage lab assets and particulars</CardDescription>
                </div>
              </div>
              <Dialog open={openAssetDialog} onOpenChange={setOpenAssetDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editAssetMode ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                    <DialogDescription>
                      {editAssetMode ? "Update asset details." : "Enter asset details below."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAssetSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="Enter asset name"
                        value={assetFormData.name}
                        onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Enter description"
                        value={assetFormData.description}
                        onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Value *</Label>
                        <Input
                          type="number"
                          placeholder="Enter value"
                          value={assetFormData.value}
                          onChange={(e) => setAssetFormData({ ...assetFormData, value: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Acquired Date *</Label>
                        <Input
                          type="date"
                          value={assetFormData.acquiredDate}
                          onChange={(e) => setAssetFormData({ ...assetFormData, acquiredDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Condition *</Label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={assetFormData.workingCondition}
                        onChange={(e) => setAssetFormData({ ...assetFormData, workingCondition: e.target.value })}
                        required
                      >
                        <option value="Working">Working</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Not Working">Not Working</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => { setOpenAssetDialog(false); resetAssetForm(); }}>
                        Cancel
                      </Button>
                      <Button type="submit">{editAssetMode ? "Update" : "Add"} Asset</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md mt-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets by name or description..."
                  className="pl-10"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
              <Button onClick={exportAssetsToExcel} variant="outline" className="mt-5 gap-2">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead>S.No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Acquired Date</TableHead>
                    <TableHead>Working Condition</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No assets recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset, index) => (
                      <TableRow key={asset.id} className="hover:bg-green-50/50 transition-colors">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.description || "N/A"}</TableCell>
                        <TableCell>₹{asset.value.toLocaleString()}</TableCell>
                        <TableCell>{asset.acquiredDate}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            asset.workingCondition === "Working" 
                              ? "bg-green-100 text-green-800" 
                              : asset.workingCondition === "Under Maintenance"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {asset.workingCondition}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAsset(asset)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default CMIS;