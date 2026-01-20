import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { availableTests } from "@/data/tests";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUserSession } from "../contexts/UserSessionContext";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

interface SampleSummaryItem {
  type: string;
  count: number;
}

interface LocationState {
  sampleSummary: SampleSummaryItem[];
  dateOfCulture: string;
  farmer: { name: string; address: string; phone: string; id: string };
  technician?: { technicianId: string; technicianName: string };
}

const PCR_PATHOGEN_MAP: Record<string, string> = {
  pl_ehp: "PL EHP",
  soil_ehp: "Soil EHP",
  water_ehp: "Water EHP",
  pl_wssv: "WSSV",
  pl_vibrio_pcr: "VIBRIO",
  pl_ihhnv: "IHHNV",
};

const InvoicePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useUserSession();

  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const passedTechnician = state?.technician || null;

  const [paymentMode, setPaymentMode] = useState<"" | "cash" | "qr" | "neft" | "rtgs" | "pending">("");
  const [transactionRef, setTransactionRef] = useState<string>("");

  const [isZeroInvoice, setIsZeroInvoice] = useState(false);

  const locationId = session.locationId;

  const [locationName, setLocationName] = useState<string>("");

  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<string>("");

  useEffect(() => {
    const fetchLocationName = async () => {
      if (!locationId) return;
      try {
        const locDoc = await getDoc(doc(db, "locations", locationId));
        if (locDoc.exists()) {
          const data = locDoc.data();
          const name = data.name?.toLowerCase().trim() || "";
          setLocationName(name);
        } else {
          console.warn("Location document not found");
          setLocationName("");
        }
      } catch (error) {
        console.error("Error fetching location name:", error);
        setLocationName("");
      }
    };
    fetchLocationName();
  }, [locationId]);

  const sampleSummary = state?.sampleSummary || [];
  const dateOfCulture = state?.dateOfCulture || "";
  const farmerName = state?.farmer?.name || "Unknown";
  const farmerId = state?.farmer?.id || "Unknown";
  const village = state?.farmer?.address || "Unknown";
  const mobile = state?.farmer?.phone || "Unknown";

  const pcrCount = sampleSummary.find((s) => s.type === "pcr")?.count || 0;
  const plPcrSampleCount = pcrCount;

  const [activeSampleIndex, setActiveSampleIndex] = useState<{ [key: string]: number }>(() => {
    const init: { [key: string]: number } = {};
    sampleSummary.forEach((s) => {
      if (s.type !== "pl" && s.type !== "pcr") {
        init[s.type] = 0;
      }
    });
    if (plPcrSampleCount > 0) {
      init["pl_pcr"] = 0;
    }
    return init;
  });

  const [perSampleTests, setPerSampleTests] = useState<{
    pl: Set<string>[];
    pcr: Set<string>[];
    [other: string]: Set<string>[];
  }>(() => {
    const init: any = { pl: [], pcr: [] };
    for (let i = 0; i < plPcrSampleCount; i++) {
      init.pl.push(new Set<string>());
      init.pcr.push(new Set<string>());
    }
    sampleSummary.forEach((s) => {
      if (s.type !== "pl" && s.type !== "pcr") {
        init[s.type] = [];
        for (let i = 0; i < s.count; i++) {
          init[s.type].push(new Set<string>());
        }
      }
    });
    return init;
  });

  const actualPlCount = useMemo(() => {
    const samplesWithPlTests = new Set<number>();
    perSampleTests.pl.forEach((set, index) => {
      if (set.size > 0) samplesWithPlTests.add(index);
    });
    return samplesWithPlTests.size;
  }, [perSampleTests.pl]);

  const actualPcrCount = useMemo(() => {
    const samplesWithPcrTests = new Set<number>();
    perSampleTests.pcr.forEach((set, index) => {
      if (set.size > 0) samplesWithPcrTests.add(index);
    });
    return samplesWithPcrTests.size;
  }, [perSampleTests.pcr]);

  const samplePathogens = useMemo(() => {
    const result: Record<number, string[]> = {};
    perSampleTests.pcr.forEach((set, index) => {
      const pathogens = new Set<string>();
      set.forEach((testId) => {
        const pathogen = PCR_PATHOGEN_MAP[testId];
        if (pathogen) pathogens.add(pathogen);
      });
      if (pathogens.size > 0) {
        result[index + 1] = Array.from(pathogens);
      }
    });
    return result;
  }, [perSampleTests.pcr]);

  const generateInvoiceId = (): string => {
    let prefix = "XXX";
    if (locationName) {
      const lowerName = locationName.toLowerCase();
      if (lowerName.includes("nellore")) prefix = "NCR";
      else if (lowerName.includes("bhimavaram")) prefix = "BVRM";
      else if (lowerName.includes("tamarakollu")) prefix = "TMRK";
      else if (lowerName.includes("ganapavaram")) prefix = "GVRM";
      else if (lowerName.includes("juvvalapalem")) prefix = "JP";
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ADC ${prefix}${randomPart}`;
  };

  const toggleTest = (sampleType: string, sampleIndex: number, testId: string) => {
    setPerSampleTests((prev) => {
      const newSets = [...(prev[sampleType] || [])];
      const set = newSets[sampleIndex];
      if (set.has(testId)) {
        set.delete(testId);
      } else {
        set.add(testId);
      }
      return { ...prev, [sampleType]: newSets };
    });
  };

  const applyToAll = (sampleType: "pl" | "pcr", testId: string) => {
    setPerSampleTests((prev) => {
      const newSets = prev[sampleType].map((set) => {
        const newSet = new Set(set);
        newSet.add(testId);
        return newSet;
      });
      return { ...prev, [sampleType]: newSets };
    });
  };

  const isAppliedToAll = (sampleType: "pl" | "pcr", testId: string): boolean => {
    return perSampleTests[sampleType].every((set) => set.has(testId));
  };

  const calculateTotals = () => {
    // We always calculate the real test grouping (so we can save which tests were selected)
    const groupedItems: {
      [type: string]: { name: string; quantity: number; total: number; price: number }[];
    } = {};
    let subtotal = 0;

    // PCR tests
    if (actualPcrCount > 0) {
      const pcrTestCount: { [testId: string]: number } = {};
      perSampleTests.pcr.forEach((set) => {
        if (set.size > 0) {
          set.forEach((testId) => {
            pcrTestCount[testId] = (pcrTestCount[testId] || 0) + 1;
          });
        }
      });
      groupedItems["pcr"] = Object.entries(pcrTestCount)
        .map(([testId, qty]) => {
          const test = availableTests.find((t) => t.id === testId && t.sampleType === "pcr");
          if (!test) return null;
          const itemTotal = qty * test.price;
          subtotal += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    }

    // PL tests
    if (actualPlCount > 0) {
      const plTestCount: { [testId: string]: number } = {};
      perSampleTests.pl.forEach((set) => {
        if (set.size > 0) {
          set.forEach((testId) => {
            plTestCount[testId] = (plTestCount[testId] || 0) + 1;
          });
        }
      });
      groupedItems["pl"] = Object.entries(plTestCount)
        .map(([testId, qty]) => {
          const test = availableTests.find((t) => t.id === testId && t.sampleType === "pl");
          if (!test) return null;
          const itemTotal = qty * test.price;
          subtotal += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    }

    // Other sample types
    sampleSummary.forEach((s) => {
      if (s.type === "pl" || s.type === "pcr") return;
      const testCount: { [testId: string]: number } = {};
      perSampleTests[s.type]?.forEach((set) => {
        set.forEach((testId) => {
          testCount[testId] = (testCount[testId] || 0) + 1;
        });
      });
      groupedItems[s.type] = Object.entries(testCount)
        .map(([testId, qty]) => {
          const test = availableTests.find((t) => t.id === testId);
          if (!test) return null;
          const itemTotal = qty * test.price;
          subtotal += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    });

    // Apply zero invoice logic only to amounts
    const finalSubtotal = isZeroInvoice ? 0 : subtotal;
    let discountAmount = 0;
    let grandTotal = finalSubtotal;

    // Discount only applies in normal mode
    if (!isZeroInvoice && applyDiscount && discountPercent) {
      const percent = parseFloat(discountPercent);
      if (!isNaN(percent) && percent >= 0 && percent <= 100) {
        discountAmount = (finalSubtotal * percent) / 100;
        grandTotal = finalSubtotal - discountAmount;
      }
    }

    return {
      subtotal: finalSubtotal,
      discountAmount,
      grandTotal,
      groupedItems,           // ← always contains selected tests
    };
  };

  const { subtotal, discountAmount, grandTotal, groupedItems } = calculateTotals();

  const handleGenerateInvoice = async () => {
    // In zero mode we allow generation even if no tests are selected
    // (but usually user will select some tests for record)
    if (!isZeroInvoice && grandTotal === 0 && Object.keys(groupedItems).length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMode) {
      toast({
        title: "Error",
        description: "Please select a payment mode",
        variant: "destructive",
      });
      return;
    }

    if (!isZeroInvoice && paymentMode !== "pending" && paymentMode !== "cash" && !transactionRef.trim()) {
      toast({
        title: "Error",
        description: "Please enter transaction/reference number",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(
      today.getMonth() + 1
    ).toString().padStart(2, "0")}-${today.getFullYear()}`;

    const invoiceId = generateInvoiceId();

    const perSampleSelectedTests: Record<string, Record<number, string[]>> = {};

    sampleSummary.forEach((s) => {
      const type = s.type.toLowerCase();
      if (type === "pl" || type === "pcr") return;

      if (perSampleTests[type]?.length) {
        perSampleSelectedTests[type] = {};
        perSampleTests[type].forEach((selectedSet, sampleIndex) => {
          if (selectedSet.size > 0) {
            perSampleSelectedTests[type][sampleIndex + 1] = Array.from(selectedSet);
          }
        });
      }
    });

    const sampleType = sampleSummary.map((s) => ({
      type: s.type.toLowerCase(),
      count: s.type === "pl" ? actualPlCount : s.type === "pcr" ? actualPcrCount : s.count,
    }));

    const reportsProgress: { [key: string]: string } = {};
    if (actualPlCount > 0) reportsProgress["pl"] = "pending";
    if (actualPcrCount > 0) reportsProgress["pcr"] = "pending";
    sampleSummary.forEach((s) => {
      if (s.type !== "pl" && s.type !== "pcr") {
        const hasTests = perSampleTests[s.type]?.some((set) => set.size > 0);
        if (hasTests) {
          reportsProgress[s.type.toLowerCase()] = "pending";
        }
      }
    });

    let paidAmount = 0;
    let balanceAmount = grandTotal;
    let isPartialPayment = false;

    if (isZeroInvoice) {
      paidAmount = 0;
      balanceAmount = 0;
    } else if (paymentMode !== "pending") {
      paidAmount = grandTotal;
      balanceAmount = 0;
      isPartialPayment = false;
    } else {
      paidAmount = 0;
      balanceAmount = grandTotal;
      isPartialPayment = true;
    }

    const technicianId = passedTechnician?.technicianId || session.technicianId || "unknown";
    const technicianName = passedTechnician?.technicianName || session.technicianName || "Unknown Technician";

    const invoiceData = {
      invoiceId,
      farmerName,
      farmerId,
      farmerPhone: mobile,
      locationId,
      technicianName,
      technicianId,
      dateOfCulture,
      tests: groupedItems,                    // ← now always contains selected tests
      subtotal: isZeroInvoice ? 0 : subtotal,
      discountPercent: applyDiscount && discountPercent ? parseFloat(discountPercent) : 0,
      discountAmount: isZeroInvoice ? 0 : discountAmount,
      total: isZeroInvoice ? 0 : grandTotal,
      village,
      mobile,
      paymentMode: isZeroInvoice ? "pending" : paymentMode,
      transactionRef: paymentMode !== "cash" && paymentMode !== "pending" ? transactionRef.trim() : null,
      isPartialPayment,
      paidAmount,
      balanceAmount,
      sampleType,
      reportsProgress,
      samplePathogens,
      formattedDate,
      createdAt: serverTimestamp(),
      isZeroInvoice: isZeroInvoice,
      note: isZeroInvoice ? "Lab Equipment Testing - Zero Charge" : null,
      perSampleSelectedTests,
    };

    try {
      await addDoc(collection(db, "locations", locationId, "invoices"), invoiceData);

      navigate("/invoice-template", {
        state: {
          ...invoiceData,
          invoiceId,
          formattedDate,
          total: isZeroInvoice ? 0 : grandTotal,
        },
      });

      toast({
        title: "Success",
        description: isZeroInvoice
          ? "Zero invoice generated successfully for lab testing!"
          : "Invoice generated successfully!",
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Samples for {farmerName} ({dateOfCulture})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {sampleSummary
                      .filter((s) => s.type !== "pl" && s.type !== "pcr")
                      .map((s) => (
                        <div key={s.type}>
                          <h4 className="font-semibold mb-3 capitalize">
                            {s.type} Samples ({s.count})
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: s.count }).map((_, i) => (
                              <Button
                                key={i}
                                variant={activeSampleIndex[s.type] === i ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                  setActiveSampleIndex((prev) => ({ ...prev, [s.type]: i }))
                                }
                              >
                                Sample {i + 1}
                              </Button>
                            ))}
                          </div>
                          <div className="space-y-3">
                            {availableTests
                              .filter((t) => t.sampleType === s.type)
                              .map((test) => {
                                const currentIdx = activeSampleIndex[s.type] ?? 0;
                                const isChecked =
                                  perSampleTests[s.type]?.[currentIdx]?.has(test.id) || false;
                                const appliedToAll =
                                  perSampleTests[s.type]?.every((set) => set.has(test.id)) || false;

                                return (
                                  <div
                                    key={test.id}
                                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                                  >
                                    <div className="flex items-center gap-4 flex-1">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() =>
                                          toggleTest(s.type, currentIdx, test.id)
                                        }
                                      />
                                      <div>
                                        <p className="font-medium">{test.name}</p>
                                        <p className="text-sm text-muted-foreground">₹{test.price}</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={appliedToAll ? "default" : "outline"}
                                      onClick={() => applyToAll(s.type as any, test.id)}
                                      disabled={appliedToAll}
                                    >
                                      {appliedToAll ? "Applied to All" : "Apply to All"}
                                    </Button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}

                    {plPcrSampleCount > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          PL / PCR Samples ({plPcrSampleCount})
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Array.from({ length: plPcrSampleCount }).map((_, i) => (
                            <Button
                              key={i}
                              variant={activeSampleIndex["pl_pcr"] === i ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                setActiveSampleIndex((prev) => ({ ...prev, pl_pcr: i }))
                              }
                            >
                              Sample {i + 1}
                            </Button>
                          ))}
                        </div>
                        <div className="space-y-3">
                          {availableTests
                            .filter((t) => t.sampleType === "pl" || t.sampleType === "pcr")
                            .map((test) => {
                              const currentIdx = activeSampleIndex["pl_pcr"] ?? 0;
                              const sampleType = test.sampleType as "pl" | "pcr";
                              const isChecked =
                                perSampleTests[sampleType][currentIdx]?.has(test.id) || false;
                              const appliedToAll = isAppliedToAll(sampleType, test.id);

                              return (
                                <div
                                  key={test.id}
                                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        toggleTest(sampleType, currentIdx, test.id)
                                      }
                                    />
                                    <div>
                                      <p className="font-medium">
                                        {test.name}{" "}
                                        <span className="text-xs font-normal text-muted-foreground">
                                          ({test.sampleType.toUpperCase()})
                                        </span>
                                      </p>
                                      <p className="text-sm text-muted-foreground">₹{test.price}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={appliedToAll ? "default" : "outline"}
                                    onClick={() => applyToAll(sampleType, test.id)}
                                    disabled={appliedToAll}
                                  >
                                    {appliedToAll ? "Applied to All" : "Apply to All"}
                                  </Button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isZeroInvoice ? (
                      <div className="text-center py-8">
                        <p className="font-medium text-lg text-muted-foreground">
                          Zero Invoice Mode (Lab Equipment Testing)
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          All charges set to ₹0
                        </p>
                      </div>
                    ) : Object.keys(groupedItems).length > 0 ? (
                      <>
                        {Object.entries(groupedItems).map(([type, items]) => (
                          <div key={type} className="mb-4">
                            <h5 className="font-semibold capitalize mb-2">
                              {type === "pl" ? "PL" : type === "pcr" ? "PCR" : type} Tests
                            </h5>
                            {items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.name} × {item.quantity}</span>
                                <span>₹{item.total}</span>
                              </div>
                            ))}
                            <Separator className="my-3" />
                          </div>
                        ))}
                        <div className="space-y-2">
                          <div className="flex justify-between text-base">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="apply-discount"
                              checked={applyDiscount}
                              onCheckedChange={(checked) => {
                                setApplyDiscount(!!checked);
                                if (!checked) setDiscountPercent("");
                              }}
                            />
                            <Label htmlFor="apply-discount" className="text-sm font-medium leading-none cursor-pointer">
                              Apply Discount
                            </Label>
                          </div>

                          {applyDiscount && (
                            <div className="flex items-center gap-3 pl-6">
                              <Input
                                type="number"
                                placeholder="Discount %"
                                value={discountPercent}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || (/^\d+$/.test(val) && parseInt(val) <= 100)) {
                                    setDiscountPercent(val);
                                  }
                                }}
                                className="w-28 h-9"
                                min={0}
                                max={100}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          )}

                          {discountAmount > 0 && (
                            <div className="flex justify-between text-base text-green-700">
                              <span>Discount ({discountPercent}%)</span>
                              <span>-₹{discountAmount.toFixed(2)}</span>
                            </div>
                          )}

                          <Separator className="my-3" />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Final Total Amount</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Select tests to generate invoice
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="zero-invoice"
                        checked={isZeroInvoice}
                        onCheckedChange={(checked) => {
                          setIsZeroInvoice(!!checked);
                          if (checked) {
                            setPaymentMode("pending");
                            setTransactionRef("");
                            setApplyDiscount(false);
                            setDiscountPercent("");
                          }
                        }}
                      />
                      <Label htmlFor="zero-invoice" className="text-sm font-medium leading-none cursor-pointer">
                        Zero Invoice (Lab Equipment Testing)
                      </Label>
                    </div>

                    {!isZeroInvoice && (
                      <>
                        <div>
                          <Label>Payment Mode</Label>
                          <Select
                            value={paymentMode}
                            onValueChange={(value: "cash" | "qr" | "neft" | "rtgs" | "pending" | "") => {
                              setPaymentMode(value);
                              if (value === "cash" || value === "pending") {
                                setTransactionRef("");
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="qr">QR Code / UPI</SelectItem>
                              <SelectItem value="neft">NEFT / Bank Transfer</SelectItem>
                              <SelectItem value="rtgs">RTGS / Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {(paymentMode === "qr" || paymentMode === "neft" || paymentMode === "rtgs") && (
                          <div>
                            <Label htmlFor="transactionRef">Transaction ID / Reference No.</Label>
                            <Input
                              id="transactionRef"
                              type="text"
                              value={transactionRef}
                              onChange={(e) => setTransactionRef(e.target.value)}
                              placeholder="Enter transaction reference"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <Button
                      onClick={handleGenerateInvoice}
                      className="w-full"
                      size="lg"
                      disabled={
                        (!isZeroInvoice && grandTotal === 0 && Object.keys(groupedItems).length === 0) ||
                        !paymentMode ||
                        (!isZeroInvoice && ["qr", "neft", "rtgs"].includes(paymentMode) && !transactionRef.trim())
                      }
                    >
                      Generate Invoice & Proceed
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicePage;