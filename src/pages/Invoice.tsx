import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { availableTests } from "@/data/tests";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserSession } from "../contexts/UserSessionContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";



interface SampleSummaryItem {
  type: string;
  count: number;
}

interface LocationState {
  sampleSummary: SampleSummaryItem[];
  dateOfCulture: string;
  farmer: string | { name: string,address : string, phone : string,id: string};
}

const InvoicePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, setSession } = useUserSession();

  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const [paymentMode, setPaymentMode] = useState<"" | "cash" | "qr" | "neft">("");

  const locationId = session.locationId;
  const technicianId = session.technicianId;
  const technicianName = session.technicianName;
  const sampleSummary = state?.sampleSummary || [];
  const dateOfCulture = state?.dateOfCulture || "";
  const farmerName = typeof state?.farmer === "string" ? state.farmer : state?.farmer?.name || "Unknown";
  const farmerId = typeof state?.farmer === "string" ? state.farmer : state?.farmer?.id || "Unknown";
  const village = typeof state?.farmer === "string" ? state.farmer : state?.farmer?.address || "Unknown";
  const mobile = typeof state?.farmer === "string" ? state.farmer : state?.farmer?.phone || "Unknown";
  
  // Track active sample per sample type
  const [activeSampleIndex, setActiveSampleIndex] = useState<{ [type: string]: number }>(() => {
    const obj: { [type: string]: number } = {};
    sampleSummary.forEach(s => (obj[s.type] = 0));
    return obj;
  });

  // Default tests that propagate to all samples
  const [defaultTests, setDefaultTests] = useState<{ [type: string]: Set<string> }>(() => {
    const obj: { [type: string]: Set<string> } = {};
    sampleSummary.forEach(s => (obj[s.type] = new Set()));
    return obj;
  });

  // Per sample overrides (add/remove tests individually)
  const [perSampleTests, setPerSampleTests] = useState<{
    [type: string]: { [index: number]: Set<string> };
  }>(() => {
    const obj: { [type: string]: { [index: number]: Set<string> } } = {};
    sampleSummary.forEach(s => {
      obj[s.type] = {};
      for (let i = 0; i < s.count; i++) obj[s.type][i] = new Set();
    });
    return obj;
  });
  const generateInvoiceId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};


  // Toggle test selection
  const handleToggleTest = (sampleType: string, index: number, testId: string) => {
    const effectiveSet = new Set([
      ...defaultTests[sampleType],
      ...perSampleTests[sampleType][index],
    ]);

    if (effectiveSet.has(testId)) {
      // Remove from per-sample override
      setPerSampleTests(prev => {
        const newSet = new Set(prev[sampleType][index]);
        newSet.delete(testId);
        return {
          ...prev,
          [sampleType]: { ...prev[sampleType], [index]: newSet },
        };
      });
    } else {
      // Add to default to propagate to other samples
      setDefaultTests(prev => {
        const newSet = new Set(prev[sampleType]);
        newSet.add(testId);
        return { ...prev, [sampleType]: newSet };
      });
    }
  };

  // Get effective selection for a sample
  const getEffectiveSelection = (sampleType: string, index: number) =>
    new Set([...defaultTests[sampleType], ...perSampleTests[sampleType][index]]);

  // Calculate invoice totals grouped by sample type
  const calculateGroupedTotal = () => {
    const groupedItems: { [type: string]: { name: string; quantity: number; total: number; price: number }[] } = {};
    let total = 0;

    sampleSummary.forEach(s => {
      const type = s.type;
      groupedItems[type] = [];
      const testTotals: { [testId: string]: { quantity: number; price: number } } = {};

      for (let i = 0; i < s.count; i++) {
        getEffectiveSelection(type, i).forEach(testId => {
          const test = availableTests.find(t => t.id === testId);
          if (!test) return;
          if (!testTotals[testId]) testTotals[testId] = { quantity: 0, price: test.price };
          testTotals[testId].quantity += 1;
        });
      }

      Object.entries(testTotals).forEach(([testId, data]) => {
        groupedItems[type].push({ name: availableTests.find(t => t.id === testId)!.name, quantity: data.quantity, price: data.price, total: data.quantity * data.price });
        total += data.quantity * data.price;
      });
    });

    return { total, groupedItems };
  };

  const { total, groupedItems } = calculateGroupedTotal();
const handleGenerateInvoice = async () => {
  if (total === 0) {
    toast({ title: "Error", description: "Please select at least one test", variant: "destructive" });
    return;
  }

  if (!paymentMode) {
    toast({ title: "Error", description: "Please select a payment mode", variant: "destructive" });
    return;
  }

  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth()+1).toString().padStart(2,"0")}-${today.getFullYear()}`;
  const selectedSampleTypes = Object.keys(groupedItems);
  const invoiceId = generateInvoiceId();
  // Prepare invoice data to store
  const invoiceData = {
    id : invoiceId,
    farmerName,
    farmerId,
    farmerPhone: mobile,
    locationId,
    technicianName,
    technicianId,
    dateOfCulture, // string, e.g., "2025-11-01"
    tests: groupedItems,
    total,
    village,
    mobile,
    paymentMode,
    sampleType: selectedSampleTypes, // your array of sample types
    createdAt: serverTimestamp(),
  };

  try {
    // Add invoice to Firestore
    const docRef = await addDoc(collection(db, "locations", locationId, "invoices"), invoiceData);

    // Navigate to invoice template with state
    navigate("/invoice-template", { state: { ...invoiceData, formattedDate } });
    toast({ title: "Success", description: "Invoice generated successfully!" });
  } catch (error) {
    console.error("Error adding invoice: ", error);
    toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
  }
};

  return (
    <DashboardLayout>
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Samples & Tests */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Samples for {farmerName} ({dateOfCulture})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sampleSummary.map(s => (
                <div key={s.type}>
                  <h4 className="font-semibold mb-2 capitalize">{s.type} Samples</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Array.from({ length: s.count }).map((_, i) => (
                      <Button
                        key={i}
                        variant={activeSampleIndex[s.type] === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveSampleIndex(prev => ({ ...prev, [s.type]: i }))}
                      >
                        Sample {i + 1}
                      </Button>
                    ))}
                  </div>

                  {/* Tests for active sample */}
                  {activeSampleIndex[s.type] !== undefined && (
                    <div className="space-y-2">
                      {availableTests
                        .filter(t => t.sampleType.toLowerCase() === s.type.toLowerCase())
                        .map(test => (
                          <div key={test.id} className="flex items-center gap-4 p-2 border rounded">
                            <Checkbox
                              checked={getEffectiveSelection(s.type, activeSampleIndex[s.type]).has(test.id)}
                              onCheckedChange={() =>
                                handleToggleTest(s.type, activeSampleIndex[s.type], test.id)
                              }
                            />
                            <div className="flex-1">{test.name} (₹{test.price})</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Grouped Invoice & Payment */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(groupedItems).length > 0 ? (
                <>
                  {Object.entries(groupedItems).map(([type, items]) => (
                    <div key={type} className="mb-4">
                      <h5 className="font-semibold capitalize mb-2">{type} Tests</h5>
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground text-sm">Select tests to see invoice</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
                <Card>
  <CardHeader>
    <CardTitle>Payment Details</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label>Payment Mode</Label>
      <Select
        value={paymentMode}
        onValueChange={(value: "cash" | "qr" | "neft") => setPaymentMode(value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="qr">QR Code / UPI</SelectItem>
          <SelectItem value="neft">NEFT / Bank Transfer</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* These inputs are just shown for UI, no state tracking */}
    {paymentMode === "qr" && (
      <div>
        <Label>Transaction ID</Label>
        <Input placeholder="Enter UPI transaction ID" />
      </div>
    )}

    {paymentMode === "neft" && (
      <div>
        <Label>Reference ID</Label>
        <Input placeholder="Enter NEFT reference ID" />
      </div>
    )}

    <Button onClick={handleGenerateInvoice} className="w-full" size="lg">
      Generate Invoice & Proceed
    </Button>
  </CardContent>
</Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicePage;
