
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
import { UserSessionProvider } from "./contexts/UserSessionContext";
import InvoiceView from "./pages/InvoiceViewer";
import SoilReport from "../../pond-data-master/src/components/reports/SoilReport";
import WaterReport from "../../pond-data-master/src/components/reports/WaterReport";

const queryClient = new QueryClient();


const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
  </div>
);

const Protected = ({ children }: { children: JSX.Element }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("isLoggedIn");
    const loggedIn = stored === "true";
    setIsLoggedIn(loggedIn);
    if (!loggedIn) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (isLoggedIn === null) return <AuthLoading />;
  if (!isLoggedIn) return null;

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
            <Route path="/locations" element={<Protected><LocationSelection /></Protected>} />
            <Route path="/technicians/:locationId" element={<Protected><TechnicianSelection /></Protected>} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/farmers" element={<Protected><Farmers /></Protected>} />
            <Route path="/samples" element={<Protected><Samples /></Protected>} />
            <Route path="/invoice" element={<Protected><Invoice /></Protected>} />
            <Route path="/lab-results/:invoiceId" element={<Protected><LabResults /></Protected>} />
            <Route path="/soil-report/:invoiceId/:locationId" element={<Protected><SoilReport /></Protected>} />
            <Route path="/water-report/:invoiceId/:locationId" element={<Protected><WaterReport /></Protected>} />
            <Route path="/invoice-template" element={<Protected><InvoiceTemplate /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/cmis" element={<Protected><CMIS /></Protected>} />
            <Route path="/invoice/:invoiceId/:locationId" element={<Protected><InvoiceView /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserSessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;