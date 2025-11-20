import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useUserSession } from "../contexts/UserSessionContext";

type Technician = {
  id: string;
  name: string;
  role: string;
  experience: string;
};

const TechnicianSelection = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();

  const { session, setSession } = useUserSession();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch technicians from Firestore subcollection
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const techRef = collection(db, "locations", locationId!, "technicians");
        const snapshot = await getDocs(techRef);

        const fetchedTechnicians: Technician[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Technician[];

        setTechnicians(fetchedTechnicians);
      } catch (error) {
        console.error("Error fetching technicians:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [locationId]);

  // Handle selection
  const handleTechnicianSelect = (technician: Technician) => {
    // Save in session and localStorage
    setSession({
      ...session,
      locationId: locationId!,
      technicianId: technician.id,
      technicianName: technician.name,
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/locations")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Select Technician</h1>
          <p className="text-muted-foreground">Choose a technician to proceed to the dashboard</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading technicians...</p>
        ) : technicians.length === 0 ? (
          <p className="text-muted-foreground">No technicians found for this location.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {technicians.map((technician) => (
              <Card
                key={technician.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleTechnicianSelect(technician)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">{technician.name}</CardTitle>
                      <CardDescription className="text-sm">{technician.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Badge variant="secondary" className="text-xs">
                    {technician.experience} experience
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianSelection;
