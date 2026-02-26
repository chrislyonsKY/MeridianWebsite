import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CookieBanner } from "@/components/CookieConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";

// Components
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { StockTicker } from "@/components/StockTicker";

// Pages
import LandingPage from "@/pages/LandingPage";
import FeedPage from "@/pages/FeedPage";
import StoryPage from "@/pages/StoryPage";
import MethodologyPage from "@/pages/MethodologyPage";
import AdminPage from "@/pages/AdminPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import SourcesPage from "@/pages/SourcesPage";
import ContactPage from "@/pages/ContactPage";
import AboutPage from "@/pages/AboutPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ConflictMapPage from "@/pages/ConflictMapPage";
import SavedStoriesPage from "@/pages/SavedStoriesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/conflicts" component={ConflictMapPage} />
      <Route path="/story/:id" component={StoryPage} />
      <Route path="/methodology" component={MethodologyPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/sources" component={SourcesPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsOfServicePage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/saved" component={SavedStoriesPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <StockTicker />
            <Navbar />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
          <CookieBanner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
