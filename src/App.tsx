import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import WelcomeScreen from "./pages/WelcomeScreen";
import OnboardingWizard from "./pages/OnboardingWizard";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ScanningScreen from "./pages/ScanningScreen";
import DashboardScreen from "./pages/DashboardScreen";
import SystemDetailScreen from "./pages/SystemDetailScreen";
import SystemConfigScreen from "./pages/SystemConfigScreen";
import SystemsScreen from "./pages/SystemsScreen";
import GuidesScreen from "./pages/GuidesScreen";
import GuideWalkthroughScreen from "./pages/GuideWalkthroughScreen";
import ProfileScreen from "./pages/ProfileScreen";
import PropertyDetailScreen from "./pages/PropertyDetailScreen";
import HandoverWizardScreen from "./pages/HandoverWizardScreen";
import ClaimHomeScreen from "./pages/ClaimHomeScreen";
import RealtorDashboard from "./pages/RealtorDashboard";
import InspectorDashboard from "./pages/InspectorDashboard";
import ContractorDashboard from "./pages/ContractorDashboard";
import ScoreReportPage from "./pages/ScoreReportPage";
import PrivacyReminderScreen from "./pages/PrivacyReminderScreen";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const hideNavRoutes = ["/", "/auth", "/scanning", "/report", "/welcome", "/onboarding", "/privacy-reminder"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const RoleRedirect = () => {
  const { profile, properties, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  const role = profile?.role || "homeowner";
  if (role === "homeowner" && properties.length === 0) return <Navigate to="/welcome" replace />;
  const dest: Record<string, string> = {
    homeowner: "/dashboard",
    realtor: "/realtor",
    inspector: "/inspector",
    contractor: "/contractor",
  };
  return <Navigate to={dest[role] || "/dashboard"} replace />;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const showNav = user && !hideNavRoutes.some((r) => location.pathname === r || location.pathname.startsWith("/report/"));

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/scanning" element={<ProtectedRoute><ScanningScreen /></ProtectedRoute>} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
        <Route path="/privacy-reminder" element={<ProtectedRoute><PrivacyReminderScreen /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/system/:id" element={<ProtectedRoute><SystemDetailScreen /></ProtectedRoute>} />
        <Route path="/system-config/:name" element={<ProtectedRoute><SystemConfigScreen /></ProtectedRoute>} />
        <Route path="/systems" element={<ProtectedRoute><SystemsScreen /></ProtectedRoute>} />
        <Route path="/guides" element={<ProtectedRoute><GuidesScreen /></ProtectedRoute>} />
        <Route path="/guide/:id" element={<ProtectedRoute><GuideWalkthroughScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        <Route path="/property" element={<ProtectedRoute><PropertyDetailScreen /></ProtectedRoute>} />
        <Route path="/handover" element={<ProtectedRoute><HandoverWizardScreen /></ProtectedRoute>} />
        <Route path="/claim" element={<ProtectedRoute><ClaimHomeScreen /></ProtectedRoute>} />
        <Route path="/realtor" element={<ProtectedRoute><RealtorDashboard /></ProtectedRoute>} />
        <Route path="/inspector" element={<ProtectedRoute><InspectorDashboard /></ProtectedRoute>} />
        <Route path="/contractor" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
        <Route path="/report/:id" element={<ScoreReportPage />} />
        <Route path="/report" element={<ScoreReportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoleProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
