import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check } from "lucide-react";
import { Farmer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserSession } from "../contexts/UserSessionContext";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

const Samples = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useUserSession();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  type SampleGroup = "water" | "soil" | "pl_pcr" | "microbiology";

  const sampleTypeOptions: SampleGroup[] = ["water", "soil", "pl_pcr", "microbiology"];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [dateOfCulture, setDateOfCulture] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<SampleGroup[]>([]);
  const [quantities, setQuantities] = useState<Record<SampleGroup, number>>(() => ({} as Record<SampleGroup, number>));

  const [openFarmerPopover, setOpenFarmerPopover] = useState(false);
  const [openTypePopover, setOpenTypePopover] = useState(false);

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
      try {
        const locationId = session.locationId;
        if (!locationId) return;
        const snap = await getDocs(collection(db, "locations", locationId, "invoices"));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, [session.locationId]);

  const resetForm = () => {
    setStep(1);
    setSelectedFarmer(null);
    setDateOfCulture("");
    setSelectedTypes([]);
    setQuantities({} as Record<SampleGroup, number>);
    setOpen(false);
  };

  // FIXED & ROBUST: Correctly detect if all reports are completed
const isReportFullyCompleted = (sample: any) => {
  if (!sample.reportsProgress) return false;
  if (!sample.sampleType || !Array.isArray(sample.sampleType)) return false;

  // Extract active types: only those with count > 0
  const activeTypes = sample.sampleType
    .map((s: any) => {
      if (typeof s === "string") {
        return s.toLowerCase().trim();
      }
      if (s && typeof s === "object" && s.type) {
        return s.type.toString().toLowerCase().trim();
      }
      return null;
    })
    .filter((type: string | null): type is string => {
      return type !== null && type !== "" && type !== "pl_pcr";
    })
    // Critical: only include types where count > 0 (matches new actual count logic)
    .filter((type: string, index: number) => {
      const originalEntry = sample.sampleType[index];
      let count = 0;

      if (typeof originalEntry === "object" && originalEntry.count !== undefined) {
        count = Number(originalEntry.count);
      } else {
        // Fallback for old format
        const match = sample.sampleType.find((t: any) => 
          (typeof t === "object" ? t.type?.toLowerCase() : t?.toLowerCase()) === type
        );
        count = typeof match === "object" ? Number(match?.count || 0) : 0;
      }

      return count > 0;
    });

  // No active samples → report is complete
  if (activeTypes.length === 0) return true;

  // Every active type must be marked completed
  return activeTypes.every((type: string) => 
    sample.reportsProgress[type] === "completed"
  );
};
  // Sort invoices newest first
  const sortedInvoices = [...invoices].sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;
    return timeB - timeA;
  });

  return (
    <DashboardLayout>
      <div className="p-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Samples</CardTitle>
            <CardDescription>View all submitted samples</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Bill Amount</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No samples submitted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedInvoices.map((sample) => {
                    const fullyCompleted = isReportFullyCompleted(sample);
                    const invoiceId = sample.invoiceId ?? sample.id;

                    return (
                      <TableRow key={sample.id}>
                        <TableCell className="font-medium">{invoiceId}</TableCell>
                        <TableCell>{sample.farmerName}</TableCell>
                        <TableCell>{sample.farmerPhone ?? "N/A"}</TableCell>
                        <TableCell>{sample.technicianName}</TableCell>
                        <TableCell>₹{sample.total ?? 0}</TableCell>
                        <TableCell
                          className={
                            (sample.pendingAmount ?? 0) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          ₹{sample.pendingAmount ?? 0}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
                            {/* Generate / View Report Button */}
                            <Button
                              className="bg-transparent text-black border hover:bg-cyan-700 hover:text-white"
                              size="sm"
                              onClick={() =>
                                navigate(`/lab-results/${sample.id}${fullyCompleted ? "?mode=view" : ""}`)
                              }
                            >
                              {fullyCompleted ? "View Report" : "Generate Report"}
                            </Button>

                            {/* View Invoice Button */}
                            <Button
                              className="bg-transparent text-black border hover:bg-green-600 hover:text-white"
                              size="sm"
                              onClick={() => navigate(`/invoice/${invoiceId}/${session.locationId}`)}
                            >
                              View Invoice
                            </Button>

                            {/* Edit Button - Only enabled after full report */}
                            <Button
                              className="bg-transparent text-black border hover:bg-red-600 hover:text-white"
                              size="sm"
                              disabled={!fullyCompleted}
                              onClick={() => navigate(`/lab-results/${sample.id}?mode=edit`)}
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

        {/* New Submission Dialog - unchanged */}
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? "Select Farmer" : "Sample Details"}
              </DialogTitle>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Popover open={openFarmerPopover} onOpenChange={setOpenFarmerPopover}>
                    <PopoverTrigger asChild>
                      <div>
                        <Label>Select Farmer</Label>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between mt-1"
                          onClick={() => setOpenFarmerPopover(true)}
                        >
                          {selectedFarmer
                            ? `${selectedFarmer.name} - ${selectedFarmer.id}`
                            : "Choose a farmer"}
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search by name or phone..." />
                        <CommandList>
                          <CommandEmpty>No farmer found.</CommandEmpty>
                          <CommandGroup>
                            {farmers.map((farmer) => (
                              <CommandItem
                                key={farmer.id}
                                value={`${farmer.name} ${farmer.phone}`.toLowerCase()}
                                onSelect={() => {
                                  setSelectedFarmer(farmer);
                                  setOpenFarmerPopover(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{farmer.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {farmer.phone}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedFarmer && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="ml-2">{selectedFarmer.phone}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Species:</span>
                          <span className="ml-2">{selectedFarmer.species}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <span className="ml-2">{selectedFarmer.city}, {selectedFarmer.state}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Culture Areas:</span>
                          <span className="ml-2">{selectedFarmer.cultureAreas}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <DialogFooter>
                  <Button onClick={resetForm} variant="outline">Cancel</Button>
                  <Button onClick={() => setStep(2)} disabled={!selectedFarmer}>
                    Next
                  </Button>
                </DialogFooter>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sample Type</Label>
                    <Popover open={openTypePopover} onOpenChange={setOpenTypePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between mt-1"
                          onClick={() => setOpenTypePopover(true)}
                        >
                          {selectedTypes.length > 0
                            ? selectedTypes
                                .map(t => t === "pl_pcr" ? "PL/PCR" : t.charAt(0).toUpperCase() + t.slice(1))
                                .join(", ")
                            : "Select sample types"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search sample types..." />
                          <CommandList>
                            <CommandEmpty>No options found.</CommandEmpty>
                            <CommandGroup>
                              {sampleTypeOptions.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
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
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{type === "pl_pcr" ? "PL / PCR" : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                    {selectedTypes.includes(type) && <Check className="w-4 h-4" />}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Date of Culture</Label>
                    <Input
                      type="date"
                      value={dateOfCulture}
                      onChange={(e) => setDateOfCulture(e.target.value)}
                    />
                  </div>
                </div>

                {selectedTypes.map((type) => (
                  <div key={type} className="space-y-2 border p-4 rounded-md">
                    <Label>
                      {type === "pl_pcr" ? "PL / PCR Samples" : `${type.charAt(0).toUpperCase() + type.slice(1)} Samples`} (Max 10)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={quantities[type] ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                        setQuantities(prev => ({ ...prev, [type]: val }));
                      }}
                      placeholder="Number of samples"
                    />
                  </div>
                ))}

                <DialogFooter>
                  <Button onClick={() => setStep(1)} variant="outline">Back</Button>
                  <Button
                    onClick={() => {
                      if (!selectedFarmer || !dateOfCulture || selectedTypes.length === 0) return;

                      const sampleSummary = selectedTypes.flatMap((type) => {
                        const count = quantities[type] ?? 1;
                        if (type === "pl_pcr") {
                          return [{ type: "pl", count }, { type: "pcr", count }];
                        }
                        return [{ type, count }];
                      });

                      navigate("/invoice", {
                        state: { sampleSummary, dateOfCulture, farmer: selectedFarmer },
                      });
                    }}
                    disabled={!dateOfCulture || selectedTypes.length === 0}
                  >
                    Submit & Generate Invoice
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Samples;