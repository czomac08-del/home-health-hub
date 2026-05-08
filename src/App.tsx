import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import WelcomeScreen from "./pages/WelcomeScreen";
import OnboardingWizard from "./pages/OnboardingWizard";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { ProfileSwitcherProvider } from "@/contexts/ProfileSwitcherContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_TERMS_VERSION } from "@/lib/legal";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordScreen from "./pages/ForgotPasswordScreen";
import ResetPasswordScreen from "./pages/ResetPasswordScreen";
import VerifyEmailScreen from "./pages/VerifyEmailScreen";
import TwoFactorVerifyScreen from "./pages/TwoFactorVerifyScreen";
import ScanningScreen from "./pages/ScanningScreen";
import DashboardScreen from "./pages/DashboardScreen";
import SystemDetailScreen from "./pages/SystemDetailScreen";
import SystemConfigScreen from "./pages/SystemConfigScreen";
import SystemsScreen from "./pages/SystemsScreen";
import InsuranceScreen from "./pages/InsuranceScreen";
import GuidesScreen from "./pages/GuidesScreen";
import GuideWalkthroughScreen from "./pages/GuideWalkthroughScreen";
import ProfileScreen from "./pages/ProfileScreen";
import PropertyDetailScreen from "./pages/PropertyDetailScreen";
import HandoverWizardScreen from "./pages/HandoverWizardScreen";
import ClaimHomeScreen from "./pages/ClaimHomeScreen";
import RealtorDashboard from "./pages/RealtorDashboard";
import InspectorDashboard from "./pages/InspectorDashboard";
import ContractorDashboard from "./pages/ContractorDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import RenterSafetyView from "./pages/RenterSafetyView";
import ScoreReportPage from "./pages/ScoreReportPage";
import WarrantyDashboard from "./pages/WarrantyDashboard";
import PrivacyReminderScreen from "./pages/PrivacyReminderScreen";
import DocumentVaultScreen from "./pages/DocumentVaultScreen";
import FeedbackScreen from "./pages/FeedbackScreen";
import BottomNav from "./components/BottomNav";
import HelpButton from "./components/HelpButton";
import DesktopSidebar from "./components/DesktopSidebar";
import DesktopHeader from "./components/DesktopHeader";
import CreateProfileScreen from "./pages/CreateProfileScreen";
import PortfolioOverview from "./pages/PortfolioOverview";
import UtilityServicesScreen from "./pages/UtilityServicesScreen";
import WellWaterScreen from "./pages/WellWaterScreen";
import IntegrationsPage from "./pages/IntegrationsPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import PricingPage from "./pages/PricingPage";
import NotFound from "./pages/NotFound";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import LegalOnboardingScreen from "./pages/LegalOnboardingScreen";
import LegalFooter from "./components/LegalFooter";
import HomeDefenseHubScreen from "./pages/HomeDefenseHubScreen";
import JoinReferralScreen from "./pages/JoinReferralScreen";
import AdminRewardsPage from "./pages/AdminRewardsPage";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import InspectionReviewViewer from "./pages/InspectionReviewViewer";
import SubToLandingPage from "./pages/SubToLandingPage";
import ContrarianLandingPage from "./pages/ContrarianLandingPage";
import PartnersPage from "./pages/PartnersPage";
import CentriqAlternativePage from "./pages/CentriqAlternativePage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import UploadDocumentFab from "./components/UploadDocumentFab";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PrivacyRightsPage from "./pages/PrivacyRightsPage";
import PropertyContextBanner from "./components/PropertyContextBanner";
import SEO from "./components/SEO";

const queryClient = new QueryClient();

const hideNavRoutes = ["/", "/auth", "/join", "/forgot-password", "/reset-password", "/verify-email", "/two-factor", "/scanning", "/report", "/welcome", "/onboarding", "/privacy-reminder", "/pricing", "/terms", "/privacy", "/privacy-rights", "/legal-onboarding", "/subto", "/contrarian", "/partners", "/centriq-alternative", "/blog"];
const _hideUnsub = "/unsubscribe";
const hideNavPrefixes = ["/inspection-review/", "/blog/"];

/**
 * Routes that have their own per-page SEO and should be crawled.
 * Anything else gets a global noindex tag so private app data does
 * not leak into search engines.
 */
const PUBLIC_INDEXABLE_ROUTES = new Set<string>([
  "/",
  "/pricing",
  "/terms",
  "/privacy",
  "/privacy-rights",
  "/api-docs",
  "/realtor",
  "/inspector",
  "/contractor",
  "/investor",
  "/subto",
  "/contrarian",
  "/partners",
  "/centriq-alternative",
  "/blog",
]);
const PUBLIC_INDEXABLE_PREFIXES = ["/report/", "/blog/"]; // shared certification reports + blog posts stay indexable

// Pages where the Upload Document FAB should appear (homeowner property pages).
const uploadFabRoutes = [
  "/dashboard",
  "/property",
  "/systems",
  "/system",
  "/system-config",
  "/documents",
  "/insurance",
  "/warranties",
  "/well-water",
  "/utilities",
  "/home-defense",
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile, properties } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [ackState, setAckState] = useState<"loading" | "ok" | "stale">("loading");
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setTimedOut(true), 2000);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    if (!user) { setAckState("ok"); return; }
    let cancelled = false;
    void supabase
      .from("legal_acknowledgments")
      .select("terms_version, fcra_acknowledged, not_professional_advice_acknowledged")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const current =
          data &&
          data.terms_version === CURRENT_TERMS_VERSION &&
          data.fcra_acknowledged === true &&
          data.not_professional_advice_acknowledged === true;
        setAckState(current ? "ok" : "stale");
      });
    return () => { cancelled = true; };
  }, [user]);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen max-w-lg lg:max-w-4xl mx-auto px-6 py-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-secondary rounded-lg" />
        <div className="h-32 w-full bg-secondary rounded-xl" />
        <div className="h-20 w-full bg-secondary rounded-xl" />
        <div className="h-20 w-full bg-secondary rounded-xl" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  // Force re-acknowledgment when terms version is bumped or required acks are missing.
  if (
    ackState === "stale" &&
    location.pathname !== "/legal-onboarding"
  ) {
    return <Navigate to="/legal-onboarding" replace />;
  }
  // Address is now optional — users without a property go to the dashboard,
  // which handles its own empty state with an inline "Add My Home" prompt.
  return <>{children}</>;
};

const RoleRedirect = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const role = profile?.role || "homeowner";
  const params = new URLSearchParams(location.search);
  const isCheckoutReturn = params.get("checkout") === "success";
  // Onboarding is shown only on first signup (handled at signup flow), never
  // forced again on login regardless of whether the user has an address.
  void isCheckoutReturn;
  const dest: Record<string, string> = {
    homeowner: "/dashboard",
    realtor: "/realtor",
    inspector: "/inspector",
    contractor: "/contractor",
    investor: "/investor",
  };
  return <Navigate to={dest[role] || "/dashboard"} replace />;
};

const AppContent = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const showNav =
    user &&
    !hideNavRoutes.some((r) => location.pathname === r || location.pathname.startsWith("/report/")) &&
    !hideNavPrefixes.some((r) => location.pathname.startsWith(r));
  const showUploadFab = user && uploadFabRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + "/"));

  // Global SEO fallback: emit noindex on any private/app route. Public pages
  // override this via their own <SEO /> rendered later in the tree (Helmet
  // de-duplicates by tag).
  const isPublicIndexable =
    PUBLIC_INDEXABLE_ROUTES.has(location.pathname) ||
    PUBLIC_INDEXABLE_PREFIXES.some((p) => location.pathname.startsWith(p));

  // Welcome toast on sign in
  useEffect(() => {
    const handler = () => {
      const name = profile?.full_name?.split(" ")[0] || "back";
      import("sonner").then(({ toast }) => {
        toast.success(`Welcome back, ${name}!`, { duration: 3000 });
      });
    };
    window.addEventListener("auth:signed_in", handler);
    return () => window.removeEventListener("auth:signed_in", handler);
  }, [profile]);

  return (
    <div className="flex min-h-screen w-full">
      {/* Default noindex on private/app routes. Public pages render their own SEO
          afterwards which overrides this (react-helmet-async dedupes by tag name). */}
      {!isPublicIndexable && (
        <SEO
          title="ComingHomeIQ"
          description="ComingHomeIQ — your home's complete intelligence platform."
          path={location.pathname}
          noIndex
        />
      )}
      {/* Desktop sidebar — only show on authenticated app pages */}
      {showNav && <DesktopSidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        {showNav && <DesktopHeader />}

        {/* Global active-property indicator on every authenticated screen */}
        {showNav && <PropertyContextBanner />}

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/join" element={<JoinReferralScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/verify-email" element={<VerifyEmailScreen />} />
            <Route path="/two-factor" element={<TwoFactorVerifyScreen />} />
            <Route path="/scanning" element={<ProtectedRoute><ScanningScreen /></ProtectedRoute>} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
            <Route path="/privacy-reminder" element={<ProtectedRoute><PrivacyReminderScreen /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
            <Route path="/system/:id" element={<ProtectedRoute><SystemDetailScreen /></ProtectedRoute>} />
            <Route path="/system-config/:name" element={<ProtectedRoute><SystemConfigScreen /></ProtectedRoute>} />
            <Route path="/systems" element={<ProtectedRoute><SystemsScreen /></ProtectedRoute>} />
            <Route path="/insurance" element={<ProtectedRoute><InsuranceScreen /></ProtectedRoute>} />
            <Route path="/guides" element={<ProtectedRoute><GuidesScreen /></ProtectedRoute>} />
            <Route path="/guide/:id" element={<ProtectedRoute><GuideWalkthroughScreen /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/property" element={<ProtectedRoute><PropertyDetailScreen /></ProtectedRoute>} />
            <Route path="/handover" element={<ProtectedRoute><HandoverWizardScreen /></ProtectedRoute>} />
            <Route path="/claim" element={<ProtectedRoute><ClaimHomeScreen /></ProtectedRoute>} />
            <Route path="/claim/:propertyId" element={<ProtectedRoute><ClaimHomeScreen /></ProtectedRoute>} />
            <Route path="/realtor" element={<ProtectedRoute><RealtorDashboard /></ProtectedRoute>} />
            <Route path="/inspector" element={<ProtectedRoute><InspectorDashboard /></ProtectedRoute>} />
            <Route path="/contractor" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
            <Route path="/investor" element={<ProtectedRoute><InvestorDashboard /></ProtectedRoute>} />
            <Route path="/rental-safety" element={<ProtectedRoute><RenterSafetyView /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ScoreReportPage />} />
            <Route path="/warranties" element={<ProtectedRoute><WarrantyDashboard /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><DocumentVaultScreen /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><FeedbackScreen /></ProtectedRoute>} />
            <Route path="/create-profile" element={<ProtectedRoute><CreateProfileScreen /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><PortfolioOverview /></ProtectedRoute>} />
            <Route path="/utilities" element={<ProtectedRoute><UtilityServicesScreen /></ProtectedRoute>} />
            <Route path="/well-water" element={<ProtectedRoute><WellWaterScreen /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ApiDocsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy-rights" element={<PrivacyRightsPage />} />
            <Route path="/legal-onboarding" element={<ProtectedRoute><LegalOnboardingScreen /></ProtectedRoute>} />
            <Route path="/home-defense" element={<ProtectedRoute><HomeDefenseHubScreen /></ProtectedRoute>} />
            <Route path="/report" element={<ScoreReportPage />} />
            <Route path="/admin/rewards" element={<ProtectedRoute><AdminRewardsPage /></ProtectedRoute>} />
            <Route path="/affiliate-dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
            <Route path="/inspection-review/:id/viewer" element={<ProtectedRoute><InspectionReviewViewer /></ProtectedRoute>} />
            <Route path="/subto" element={<SubToLandingPage />} />
            <Route path="/contrarian" element={<ContrarianLandingPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/centriq-alternative" element={<CentriqAlternativePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Legal footer on authenticated pages */}
        {showNav && <LegalFooter />}
      </div>

      {/* Mobile bottom nav — hidden on desktop via lg:hidden */}
      {showNav && (
        <div className="lg:hidden">
          <HelpButton />
          <BottomNav />
        </div>
      )}
      {/* Desktop help button */}
      {showNav && (
        <div className="hidden lg:block">
          <HelpButton />
        </div>
      )}
      {showUploadFab && <UploadDocumentFab />}
      <CookieConsentBanner />
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
        <ProfileSwitcherProvider>
          <RoleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </RoleProvider>
          </ProfileSwitcherProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
