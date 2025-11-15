import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Farmer, Sample, SampleType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Samples = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [farmers] = useLocalStorage<Farmer[]>("farmers", []);
  const [samples, setSamples] = useLocalStorage<Sample[]>("samples", []);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [sampleType, setSampleType] = useState<SampleType>("water");
  const [dateOfCulture, setDateOfCulture] = useState("");
  const [sampleEntries, setSampleEntries] = useState<{ id: string; quantity: number }[]>([
    { id: crypto.randomUUID(), quantity: 1 }
  ]);

  const generateSampleId = () => {
    const count = samples.length + 1;
    return `SMP${String(count).padStart(4, "0")}`;
  };

  const handleAddSampleEntry = () => {
    if (sampleEntries.length < 10) {
      setSampleEntries([...sampleEntries, { id: crypto.randomUUID(), quantity: 1 }]);
    }
  };

  const handleRemoveSampleEntry = (id: string) => {
    if (sampleEntries.length > 1) {
      setSampleEntries(sampleEntries.filter(entry => entry.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!selectedFarmer) return;

    const newSamples: Sample[] = sampleEntries.map(entry => ({
      id: generateSampleId(),
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      sampleType,
      dateOfCulture,
      quantity: entry.quantity,
      createdAt: new Date(),
      technicianId: localStorage.getItem("technicianId") || "TECH001",
      locationId: localStorage.getItem("locationId") || "LOC001"
    }));

    setSamples([...samples, ...newSamples]);
    
    toast({
      title: "Samples Submitted",
      description: `${newSamples.length} sample(s) added successfully`,
    });

    // Navigate to invoice with sample IDs
    const sampleIds = newSamples.map(s => s.id).join(",");
    navigate(`/invoice?samples=${sampleIds}`);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedFarmer(null);
    setSampleType("water");
    setDateOfCulture("");
    setSampleEntries([{ id: crypto.randomUUID(), quantity: 1 }]);
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
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Farmer Name</TableHead>
                  <TableHead>Sample Type</TableHead>
                  <TableHead>Date of Culture</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No samples submitted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  samples.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell className="font-medium">{sample.id}</TableCell>
                      <TableCell>{sample.farmerName}</TableCell>
                      <TableCell className="capitalize">{sample.sampleType}</TableCell>
                      <TableCell>{sample.dateOfCulture}</TableCell>
                      <TableCell>{sample.quantity}</TableCell>
                      <TableCell>{new Date(sample.createdAt).toLocaleDateString()}</TableCell>
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
                  <Label>Select Farmer</Label>
                  <Select onValueChange={(value) => {
                    const farmer = farmers.find(f => f.id === value);
                    setSelectedFarmer(farmer || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Select value={sampleType} onValueChange={(value) => setSampleType(value as SampleType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="soil">Soil</SelectItem>
                        <SelectItem value="pl">Post Larva (PL)</SelectItem>
                        <SelectItem value="adult">Adult</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sample Entries (Max 10)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSampleEntry}
                      disabled={sampleEntries.length >= 10}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sample
                    </Button>
                  </div>

                  {sampleEntries.map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-20">Sample {index + 1}</span>
                      <Input
                        type="number"
                        min="1"
                        value={entry.quantity}
                        onChange={(e) => {
                          const newEntries = [...sampleEntries];
                          newEntries[index].quantity = parseInt(e.target.value) || 1;
                          setSampleEntries(newEntries);
                        }}
                        className="flex-1"
                        placeholder="Quantity"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSampleEntry(entry.id)}
                        disabled={sampleEntries.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button onClick={() => setStep(1)} variant="outline">Back</Button>
                  <Button onClick={handleSubmit} disabled={!dateOfCulture}>
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
