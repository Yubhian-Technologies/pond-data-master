import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ADC from "@/assets/ADC.jpg"
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  FileText, 
  DollarSign, 
  LogOut,
  Beaker
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/farmers", label: "Farmers", icon: Users },
  { path: "/samples", label: "Samples", icon: FlaskConical },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/cmis", label: "CMIS", icon: DollarSign },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");  // Sets login state to false
    toast.success("Logged out successfully");
    navigate("/");  // Redirect to login
  };

 return (
  <div className="flex min-h-screen bg-background">
    {/* Sidebar */}
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Beaker className="w-6 h-6 text-primary-foreground" />
          </div> */}
          <img src={ADC} className="w-24 h-16" alt="" />
          <div>
            <h2 className="font-bold text-lg text-foreground">Aqua Lab</h2>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>

           <nav className="flex-1 p-4 space-y-1 overflow-y-auto pb-20">
        {/* Main Navigation Items - they will scroll if too many */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 transition-colors",
                isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              )}
              onClick={() => navigate(item.path)}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Fixed Logout at the bottom */}
      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
);
};

export default DashboardLayout;