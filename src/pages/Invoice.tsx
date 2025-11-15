import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Sample, Invoice, InvoiceItem } from "@/types";
import { availableTests } from "@/data/tests";
import { useToast } from "@/hooks/use-toast";
import { Receipt } from "lucide-react";

const InvoicePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [samples] = useLocalStorage<Sample[]>("samples", []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>("invoices", []);
  
  const [currentSamples, setCurrentSamples] = useState<Sample[]>([]);
  const [selectedTests, setSelectedTests] = useState<{ [key: string]: { selected: boolean; quantity: number } }>({});
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "qr" | "neft">("cash");
  const [transactionId, setTransactionId] = useState("");
  const [referenceId, setReferenceId] = useState("");

  useEffect(() => {
    const sampleIds = searchParams.get("samples")?.split(",") || [];
    const foundSamples = samples.filter(s => sampleIds.includes(s.id));
    setCurrentSamples(foundSamples);
  }, [searchParams, samples]);

  const sampleType = currentSamples[0]?.sampleType;
  const relevantTests = availableTests.filter(test => test.sampleType === sampleType);

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: {
        selected: !prev[testId]?.selected,
        quantity: prev[testId]?.quantity || 1
      }
    }));
  };

  const handleQuantityChange = (testId: string, quantity: number) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        quantity: Math.max(1, quantity)
      }
    }));
  };

  const generateInvoiceNumber = () => {
    const count = invoices.length + 1;
    return `INV${String(count).padStart(5, "0")}`;
  };

  const calculateTotal = () => {
    const items: InvoiceItem[] = Object.entries(selectedTests)
      .filter(([_, data]) => data.selected)
      .map(([testId, data]) => {
        const test = relevantTests.find(t => t.id === testId)!;
        return {
          testId,
          testName: test.name,
          quantity: data.quantity,
          price: test.price,
          total: test.price * data.quantity
        };
      });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    return { items, subtotal, discountAmount, total };
  };

  const handleGenerateInvoice = () => {
    if (currentSamples.length === 0) {
      toast({
        title: "Error",
        description: "No samples found",
        variant: "destructive"
      });
      return;
    }

    const { items, subtotal, total } = calculateTotal();

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive"
      });
      return;
    }

    if (paymentMode === "qr" && !transactionId) {
      toast({
        title: "Error",
        description: "Please enter transaction ID for QR payment",
        variant: "destructive"
      });
      return;
    }

    if (paymentMode === "neft" && !referenceId) {
      toast({
        title: "Error",
        description: "Please enter reference ID for NEFT payment",
        variant: "destructive"
      });
      return;
    }

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      farmerId: currentSamples[0].farmerId,
      farmerName: currentSamples[0].farmerName,
      samples: currentSamples,
      items,
      subtotal,
      discount,
      total,
      paymentMode,
      transactionId: paymentMode === "qr" ? transactionId : undefined,
      referenceId: paymentMode === "neft" ? referenceId : undefined,
      createdAt: new Date(),
      technicianId: localStorage.getItem("technicianId") || "TECH001",
      locationId: localStorage.getItem("locationId") || "LOC001"
    };

    setInvoices([...invoices, newInvoice]);

    toast({
      title: "Invoice Generated",
      description: `Invoice ${newInvoice.invoiceNumber} created successfully`,
    });

    navigate(`/lab-results?invoice=${newInvoice.id}`);
  };

  const { items, subtotal, discountAmount, total } = calculateTotal();

  if (currentSamples.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No samples found. Please submit samples first.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Generate Invoice</h1>
          <p className="text-muted-foreground">Select tests and generate invoice</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Farmer:</span>
                    <span className="font-medium">{currentSamples[0].farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sample Type:</span>
                    <span className="font-medium capitalize">{currentSamples[0].sampleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of Samples:</span>
                    <span className="font-medium">{currentSamples.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    relevantTests.reduce((acc, test) => {
                      if (!acc[test.category]) acc[test.category] = [];
                      acc[test.category].push(test);
                      return acc;
                    }, {} as Record<string, typeof relevantTests>)
                  ).map(([category, tests]) => (
                    <div key={category}>
                      <h4 className="font-semibold mb-3 text-primary">{category}</h4>
                      <div className="space-y-3">
                        {tests.map((test) => (
                          <div key={test.id} className="flex items-center gap-4 p-3 rounded-lg border">
                            <Checkbox
                              checked={selectedTests[test.id]?.selected || false}
                              onCheckedChange={() => handleTestToggle(test.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{test.name}</p>
                              <p className="text-sm text-muted-foreground">₹{test.price} per test</p>
                            </div>
                            {selectedTests[test.id]?.selected && (
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Qty:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={selectedTests[test.id]?.quantity || 1}
                                  onChange={(e) => handleQuantityChange(test.id, parseInt(e.target.value))}
                                  className="w-20"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.testId} className="flex justify-between text-sm">
                          <span>{item.testName} x{item.quantity}</span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Discount %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20"
                        />
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>Discount ({discount}%)</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Select tests to see invoice</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(value: any) => setPaymentMode(value)}>
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

                {paymentMode === "qr" && (
                  <div>
                    <Label>Transaction ID</Label>
                    <Input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter UPI transaction ID"
                    />
                  </div>
                )}

                {paymentMode === "neft" && (
                  <div>
                    <Label>Reference ID</Label>
                    <Input
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="Enter NEFT reference ID"
                    />
                  </div>
                )}

                <Button onClick={handleGenerateInvoice} className="w-full" size="lg">
                  Generate Invoice & Proceed to Results
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicePage;
