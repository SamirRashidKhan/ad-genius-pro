import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/page-transition";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import BusinessOnboarding from "@/pages/BusinessOnboarding";
import MyBusiness from "@/pages/MyBusiness";
import CreateAd from "@/pages/CreateAd";
import MyAds from "@/pages/MyAds";
import Campaigns from "@/pages/Campaigns";
import Analytics from "@/pages/Analytics";
import Tokens from "@/pages/Tokens";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/auth"
          element={
            <PageTransition>
              <Auth />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route
          path="/business/onboarding"
          element={
            <PageTransition>
              <BusinessOnboarding />
            </PageTransition>
          }
        />
        <Route
          path="/business"
          element={
            <PageTransition>
              <MyBusiness />
            </PageTransition>
          }
        />
        <Route
          path="/create-ad"
          element={
            <PageTransition>
              <CreateAd />
            </PageTransition>
          }
        />
        <Route
          path="/my-ads"
          element={
            <PageTransition>
              <MyAds />
            </PageTransition>
          }
        />
        <Route
          path="/my-ads/:id"
          element={
            <PageTransition>
              <MyAds />
            </PageTransition>
          }
        />
        <Route
          path="/campaigns"
          element={
            <PageTransition>
              <Campaigns />
            </PageTransition>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageTransition>
              <Analytics />
            </PageTransition>
          }
        />
        <Route
          path="/tokens"
          element={
            <PageTransition>
              <Tokens />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
