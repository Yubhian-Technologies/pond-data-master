import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, User, Edit } from "lucide-react";
import { toast } from "sonner";

import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { useUserSession } from "../contexts/UserSessionContext";

interface Farmer {
  id: string;
  farmerId: string;
  name: string;
  phone: string;
  address: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  waterSource: string;
  cultureAreas: number;
  species: string;
  createdBy: {
    technicianId: string;
    technicianName: string;
  };
}


const LOCATION_NAME_TO_CODE: Record<string, string> = {
  nellore: "NLR",
  bhimavaram: "BVRM",
  tamarakollu: "TMRK",
  ganapavaram: "GVRM",
  juvvalapalem: "JP",
 
};

const Farmers = () => {
  const { session } = useUserSession();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFarmerId, setEditFarmerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [locationCode, setLocationCode] = useState<string>("");
  const [nextFarmerId, setNextFarmerId] = useState<string>("Loading...");

  // Fetch location name and determine code from name
  useEffect(() => {
    const fetchLocationAndSetCode = async () => {
      if (!session.locationId) {
        toast.error("No lab location selected.");
        setLocationCode("XXX");
        setNextFarmerId("No location");
        return;
      }

      try {
        const locDoc = await getDoc(doc(db, "locations", session.locationId));
        if (locDoc.exists()) {
          const data = locDoc.data();
          const locationName = data?.name?.toLowerCase().trim() || "";

          let matchedCode = "XXX"; // fallback

          // Smart matching based on name
          if (locationName.includes("nellore")) matchedCode = "NLR";
          else if (locationName.includes("bhimavaram")) matchedCode = "BVRM";
          else if (locationName.includes("tamarakollu")) matchedCode = "TMRK";
          else if (locationName.includes("ganapavaram")) matchedCode = "GVRM";
          else if (locationName.includes("juvvalapalem")) matchedCode = "JP";

          setLocationCode(matchedCode);
          console.log("Detected location code:", matchedCode, "from name:", data?.name);
        } else {
          toast.error("Location not found.");
          setLocationCode("XXX");
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        toast.error("Failed to load location.");
        setLocationCode("XXX");
      }
    };

    fetchLocationAndSetCode();
  }, [session.locationId]);

  // Fetch farmers and generate next Farmer ID
  const fetchFarmers = async () => {
    if (!session.locationId || !locationCode || locationCode === "XXX") return;

    try {
      const farmersRef = collection(db, "locations", session.locationId, "farmers");
      const q = query(farmersRef, orderBy("farmerId", "asc"));
      const snap = await getDocs(q);

      const list: Farmer[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Farmer[];

      setFarmers(list);

      // Calculate next number
      const numbers = list
        .map((f) => {
          const match = f.farmerId.match(/_FR_(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);

      const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNum = maxNum + 1;

      setNextFarmerId(`ADC_${locationCode}_FR_${String(nextNum).padStart(3, "0")}`);
    } catch (err) {
      console.error("Error fetching farmers:", err);
      toast.error("Failed to load farmers");
    }
  };

  useEffect(() => {
    if (locationCode && locationCode !== "XXX") {
      fetchFarmers();
    }
  }, [session.locationId, locationCode]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
    waterSource: "",
    cultureAreas: "",
    species: "",
  });

  const handleEdit = (farmer: Farmer) => {
    setEditMode(true);
    setEditFarmerId(farmer.id);
    setFormData({
      name: farmer.name,
      phone: farmer.phone,
      address: farmer.address,
      state: farmer.state,
      district: farmer.district,
      city: farmer.city,
      pincode: farmer.pincode,
      waterSource: farmer.waterSource,
      cultureAreas: farmer.cultureAreas.toString(),
      species: farmer.species,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.technicianId || !session.locationId || locationCode === "XXX") {
      toast.error("Cannot register: Invalid location or code missing.");
      return;
    }

    try {
      if (editMode && editFarmerId) {
        const farmerRef = doc(db, "locations", session.locationId, "farmers", editFarmerId);
        await updateDoc(farmerRef, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          state: formData.state,
          district: formData.district,
          city: formData.city,
          pincode: formData.pincode,
          waterSource: formData.waterSource,
          cultureAreas: Number(formData.cultureAreas),
          species: formData.species,
          updatedAt: Timestamp.now(),
        });

        // Sync to invoices
        const invoicesRef = collection(db, "locations", session.locationId, "invoices");
        const invoiceQuery = query(invoicesRef, where("farmerId", "==", editFarmerId));
        const invoiceSnap = await getDocs(invoiceQuery);

        if (!invoiceSnap.empty) {
          const updates = invoiceSnap.docs.map((inv) =>
            updateDoc(inv.ref, {
              farmerName: formData.name,
              farmerPhone: formData.phone,
            })
          );
          await Promise.all(updates);
        }

        toast.success("Farmer updated & invoices synced!");
      } else {
        const newFarmerId = nextFarmerId;

        const newFarmer = {
          farmerId: newFarmerId,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          state: formData.state,
          district: formData.district,
          city: formData.city,
          pincode: formData.pincode,
          waterSource: formData.waterSource,
          cultureAreas: Number(formData.cultureAreas),
          species: formData.species,
          createdAt: Timestamp.now(),
          createdBy: {
            technicianId: session.technicianId,
            technicianName: session.technicianName || "Unknown",
          },
        };

        await addDoc(collection(db, "locations", session.locationId, "farmers"), newFarmer);

        toast.success(`Farmer registered! ID: ${newFarmerId}`);
      }

      // Reset
      setOpen(false);
      setEditMode(false);
      setEditFarmerId(null);
      setFormData({
        name: "", phone: "", address: "", state: "", district: "",
        city: "", pincode: "", waterSource: "", cultureAreas: "", species: "",
      });

      fetchFarmers();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed.");
    }
  };

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Farmer Management
                </h1>
                <p className="text-muted-foreground">
                  Register and manage farmer information
                </p>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Registration
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editMode ? "Edit Farmer" : "Register New Farmer"}
                    </DialogTitle>
                    <DialogDescription>
                      {editMode
                        ? "Update farmer details below."
                        : `A unique Farmer ID will be generated: ${nextFarmerId}`}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Address *</Label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>District *</Label>
                        <Input value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode *</Label>
                        <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Water Source *</Label>
                        <Input value={formData.waterSource} onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Culture Areas (acres) *</Label>
                        <Input type="number" value={formData.cultureAreas} onChange={(e) => setFormData({ ...formData, cultureAreas: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Species *</Label>
                        <Input value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })} required />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                      <Button variant="outline" type="button" onClick={() => {
                        setOpen(false);
                        setEditMode(false);
                        setEditFarmerId(null);
                        setFormData({ name: "", phone: "", address: "", state: "", district: "", city: "", pincode: "", waterSource: "", cultureAreas: "", species: "" });
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editMode ? "Update Farmer" : "Register Farmer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registered Farmers ({farmers.length})</CardTitle>
                    <CardDescription>View and edit farmer records</CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farmer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Species</TableHead>
                      <TableHead>Areas (acres)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFarmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No farmers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFarmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.farmerId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              {farmer.name}
                            </div>
                          </TableCell>
                          <TableCell>{farmer.phone}</TableCell>
                          <TableCell>{farmer.city}, {farmer.state}</TableCell>
                          <TableCell>{farmer.species}</TableCell>
                          <TableCell>{farmer.cultureAreas}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 border border-cyan-500 text-cyan-600 hover:bg-cyan-50"
                              onClick={() => handleEdit(farmer)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Farmers;