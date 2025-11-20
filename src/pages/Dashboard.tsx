import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Users, FlaskConical, FileText, TrendingUp, User } from "lucide-react";
import { useUserSession } from "../contexts/UserSessionContext";

const Dashboard = () => {
  const { session, clearTechnician } = useUserSession();

  const handleExit = () => {
    clearTechnician(); // removes only technicianId & technicianName

    // Redirect back to technician selection of same location
    window.location.href = `/technicians/${session.locationId}`;
  };

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* Technician Info Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">
              {session.technicianName || "Technician"}
            </h2>
          </div>

          {/* Exit Technician Button */}
          <Button variant="destructive" onClick={handleExit}>
            Exit Technician
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of laboratory operations and analytics</p>
        </div>

        {/* Filter Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9" />
              </div>
              <Input type="date" placeholder="Start Date" />
              <Input type="date" placeholder="End Date" />
              <Button>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Farmers
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">284</div>
              <p className="text-xs text-muted-foreground mt-1">+12 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Samples Processed
              </CardTitle>
              <FlaskConical className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,428</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reports Generated
              </CardTitle>
              <FileText className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">892</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹3,45,680</div>
              <p className="text-xs text-muted-foreground mt-1">+18% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest samples and reports from your laboratory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Water Sample - WS2024001</p>
                    <p className="text-sm text-muted-foreground">Farmer: Rajesh Kumar</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Report Generated - R2024045</p>
                    <p className="text-sm text-muted-foreground">Soil Analysis Completed</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">5 hours ago</span>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
