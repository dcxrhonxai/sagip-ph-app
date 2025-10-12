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
import EmergencyForm from "@/components/EmergencyForm";
import PersonalContacts from "@/components/PersonalContacts";
import AlertHistory from "@/components/AlertHistory";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { EmergencyProfile } from "@/components/EmergencyProfile";
import { Shield, LogOut, Heart, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// -------------------------------
// Lazy-loaded Auth page
// -------------------------------
const AuthSOS = lazy(() => import("./pages/AuthSOS"));

// -------------------------------
// Animation variants
// -------------------------------
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// -------------------------------
// Upgraded LocationMap component
// -------------------------------
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion as m } from "framer-motion";

const BlankIcon = new L.DivIcon({ className: "custom-marker" });

const dropVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 25 } },
};

const LocationMap = ({ alerts, initialLocation }: { alerts: any[]; initialLocation: { lat: number; lng: number } }) => {
  const [displayedAlerts, setDisplayedAlerts] = useState<any[]>([]);

  useEffect(() => {
    alerts.forEach((alert, i) => {
      if (!displayedAlerts.find((a) => a.id === alert.id)) {
        setTimeout(() => setDisplayedAlerts((prev) => [...prev, alert]), i * 200);
      }
    });
  }, [alerts, displayedAlerts]);

  const newestAlert = displayedAlerts[displayedAlerts.length - 1];

  return (
    <MapContainer center={initialLocation} zoom={15} scrollWheelZoom className="w-full h-96 rounded-lg shadow-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {displayedAlerts.map((alert) => (
        <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={BlankIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{alert.emergency_type}</p>
              <p>{alert.situation}</p>
            </div>
          </Popup>
          <m.div className="w-8 h-10 bg-red-600 rounded-full shadow-lg" variants={dropVariants} initial="hidden" animate="visible" />
        </Marker>
      ))}

      {newestAlert && (
        <Marker position={[newestAlert.latitude, newestAlert.longitude]} icon={BlankIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{newestAlert.emergency_type}</p>
              <p>{newestAlert.situation}</p>
              <p className="text-xs text-red-600">Newest alert</p>
            </div>
          </Popup>
          <m.div
            className="w-10 h-12 bg-red-600 rounded-full shadow-lg"
            variants={{
              hidden: { y: -120, opacity: 0 },
              visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 20, repeat: Infinity, repeatType: "mirror" } },
            }}
            initial="hidden"
            animate="visible"
          />
        </Marker>
      )}
    </MapContainer>
  );
};

// -------------------------------
// Main App component
// -------------------------------
const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [session, setSession] = useState<any>(null);

  // Initialize AdMob
  useEffect(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false });
          console.log("✅ AdMob initialized successfully");
        } catch (err) {
          console.error("❌ AdMob init failed:", err);
        }
      }
    };
    initAdMob();
  }, []);

  // Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
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
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Auth Page */}
                <Route
                  path="/auth"
                  element={
                    <motion.div key="auth" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={{ duration: 0.3, ease: "easeInOut" }}>
                      <AuthSOS />
                    </motion.div>
                  }
                />

                {/* Home Page */}
                <Route
                  path="/home"
                  element={
                    <motion.div key="home" initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={{ duration: 0.3, ease: "easeInOut" }}>
                      {session ? <HomeWithLiveMap session={session} /> : <Navigate to="/auth" replace />}
                    </motion.div>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<motion.div key="notfound" initial="initial" animate="animate" exit="exit" variants={pageVariants}><div>404 Not Found</div></motion.div>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// -------------------------------
// Home page with live map & SOS logic
// -------------------------------
const HomeWithLiveMap = ({ session }: { session: any }) => {
  const [activeTab, setActiveTab] = useState("emergency");
  const [alerts, setAlerts] = useState<any[]>([]);
  const initialLocation = { lat: 14.5995, lng: 120.9842 }; // Default Manila

  useEffect(() => {
    // Load initial alerts
    supabase
      .from("emergency_alerts")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => data && setAlerts(data));

    // Real-time subscription
    const subscription = supabase
      .channel("realtime-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_alerts" }, (payload) => {
        setAlerts((prev) => [...prev, payload.new]);
        toast(`New emergency alert: ${payload.new.emergency_type}`);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Emergency Response PH</h1>
              <p className="text-sm opacity-90">Quick access to emergency services</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Logged out successfully");
            }}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Emergency
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Contacts
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Heart className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergency">
            <ActiveAlerts alerts={alerts} />
            <EmergencyForm onEmergencyClick={() => {}} userId={session.user.id} />
            <LocationMap alerts={alerts} initialLocation={initialLocation} />
          </TabsContent>

          <TabsContent value="contacts">
            <PersonalContacts userId={session.user.id} />
          </TabsContent>

          <TabsContent value="profile">
            <EmergencyProfile userId={session.user.id} />
          </TabsContent>

          <TabsContent value="history">
            <AlertHistory userId={session.user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default App;
