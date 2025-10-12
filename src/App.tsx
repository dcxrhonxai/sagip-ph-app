import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

// ✅ Lazy-load pages/components
const AuthSOS = lazy(() => import("./pages/AuthSOS"));
const Home = lazy(() => import("./pages/Index")); // Updated Index page with live SOS map
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

  // -------------------------------
  // Initialize AdMob (native only)
  // -------------------------------
  useEffect(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({
            requestTrackingAuthorization: true,
            initializeForTesting: false,
          });
          console.log("✅ AdMob initialized successfully");
        } catch (error) {
          console.error("❌ AdMob initialization failed:", error);
        }
      } else {
        console.log("ℹ️ Skipping AdMob initialization (web build)");
      }
    };
    initAdMob();
  }, []);

  // -------------------------------
  // Supabase session check for seamless auth
  // -------------------------------
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Router>
          <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading...</div>}>
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

                {/* Home page (redirect to /auth if not logged in) */}
                <Route
                  path="/home"
                  element={
                    <motion.div
                      key="home"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <Home />
                    </motion.div>
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
