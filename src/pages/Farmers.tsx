import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
 import {query, orderBy } from "firebase/firestore";
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
import { Plus, Search, User } from "lucide-react";
import { toast } from "sonner";

import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import { useUserSession } from "../contexts/UserSessionContext";
import { doc, getDoc } from "firebase/firestore";

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

const Farmers = () => {
  const { session } = useUserSession();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [farmers, setFarmers] = useState<Farmer[]>([]);

  const [locationCode, setLocationCode] = useState<string | null>(null);

useEffect(() => {
  const fetchLocationCode = async () => {
    if (!session.locationId) return; // No location selected

    try {
      const ref = doc(db, "locations", session.locationId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setLocationCode(snap.data().code);  // <-- get code field
      } else {
        console.warn("Location doc does not exist");
      }
    } catch (err) {
      console.error("Error fetching location code:", err);
    }
  };

  fetchLocationCode();
}, [session.locationId]);

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

  // 🔢 Generate FarmerId like FAR001, FAR002...
  const generateFarmerId = (locationCode: string) => {
  const nextNumber = farmers.length + 1;

  return `WBDC_${locationCode}_FR_${String(nextNumber).padStart(3, "0")}`;
};

const fetchFarmers = async () => {
  if (!session.locationId) return;

  const ref = collection(db, "locations", session.locationId, "farmers");

  // 🔥 Order by farmerId ascending
  const q = query(ref, orderBy("farmerId", "asc"));

  const snap = await getDocs(q);

  const list: Farmer[] = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Farmer[];

  setFarmers(list);
};

useEffect(() => {
  fetchFarmers();
}, [session.locationId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.technicianId) {
      toast.error("Technician not selected!");
      return;
    }

    const newFarmer = {
      farmerId: generateFarmerId(locationCode),
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
        technicianId: session.technicianId!,
        technicianName: session.technicianName!,
      },
    };

    await addDoc(
      collection(db, "locations", session.locationId!, "farmers"),
      newFarmer
    );

    toast.success(`Farmer registered successfully! ID: ${newFarmer.farmerId}`);

    setOpen(false);
    setFormData({
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

    fetchFarmers();
  };

  const filteredFarmers = farmers.filter(
    (farmer) =>
      farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Farmer Management
            </h1>
            <p className="text-muted-foreground">
              Register and manage farmer information
            </p>
          </div>

          {/* ADD Farmer Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Registration
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Farmer</DialogTitle>
                <DialogDescription>
                  Enter farmer details. A unique ID will be generated automatically.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* ALL FORM FIELDS SAME AS YOUR FILE */}
                {/* No change to UI structure — only saving to Firestore */}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>

                {/* State / District */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>District *</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* City / Pincode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pincode *</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Water Source / Culture / Species */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Water Source *</Label>
                    <Input
                      value={formData.waterSource}
                      onChange={(e) =>
                        setFormData({ ...formData, waterSource: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Culture Areas *</Label>
                    <Input
                      type="number"
                      value={formData.cultureAreas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cultureAreas: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Input
                      value={formData.species}
                      onChange={(e) =>
                        setFormData({ ...formData, species: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Farmer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* FARMERS TABLE */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registered Farmers</CardTitle>
                <CardDescription>View and manage all farmer records</CardDescription>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Culture Areas</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell>{farmer.farmerId}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        {farmer.name}
                      </div>
                    </TableCell>

                    <TableCell>{farmer.phone}</TableCell>
                    <TableCell>
                      {farmer.city}, {farmer.state}
                    </TableCell>
                    <TableCell>{farmer.species}</TableCell>
                    <TableCell>{farmer.cultureAreas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Farmers;
