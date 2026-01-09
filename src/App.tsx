import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import MyBusiness from "./pages/MyBusiness";
import CreateAd from "./pages/CreateAd";
import MyAds from "./pages/MyAds";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import Tokens from "./pages/Tokens";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/business/onboarding" element={<BusinessOnboarding />} />
          <Route path="/business" element={<MyBusiness />} />
          <Route path="/create-ad" element={<CreateAd />} />
          <Route path="/my-ads" element={<MyAds />} />
          <Route path="/my-ads/:id" element={<MyAds />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tokens" element={<Tokens />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
