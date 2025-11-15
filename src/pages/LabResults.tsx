import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Invoice, Report, TestResult } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

const LabResults = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [invoices] = useLocalStorage<Invoice[]>("invoices", []);
  const [reports, setReports] = useLocalStorage<Report[]>("reports", []);
  
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const invoiceId = searchParams.get("invoice");
    const foundInvoice = invoices.find(inv => inv.id === invoiceId);
    if (foundInvoice) {
      setCurrentInvoice(foundInvoice);
      setTestResults(
        foundInvoice.items.map(item => ({
          testId: item.testId,
          testName: item.testName,
          value: "",
          unit: "",
          normalRange: ""
        }))
      );
    }
  }, [searchParams, invoices]);

  const handleResultChange = (testId: string, field: keyof TestResult, value: string) => {
    setTestResults(prev =>
      prev.map(result =>
        result.testId === testId ? { ...result, [field]: value } : result
      )
    );
  };

  const generateReportNumber = () => {
    const count = reports.length + 1;
    return `RPT${String(count).padStart(5, "0")}`;
  };

  const handleGenerateReport = () => {
    if (!currentInvoice) return;

    const allFilled = testResults.every(result => result.value.trim() !== "");
    if (!allFilled) {
      toast({
        title: "Error",
        description: "Please fill all test results",
        variant: "destructive"
      });
      return;
    }

    const newReport: Report = {
      id: crypto.randomUUID(),
      reportNumber: generateReportNumber(),
      invoiceId: currentInvoice.id,
      farmerId: currentInvoice.farmerId,
      farmerName: currentInvoice.farmerName,
      sampleType: currentInvoice.samples[0].sampleType,
      testResults,
      remarks,
      generatedBy: localStorage.getItem("technicianId") || "TECH001",
      generatedAt: new Date(),
      editHistory: [],
      locationId: currentInvoice.locationId
    };

    setReports([...reports, newReport]);

    toast({
      title: "Report Generated",
      description: `Report ${newReport.reportNumber} created successfully`,
    });

    navigate("/reports");
  };

  if (!currentInvoice) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No invoice found. Please generate an invoice first.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lab Result Entry</h1>
          <p className="text-muted-foreground">Enter test results for {currentInvoice.farmerName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {testResults.map((result, index) => (
                  <div key={result.testId} className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-semibold text-primary">{result.testName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Result Value *</Label>
                        <Input
                          value={result.value}
                          onChange={(e) => handleResultChange(result.testId, "value", e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={result.unit || ""}
                          onChange={(e) => handleResultChange(result.testId, "unit", e.target.value)}
                          placeholder="e.g., mg/L, ppm"
                        />
                      </div>
                      <div>
                        <Label>Normal Range</Label>
                        <Input
                          value={result.normalRange || ""}
                          onChange={(e) => handleResultChange(result.testId, "normalRange", e.target.value)}
                          placeholder="e.g., 7.0-8.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Label>Remarks / Comments</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional comments or observations"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice:</span>
                  <span className="font-medium">{currentInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Farmer:</span>
                  <span className="font-medium">{currentInvoice.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample Type:</span>
                  <span className="font-medium capitalize">{currentInvoice.samples[0].sampleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tests:</span>
                  <span className="font-medium">{currentInvoice.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-primary">₹{currentInvoice.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleGenerateReport} className="w-full mt-6" size="lg">
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LabResults;
