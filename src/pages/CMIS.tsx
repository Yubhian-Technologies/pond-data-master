import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const CMIS = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CMIS - Lab Management</h1>
          <p className="text-muted-foreground">Manage laboratory expenses, assets, and payments</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Financial Management</CardTitle>
                <CardDescription>Track expenses, assets, and payment records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CMIS module for managing lab expenses, particulars/inventory, and viewing payment history.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CMIS;
