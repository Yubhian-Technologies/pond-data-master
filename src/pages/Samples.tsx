import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Farmer, Sample, SampleType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Session } from "inspector/promises";
import { useUserSession } from "../contexts/UserSessionContext";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Check } from "lucide-react";



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
  const { session, setSession } = useUserSession();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [samples, setSamples] = useLocalStorage<Sample[]>("samples", []);
  const [sampleType, setSampleType] = useState<SampleType[]>([]);
  const sampleTypeOptions: SampleType[] = ["water", "soil", "pl", "adult"];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [dateOfCulture, setDateOfCulture] = useState("");
 const [sampleEntriesByType, setSampleEntriesByType] = useState<Record<string, { id: string; quantity: number }[]>>({});
  const [openPopover, setOpenPopover] = useState(false);
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
}, []);
useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const locationId = session.locationId;

      if (!locationId) return;
        const snap = await getDocs(collection(db, "locations", locationId, "invoices"));
        const data: Sample[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Sample[];
        setSamples(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);

  

  // const generateSampleId = () => {
  //   const count = samples.length + 1;
  //   return `SMP${String(count).padStart(4, "0")}`;
  // };

//   const handleAddSampleEntry = (type: SampleType) => {
//   const entries = sampleEntriesByType[type] || [];
//   if (entries.length >= 10) return;

//   setSampleEntriesByType({
//     ...sampleEntriesByType,
//     [type]: [...entries, { id: crypto.randomUUID(), quantity: 1 }],
//   });
// };

// Remove entry for a specific type
// const handleRemoveSampleEntry = (type: SampleType, entryId: string) => {
//   const entries = sampleEntriesByType[type] || [];
//   const newEntries = entries.filter((e) => e.id !== entryId);
//   setSampleEntriesByType({
//     ...sampleEntriesByType,
//     [type]: newEntries.length > 0 ? newEntries : [{ id: crypto.randomUUID(), quantity: 1 }],
//   });
// };

  // const handleSubmit = () => {
  // if (!selectedFarmer) return;

  // const newSamples: Sample[] = [];

  // // Loop through each selected sample type and its entries
  // sampleType.forEach((type) => {
  //   (sampleEntriesByType[type] || []).forEach((entry) => {
  //     newSamples.push({
  //       id: generateSampleId(),
  //       farmerId: selectedFarmer.id,
  //       farmerName: selectedFarmer.name,
  //       sampleType: [type], // Single type per entry
  //       dateOfCulture,
  //       quantity: entry.quantity,
  //       createdAt: new Date(),
  //       technicianId: session.technicianName || "TECH001",
  //       locationId: session.locationId || "LOC001",
  //     });
  //   });
  // });

  //   setSamples([...samples, ...newSamples]);
    
  //   toast({
  //     title: "Samples Submitted",
  //     description: `${newSamples.length} sample(s) added successfully`,
  //   });

  //   // Navigate to invoice with sample IDs
  //   const sampleIds = newSamples.map(s => s.id).join(",");
  //   navigate(`/invoice?samples=${sampleIds}`);
  // };

  const resetForm = () => {
  setStep(1);
  setSelectedFarmer(null);
  setSampleType(["water"]);
  setDateOfCulture("");
  setSampleEntriesByType({ water: [{ id: crypto.randomUUID(), quantity: 1 }] }); // initialize per type
  setOpen(false);
};


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
        {samples.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No samples submitted yet
            </TableCell>
          </TableRow>
        ) : (
          samples.map((sample) => (
            <TableRow key={sample.id}>

              {/* Invoice ID */}
              <TableCell className="font-medium">
                {sample.invoiceId ?? sample.id}
              </TableCell>

              {/* Farmer Name */}
              <TableCell>{sample.farmerName}</TableCell>

              {/* Phone Number */}
              <TableCell>{sample.farmerPhone ?? "N/A"}</TableCell>

              {/* Submitted By */}
              <TableCell>{sample.technicianName}</TableCell>

              {/* Bill Amount */}
              <TableCell>₹{sample.total ?? 0}</TableCell>

              {/* Pending Amount */}
              <TableCell
                className={
                  (sample.pendingAmount ?? 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                ₹{sample.pendingAmount ?? 0}
              </TableCell>

              {/* Actions */}
              {sample.reportSubmission ? (
                <Button
                  variant="outline"
                  size="sm"
                >
                  View Report
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/lab-results/${sample.id}`)}
                >
                  Generate Report
                </Button>
              )}
              <TableCell className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/invoice/${sample.invoiceId ?? sample.id}/${session.locationId}`)

                  }
                >
                  View Invoice
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit-sample/${sample.id}`)}
                >
                  Edit
                </Button>
              </TableCell>
              

            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>


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
                  <Popover open={openPopover} onOpenChange={setOpenPopover}>
  <PopoverTrigger asChild>
    <div>
      <Label>Select Farmer</Label>
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between mt-1"
        onClick={() => setOpenPopover(true)}
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
                setOpenPopover(false); 
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
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between mt-1"
              onClick={() => setOpenPopover(true)}
            >
              {sampleType.length > 0
                ? sampleType.join(", ")
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
                        let newTypes: SampleType[] = [];
                        if (sampleType.includes(type)) {
                          newTypes = sampleType.filter((t) => t !== type);
                          // Remove entries of deselected type
                          const { [type]: _, ...rest } = sampleEntriesByType;
                          setSampleEntriesByType(rest);
                        } else {
                          newTypes = [...sampleType, type];
                          // Initialize entries if adding new type
                          setSampleEntriesByType({
                            ...sampleEntriesByType,
                            [type]: [{ id: crypto.randomUUID(), quantity: 1 }],
                          });
                        }
                        setSampleType(newTypes);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="capitalize">{type}</span>
                        {sampleType.includes(type) && <Check className="w-4 h-4" />}
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

    {/* Dynamic Sample Entries for each selected sample type */}
    {sampleType.map((type) => (
      <div key={type} className="space-y-4 border p-4 rounded-md">
        <div className="flex items-center justify-between">
          <Label>{type.charAt(0).toUpperCase() + type.slice(1)} Sample Entries (Max 10)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const entries = sampleEntriesByType[type] || [];
              if (entries.length < 10) {
                setSampleEntriesByType({
                  ...sampleEntriesByType,
                  [type]: [...entries, { id: crypto.randomUUID(), quantity: 1 }],
                });
              }
            }}
            disabled={(sampleEntriesByType[type]?.length || 0) >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sample
          </Button>
        </div>

        {(sampleEntriesByType[type] || []).map((entry, index) => (
          <div key={entry.id} className="flex items-center gap-4">
            <span className="text-sm font-medium w-20">Sample {index + 1}</span>
            <Input
              type="number"
              min="1"
              value={entry.quantity}
              onChange={(e) => {
                const newEntries = [...(sampleEntriesByType[type] || [])];
                newEntries[index].quantity = parseInt(e.target.value) || 1;
                setSampleEntriesByType({
                  ...sampleEntriesByType,
                  [type]: newEntries,
                });
              }}
              className="flex-1"
              placeholder="Quantity"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newEntries = (sampleEntriesByType[type] || []).filter((e) => e.id !== entry.id);
                setSampleEntriesByType({
                  ...sampleEntriesByType,
                  [type]: newEntries.length ? newEntries : [{ id: crypto.randomUUID(), quantity: 1 }],
                });
              }}
              disabled={(sampleEntriesByType[type]?.length || 0) === 1}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    ))}

    <DialogFooter>
      <Button onClick={() => setStep(1)} variant="outline">Back</Button>
      <Button
  onClick={() => {
    if (!selectedFarmer) return;

    // Prepare sample summary for invoice
    const sampleSummary = sampleType.map((type) => ({
      type,
      count: (sampleEntriesByType[type] || []).length,
    }));

    // Navigate to invoice page, passing summary in state
    navigate("/invoice", { state: { sampleSummary, dateOfCulture, farmer: selectedFarmer } });
  }}
  disabled={!dateOfCulture}
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
