import { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";
import { toast } from "sonner";
import { Shield, LogOut, Heart, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// -------------------------------
// Leaflet marker fix for Vite
// -------------------------------
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// -------------------------------
// Lazy-loaded components/pages
// -------------------------------
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));

// -------------------------------
// Framer Motion page variants
// -------------------------------
const pageVariants = {
  initial: { opacity: 0, x: 50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -50 },
};
const pageTransition = { type: "tween", ease: "easeInOut", duration: 0.4 };

// -------------------------------
// Main App Component
// -------------------------------
const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Get current session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthChecked(true);
    };
    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Shield className="w-12 h-12 mx-auto mb-4 animate-spin" />
        <p className="text-lg opacity-80">Checking session...</p>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes session={session} />
    </Router>
  );
};

// -------------------------------
// Animated Routes Wrapper
// -------------------------------
const AnimatedRoutes = ({ session }: { session: Session | null }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<PageWrapper>{session ? <Navigate to="/home" replace /> : <AuthPage />}</PageWrapper>} />
          <Route path="/home" element={<PageWrapper>{session ? <HomePage session={session} /> : <Navigate to="/auth" replace />}</PageWrapper>} />
          <Route path="*" element={<PageWrapper><Navigate to={session ? "/home" : "/auth"} replace /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

// -------------------------------
// Page Wrapper with Framer Motion
// -------------------------------
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen">
    {children}
  </motion.div>
);

export default App;
