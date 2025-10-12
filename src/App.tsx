import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Components
import VideoRecorder from "./components/VideoRecorder";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ✅ Allowed ad placement on Index (Home) */}
            <Route path="/" element={<Index />} />

            {/* 🚫 No ads on Auth or Recording pages */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/record" element={<VideoRecorder />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
