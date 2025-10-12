import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { supabase } from "@/integrations/supabase/client";

// ✅ Lazy-loaded pages
const AuthSOS = lazy(() => import("./pages/AuthSOS"));
const Home = lazy(() => import("./pages/Index")); // Updated Index with live SOS map
const NotFound = lazy(() => import("./pages/NotFound"));

// ✅ Page animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [session, setSession] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [preloadHomeData, setPreloadHomeData] = useState<{ location: { lat: number; lng: number }; alerts: any[] } | null>(null);

  // -------------------------------
  // Initialize AdMob
  // -------------------------------
  useEffect(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false });
          console.log("✅ AdMob initialized");
        } catch (err) {
          console.error("❌ AdMob init failed", err);
        }
      }
    };
    initAdMob();
  }, []);

  // -------------------------------
  // Auth check
  // -------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsAuthChecked(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // -------------------------------
  // Preload home data (location + live alerts)
  // -------------------------------
  useEffect(() => {
    if (!session) return;

    const preload = async () => {
      try {
        // Get user location
        const userLocation = await new Promise<{ lat: number; lng: number }>((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve({ lat: 14.5995, lng: 120.9842 }) // fallback: Manila
            );
          } else {
            resolve({ lat: 14.5995, lng: 120.9842 });
          }
        });

        // Fetch active alerts
        const { data: alerts } = await supabase
          .from("emergency_alerts")
          .select("*")
          .eq("status", "active");

        setPreloadHomeData({ location: userLocation, alerts: alerts || [] });
      } catch (err) {
        console.error("❌ Preload home data failed:", err);
      }
    };

    preload();
  }, [session]);

  // -------------------------------
  // Render fallback while auth or home data is loading
  // -------------------------------
  if (!isAuthChecked) return <div className="text-center mt-10 text-gray-500">Loading app...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading page...</div>}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />

                <Route
                  path="/auth"
                  element={
                    <motion.div
                      key="auth"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <AuthSOS />
                    </motion.div>
                  }
                />

                <Route
                  path="/home"
                  element={
                    session ? (
                      preloadHomeData ? (
                        <motion.div
                          key="home"
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={pageVariants}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <Home
                            session={session}
                            initialLocation={preloadHomeData.location}
                            initialAlerts={preloadHomeData.alerts}
                          />
                        </motion.div>
                      ) : (
                        <div className="text-center mt-10 text-gray-500">Loading home data...</div>
                      )
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />

                <Route
                  path="*"
                  element={
                    <motion.div
                      key="notfound"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <NotFound />
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
