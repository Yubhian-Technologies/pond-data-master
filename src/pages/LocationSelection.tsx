import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ChevronRight } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useUserSession } from "../contexts/UserSessionContext"; // ✔ correct hook

type Location = {
  id: string;
  name: string;
  address: string;
  technicians: number;
};

const LocationSelection = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);

  const { session, setSession } = useUserSession(); // ✔ correct usage

  // Fetch locations from Firestore
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const fetchedLocations = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Location[];

        setLocations(fetchedLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationSelect = (locationId: string) => {
    // Update global session & save to localStorage
    setSession({
      ...session,
      locationId,
      technicianId: null, // reset technician
      technicianName: null,
    });

    navigate(`/technicians/${locationId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Select Laboratory Location</h1>
          <p className="text-muted-foreground">
            Choose a lab to view technicians and access the dashboard
          </p>
        </div>

        {locations.length === 0 ? (
          <p className="text-muted-foreground">Loading locations...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <Card
                key={location.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
                onClick={() => handleLocationSelect(location.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  <CardTitle className="text-xl">{location.name}</CardTitle>
                  <CardDescription>{location.address}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{location.technicians}</span>{" "}
                    Technicians
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelection;
