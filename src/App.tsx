import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import LocationSelection from "./pages/LocationSelection";
import TechnicianSelection from "./pages/TechnicianSelection";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import Samples from "./pages/Samples";
import Invoice from "./pages/Invoice";
import LabResults from "./pages/LabResults";
import Reports from "./pages/Reports";
import CMIS from "./pages/CMIS";
import NotFound from "./pages/NotFound";
import InvoiceTemplate from "../src/data/template";
import { UserSessionProvider, useUserSession } from "./contexts/UserSessionContext";
import InvoiceView from "./pages/InvoiceViewer";
import SoilReport from "../../pond-data-master/src/components/reports/SoilReport";
import WaterReport from "../../pond-data-master/src/components/reports/WaterReport";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session } = useUserSession();
  const location = useLocation();

  if (!session.locationId) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserSessionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            
            <Route path="/" element={<Login />} />

            
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <LocationSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technicians/:locationId"
              element={
                <ProtectedRoute>
                  <TechnicianSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers"
              element={
                <ProtectedRoute>
                  <Farmers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/samples"
              element={
                <ProtectedRoute>
                  <Samples />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab-results/:invoiceId"
              element={
                <ProtectedRoute>
                  <LabResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/soil-report/:invoiceId/:locationId"
              element={
                <ProtectedRoute>
                  <SoilReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/water-report/:invoiceId/:locationId"
              element={
                <ProtectedRoute>
                  <WaterReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cmis"
              element={
                <ProtectedRoute>
                  <CMIS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice/:invoiceId/:locationId"
              element={
                <ProtectedRoute>
                  <InvoiceView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-template"
              element={
                <ProtectedRoute>
                  <InvoiceTemplate />
                </ProtectedRoute>
              }
            />

            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserSessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;