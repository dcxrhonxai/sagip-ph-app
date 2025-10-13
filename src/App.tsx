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

// -------------------------------
// Lazy-loaded pages/components
// -------------------------------
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const EmergencyForm = lazy(() => import("@/components/EmergencyForm"));
const PersonalContacts = lazy(() => import("@/components/PersonalContacts"));
const AlertHistory = lazy(() => import("@/components/AlertHistory"));
const ActiveAlerts = lazy(() => import("@/components/ActiveAlerts"));
const EmergencyProfile = lazy(() => import("@/components/EmergencyProfile"));

// -------------------------------
// Leaflet default marker fix
// -------------------------------
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

interface Alert {
  id: string;
  emergency_type: string;
  situation: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

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
// Main App
// -------------------------------
const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // -------------------------------
  // Check auth
  // -------------------------------
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setAuthChecked(true);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // -------------------------------
  // Loading screen while auth is checked
  // -------------------------------
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-lg opacity-80">Checking session...</p>
        </div>
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
// Animated Routes wrapper
// -------------------------------
const AnimatedRoutes = ({ session }: { session: Session | null }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/auth"
            element={
              <PageWrapper>
                {session ? <Navigate to="/home" replace /> : <AuthPage />}
              </PageWrapper>
            }
          />
          <Route
            path="/home"
            element={
              <PageWrapper>
                {session ? <Home session={session} /> : <Navigate to="/auth" replace />}
              </PageWrapper>
            }
          />
          <Route
            path="*"
            element={
              <PageWrapper>
                <Navigate to={session ? "/home" : "/auth"} replace />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

// -------------------------------
// PageWrapper for motion animation
// -------------------------------
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

// -------------------------------
// Home Component
// -------------------------------
interface HomeProps {
  session: Session;
}

const Home = ({ session }: HomeProps) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState("emergency");

  const newestAlertId = alerts[0]?.id;

  // AdMob init
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false }).catch(console.error);
    }
  }, []);

  // Initial location & alerts
  useEffect(() => {
    const loadInitialData = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setUserLocation({ lat: 14.5995, lng: 120.9842 })
        );
      } else {
        setUserLocation({ lat: 14.5995, lng: 120.9842 });
      }

      const { data } = await supabase
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setAlerts(data);
    };
    loadInitialData();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const sub = supabase
      .from("emergency_alerts")
      .on("INSERT", (payload) => setAlerts((prev) => [payload.new, ...prev]))
      .subscribe();

    return () => supabase.removeSubscription(sub);
  }, []);

  // Quick SOS
  const handleQuickSOS = async () => {
    if (!userLocation || !session?.user) return;

    const { data, error } = await supabase
      .from("emergency_alerts")
      .insert({
        user_id: session.user.id,
        emergency_type: "🚨 EMERGENCY - SOS",
        situation: "Quick SOS activated - Immediate help needed",
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      })
      .select()
      .single();

    if (error) return console.error(error);
  };

  // Marker animations
  const newestMarkerVariants = {
    animate: {
      scale: [1, 1.5, 1],
      opacity: [1, 0.7, 1],
      transition: { duration: 1.5, repeat: Infinity, repeatType: "loop" },
    },
  };

  const oldMarkerVariants = {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 25 } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <Button
          onClick={handleQuickSOS}
          className="w-full h-32 text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse"
        >
          🚨 SOS
        </Button>

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

          {/* Emergency */}
          <TabsContent value="emergency" className="space-y-4">
            {alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
            <Suspense fallback={<div>Loading form...</div>}>
              <EmergencyForm onEmergencyClick={() => {}} userId={session.user.id} />
            </Suspense>

            {userLocation && (
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                className="w-full h-[500px] rounded-lg shadow-lg"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial="initial"
                      animate={alert.id === newestAlertId ? "animate" : "animate"}
                      variants={alert.id === newestAlertId ? newestMarkerVariants : oldMarkerVariants}
                    >
                      <Marker
                        position={[alert.latitude, alert.longitude]}
                        icon={
                          alert.id === newestAlertId
                            ? new L.Icon({
                                iconUrl: require("@/assets/pulse-pin.png"),
                                iconSize: [35, 35],
                              })
                            : undefined
                        }
                      >
                        <Popup>
                          <strong>{alert.emergency_type}</strong>
                          <br />
                          {alert.situation}
                        </Popup>
                      </Marker>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </MapContainer>
            )}
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts">
            <Suspense fallback={<div>Loading contacts...</div>}>
              <PersonalContacts userId={session.user.id} />
            </Suspense>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <Suspense fallback={<div>Loading profile...</div>}>
              <EmergencyProfile userId={session.user.id} />
            </Suspense>
          </TabsContent>

          {/* History */}
          <TabsContent value="history">
            <Suspense fallback={<div>Loading history...</div>}>
              <AlertHistory userId={session.user.id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default App;
