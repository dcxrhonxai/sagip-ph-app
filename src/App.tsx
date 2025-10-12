import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

// ✅ Lazy-loaded pages
const AuthSOS = lazy(() => import("./pages/AuthSOS"));
const Home = lazy(() => import("./pages/Index")); // Updated Index page with live SOS map
const NotFound = lazy(() => import("./pages/NotFound"));

// ✅ Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Prevent rendering until auth is checked

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
      }
    };
    initAdMob();
  }, []);

  // -------------------------------
  // Supabase session check
  // -------------------------------
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
      };

      checkSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  // -------------------------------
  // Loading fallback before auth resolved
  // -------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
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

                {/* Auth Page */}
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

                {/* Home Page - protected */}
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
                        <Home />
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
