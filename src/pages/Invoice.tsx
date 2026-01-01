import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { availableTests } from "@/data/tests";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  farmer: { name: string; address: string; phone: string; id: string };
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
  const [paymentMode, setPaymentMode] = useState<"" | "cash" | "qr" | "neft">("");

  const locationId = session.locationId;
  const technicianId = session.technicianId;
  const technicianName = session.technicianName;

  const sampleSummary = state?.sampleSummary || [];
  const dateOfCulture = state?.dateOfCulture || "";
  const farmerName = state?.farmer?.name || "Unknown";
  const farmerId = state?.farmer?.id || "Unknown";
  const village = state?.farmer?.address || "Unknown";
  const mobile = state?.farmer?.phone || "Unknown";

  // Fixed number of PL/PCR tabs (based on input PCR count)
  const pcrCount = sampleSummary.find((s) => s.type === "pcr")?.count || 0;
  const plPcrSampleCount = pcrCount;

  // Active sample index for each group
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

  // Store selected tests per sample
  const [perSampleTests, setPerSampleTests] = useState<{
    pl: Set<string>[];
    pcr: Set<string>[];
    [other: string]: Set<string>[];
  }>(() => {
    const init: any = { pl: [], pcr: [] };

    // Initialize for all PL/PCR samples (tabs)
    for (let i = 0; i < plPcrSampleCount; i++) {
      init.pl.push(new Set<string>());
      init.pcr.push(new Set<string>());
    }

    // Other sample types
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

  // === Dynamically calculate actual PL count (samples with at least one PL test) ===
  const actualPlCount = useMemo(() => {
    const samplesWithPlTests = new Set<number>();
    perSampleTests.pl.forEach((set, index) => {
      if (set.size > 0) {
        samplesWithPlTests.add(index);
      }
    });
    return samplesWithPlTests.size;
  }, [perSampleTests.pl]);

  // === Dynamically calculate actual PCR count (samples with at least one PCR test) ===
  const actualPcrCount = useMemo(() => {
    const samplesWithPcrTests = new Set<number>();
    perSampleTests.pcr.forEach((set, index) => {
      if (set.size > 0) {
        samplesWithPcrTests.add(index);
      }
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
        result[index + 1] = Array.from(pathogens); // sample numbers start from 1
      }
    });

    return result;
  }, [perSampleTests.pcr]);

  const generateInvoiceId = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const toggleTest = (sampleType: "pl" | "pcr" | string, sampleIndex: number, testId: string) => {
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

  // Calculate totals
  const calculateTotal = () => {
    const groupedItems: {
      [type: string]: { name: string; quantity: number; total: number; price: number }[];
    } = {};
    let total = 0;

    // === PCR Tests: only on samples that have at least one PCR test selected ===
    if (actualPcrCount > 0) {
      const pcrTestCount: { [testId: string]: number } = {};

      perSampleTests.pcr.forEach((set, index) => {
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
          total += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    }

    // === PL Tests: only on samples where at least one PL test is selected ===
    if (actualPlCount > 0) {
      const plTestCount: { [testId: string]: number } = {};

      perSampleTests.pl.forEach((set, index) => {
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
          total += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    }

    // === Other sample types ===
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
          total += itemTotal;
          return { name: test.name, quantity: qty, price: test.price, total: itemTotal };
        })
        .filter(Boolean) as any;
    });

    return { total, groupedItems };
  };

  const { total, groupedItems } = calculateTotal();

  const handleGenerateInvoice = async () => {
    if (total === 0) {
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

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${today.getFullYear()}`;

    const invoiceId = generateInvoiceId();

    // Save actual used sample counts
    const sampleType = sampleSummary.map((s) => ({
      type: s.type.toLowerCase(),
      count:
        s.type === "pl" ? actualPlCount :
        s.type === "pcr" ? actualPcrCount :
        s.count,
    }));

    const reportsProgress: { [key: string]: string } = {};

    // PL
    if (actualPlCount > 0) {
      reportsProgress["pl"] = "pending";
    }

    // PCR
    if (actualPcrCount > 0) {
      reportsProgress["pcr"] = "pending";
    }

    // OTHER TYPES
    sampleSummary.forEach((s) => {
      if (s.type !== "pl" && s.type !== "pcr") {
        const hasTests = perSampleTests[s.type]?.some((set) => set.size > 0);
        if (hasTests) {
          reportsProgress[s.type.toLowerCase()] = "pending";
        }
      }
    });

    const invoiceData = {
      id: invoiceId,
      invoiceId,
      farmerName,
      farmerId,
      farmerPhone: mobile,
      locationId,
      technicianName,
      technicianId,
      dateOfCulture,
      tests: groupedItems,
      total,
      village,
      mobile,
      paymentMode,
      sampleType,
      reportsProgress,
      samplePathogens,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "locations", locationId, "invoices"), invoiceData);

      navigate("/invoice-template", {
        state: { ...invoiceData, formattedDate },
      });

      toast({ title: "Success", description: "Invoice generated successfully!" });
    } catch (error) {
      console.error("Error adding invoice: ", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
  <div className="flex-1 overflow-y-auto md:p-8">
    <div className="max-w-7xl mx-auto">
      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Samples for {farmerName} ({dateOfCulture})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Non PL/PCR samples */}
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
                          onClick={() => setActiveSampleIndex((prev) => ({ ...prev, [s.type]: i }))}
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
                          const isChecked = perSampleTests[s.type]?.[currentIdx]?.has(test.id) || false;
                          const appliedToAll = perSampleTests[s.type]?.every((set) => set.has(test.id)) || false;

                          return (
                            <div
                              key={test.id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleTest(s.type, currentIdx, test.id)}
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

              {/* PL/PCR Group */}
              {plPcrSampleCount > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">PL / PCR Samples ({plPcrSampleCount})</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from({ length: plPcrSampleCount }).map((_, i) => (
                      <Button
                        key={i}
                        variant={activeSampleIndex["pl_pcr"] === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveSampleIndex((prev) => ({ ...prev, pl_pcr: i }))}
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
                        const isChecked = perSampleTests[sampleType][currentIdx]?.has(test.id) || false;
                        const appliedToAll = isAppliedToAll(sampleType, test.id);

                        return (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleTest(sampleType, currentIdx, test.id)}
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

        {/* Invoice Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(groupedItems).length > 0 ? (
                <>
                  {Object.entries(groupedItems).map(([type, items]) => (
                    <div key={type} className="mb-4">
                      <h5 className="font-semibold capitalize mb-2">
                        {type === "pl" ? "PL" : type === "pcr" ? "PCR" : type} Tests
                      </h5>
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                      <Separator className="my-3" />
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total Amount</span>
                    <span>₹{total}</span>
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
              <div>
                <Label>Payment Mode</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value: "cash" | "qr" | "neft" | "") => setPaymentMode(value)}
                >
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

              <Button
                onClick={handleGenerateInvoice}
                className="w-full"
                size="lg"
                disabled={total === 0 || !paymentMode}
              >
                Generate Invoice & Proceed
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div></div></div>
    </DashboardLayout>
  );
};

export default InvoicePage;