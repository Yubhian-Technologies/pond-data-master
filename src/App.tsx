import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/locations" element={<LocationSelection />} />
          <Route path="/technicians/:locationId" element={<TechnicianSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/lab-results" element={<LabResults />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/cmis" element={<CMIS />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
