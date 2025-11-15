import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

const Samples = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sample Submission</h1>
          <p className="text-muted-foreground">Submit and manage sample testing requests</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>Sample Management</CardTitle>
                <CardDescription>This module will handle sample submission and testing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sample submission workflow will be implemented here with farmer selection, 
              sample type selection, and test configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Samples;
