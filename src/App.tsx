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
  const [isAuthChecked, setIsAuthChecked] = useState(false); // ✅ prevent flashes

  // -------------------------------
  // Initialize AdMob (native only)
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
  // Check auth on app load
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
  // Render fallback if auth not yet checked
  // -------------------------------
  if (!isAuthChecked) {
    return <div className="text-center mt-10 text-gray-500">Loading app...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading page...</div>}>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Redirect root to /home */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Auth page */}
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

                {/* Home page - redirects to /auth if not logged in */}
                <Route
                  path="/home"
                  element={
                    session ? (
                      <motion.div
                        key="home"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <Home session={session} />
                      </motion.div>
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />

                {/* Catch-all 404 */}
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
