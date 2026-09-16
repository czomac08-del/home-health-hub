/**
 * Build-time prerender entry.
 *
 * This module is ONLY used by the prerender step in vite.config.ts. It renders
 * the public marketing pages to static HTML so crawlers that do not execute
 * JavaScript still see real text. The app itself is untouched: the generated
 * HTML still boots the normal SPA from /src/main.tsx on load.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider, type FilledContext } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import PrivacyRightsPage from "./pages/PrivacyRightsPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import PartnersPage from "./pages/PartnersPage";
import SubToLandingPage from "./pages/SubToLandingPage";
import ContrarianLandingPage from "./pages/ContrarianLandingPage";
import CentriqAlternativePage from "./pages/CentriqAlternativePage";

/** Public, auth-free, database-free routes that are safe to prerender. */
export const PRERENDER_ROUTES = [
  "/",
  "/pricing",
  "/terms",
  "/privacy",
  "/privacy-rights",
  "/api-docs",
  "/partners",
  "/subto",
  "/contrarian",
  "/centriq-alternative",
] as const;

const PublicRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/terms" element={<TermsOfServicePage />} />
    <Route path="/privacy" element={<PrivacyPolicyPage />} />
    <Route path="/privacy-rights" element={<PrivacyRightsPage />} />
    <Route path="/api-docs" element={<ApiDocsPage />} />
    <Route path="/partners" element={<PartnersPage />} />
    <Route path="/subto" element={<SubToLandingPage />} />
    <Route path="/contrarian" element={<ContrarianLandingPage />} />
    <Route path="/centriq-alternative" element={<CentriqAlternativePage />} />
  </Routes>
);

export interface PrerenderResult {
  html: string;
  head: string;
}

export function render(url: string): PrerenderResult {
  const helmetContext: Record<string, unknown> = {};
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url}>
          <PublicRoutes />
        </StaticRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );

  const { helmet } = helmetContext as FilledContext;
  const head = helmet
    ? [
        helmet.title?.toString() ?? "",
        helmet.meta?.toString() ?? "",
        helmet.link?.toString() ?? "",
        helmet.script?.toString() ?? "",
      ]
        .filter(Boolean)
        .join("\n    ")
    : "";

  return { html, head };
}
