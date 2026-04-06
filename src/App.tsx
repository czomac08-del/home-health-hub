import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WelcomeScreen from "./pages/WelcomeScreen";
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
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const hideNavRoutes = ["/", "/scanning"];

const AppContent = () => {
  const location = useLocation();
  const showNav = !hideNavRoutes.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/scanning" element={<ScanningScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/system/:id" element={<SystemDetailScreen />} />
          <Route path="/system-config/:name" element={<SystemConfigScreen />} />
          <Route path="/systems" element={<SystemsScreen />} />
          <Route path="/guides" element={<GuidesScreen />} />
          <Route path="/guide/:id" element={<GuideWalkthroughScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/property" element={<PropertyDetailScreen />} />
          <Route path="/handover" element={<HandoverWizardScreen />} />
          <Route path="/claim" element={<ClaimHomeScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
