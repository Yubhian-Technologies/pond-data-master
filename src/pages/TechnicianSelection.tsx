import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const techniciansByLocation: Record<number, Array<{ id: number; name: string; role: string; experience: string }>> = {
  1: [
    { id: 1, name: "Dr. Rajesh Kumar", role: "Senior Analyst", experience: "8 years" },
    { id: 2, name: "Priya Sharma", role: "Water Quality Specialist", experience: "5 years" },
    { id: 3, name: "Arun Venkat", role: "Microbiologist", experience: "6 years" },
  ],
  2: [
    { id: 4, name: "Lakshmi Reddy", role: "Lab Technician", experience: "4 years" },
    { id: 5, name: "Suresh Babu", role: "Sample Analyst", experience: "7 years" },
  ],
  3: [
    { id: 6, name: "Kavitha Rao", role: "Senior Technician", experience: "9 years" },
    { id: 7, name: "Ramesh Kumar", role: "Quality Control", experience: "5 years" },
  ],
  4: [
    { id: 8, name: "Anitha Devi", role: "Lab Assistant", experience: "3 years" },
    { id: 9, name: "Vijay Krishna", role: "Testing Specialist", experience: "6 years" },
  ],
  5: [
    { id: 10, name: "Sita Lakshmi", role: "Soil Analyst", experience: "7 years" },
    { id: 11, name: "Karthik Reddy", role: "Lab Technician", experience: "4 years" },
  ],
};

const TechnicianSelection = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const technicians = techniciansByLocation[Number(locationId)] || [];

  const handleTechnicianSelect = (technicianId: number) => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/locations")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Select Technician</h1>
          <p className="text-muted-foreground">Choose a technician to proceed to the dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {technicians.map((technician) => (
            <Card
              key={technician.id}
              className="cursor-pointer transition-all hover:shadow-[var(--shadow-elevated)] hover:scale-[1.02]"
              onClick={() => handleTechnicianSelect(technician.id)}
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
      </div>
    </div>
  );
};

export default TechnicianSelection;
