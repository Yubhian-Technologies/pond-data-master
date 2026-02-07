import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, ArrowLeft, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useUserSession } from "../contexts/UserSessionContext";

type Technician = {
  id: string;
  name: string;
  role: string;
  experience: string;
  // We'll add location info only for "Others" view
  locationId?: string;
  locationName?: string;
};

const TechnicianSelection = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useUserSession();

  const [currentTechnicians, setCurrentTechnicians] = useState<Technician[]>([]);
  const [otherTechnicians, setOtherTechnicians] = useState<Technician[]>([]);
  const [showOthers, setShowOthers] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current location technicians + all others
  useEffect(() => {
    const fetchData = async () => {
      if (!locationId) return;

      setLoading(true);

      try {
        // 1. Get current location's technicians
        const currentTechRef = collection(db, "locations", locationId, "technicians");
        const currentSnap = await getDocs(currentTechRef);
        const current: Technician[] = currentSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Technician[];

        setCurrentTechnicians(current);

        // 2. Get all locations to fetch other technicians
        const locationsSnap = await getDocs(collection(db, "locations"));
        const otherTechs: Technician[] = [];

        for (const locDoc of locationsSnap.docs) {
          const locId = locDoc.id;
          if (locId === locationId) continue; // skip current

          const locData = locDoc.data();
          const techRef = collection(db, "locations", locId, "technicians");
          const techSnap = await getDocs(techRef);

          techSnap.docs.forEach((techDoc) => {
            otherTechs.push({
              id: techDoc.id,
              ...techDoc.data(),
              locationId: locId,
              locationName: locData.name as string | undefined,
            } as Technician);
          });
        }

        setOtherTechnicians(otherTechs);
      } catch (error) {
        console.error("Error fetching technicians:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationId]);

  const handleTechnicianSelect = (technician: Technician, isFromOthers = false) => {
    // Always use the CURRENT location in session,
    // even if technician is from another branch
    setSession({
      ...session,
      locationId: locationId!,           // ← forced to current branch
      technicianId: technician.id,
      technicianName: technician.name,
      // Optional: you could also store original location if needed later
      // originalLocationId: isFromOthers ? technician.locationId : locationId,
    });

    navigate("/dashboard");
  };

  const displayedTechnicians = showOthers ? otherTechnicians : currentTechnicians;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/locations")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </Button>

        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {showOthers ? "Other Branches' Technicians" : "Select Technician"}
            </h1>
            <p className="text-muted-foreground">
              {showOthers
                ? "Technicians from other locations (current location will be used)"
                : "Choose a technician to proceed to the dashboard"}
            </p>
          </div>

          <Button
            variant={showOthers ? "default" : "outline"}
            onClick={() => setShowOthers(!showOthers)}
          >
            {showOthers ? "Show Current Branch" : "Others (from other branches)"}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading technicians...</p>
        ) : displayedTechnicians.length === 0 ? (
          <p className="text-muted-foreground">
            {showOthers
              ? "No technicians found in other locations."
              : "No technicians found for this location."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedTechnicians.map((technician) => (
              <Card
                key={technician.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleTechnicianSelect(technician, showOthers)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">{technician.name}</CardTitle>
                      <CardDescription className="text-sm mb-1">
                        {technician.role}
                      </CardDescription>

                      {showOthers && technician.locationName && (
                        <Badge variant="secondary" className="mt-1">
                          {technician.locationName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianSelection;