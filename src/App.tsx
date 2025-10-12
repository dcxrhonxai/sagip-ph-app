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
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { toast } from "sonner";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { EmergencyForm } from "@/components/EmergencyForm";
import { PersonalContacts } from "@/components/PersonalContacts";
import { EmergencyProfile } from "@/components/EmergencyProfile";
import { AlertHistory } from "@/components/AlertHistory";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { useEmergencyNotifications } from "@/hooks/useEmergencyNotifications";

// Lazy-load Auth
const AuthSOS = lazy(() => import("./pages/AuthSOS"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Animation variants for pages
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Custom emergency icon
const emergencyIcon = new L.Icon({
  iconUrl: "/icons/marker-red.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [session, setSession] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("emergency");
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 14.5995, lng: 120.9842 });
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);

  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(session?.user?.id);
  const { sendNotifications } = useEmergencyNotifications();

  // -------------------------------
  // Initialize AdMob
  // -------------------------------
  useEffect(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false });
        } catch (err) {
          console.error("AdMob init failed:", err);
        }
      }
    };
    initAdMob();
  }, []);

  // -------------------------------
  // Show banner on home
  // -------------------------------
  useEffect(() => {
    const showBanner = async () => {
      if (Capacitor.isNativePlatform() && activeTab === "emergency" && !showEmergency) {
        try {
          await AdMob.showBanner({
            adId: "ca-app-pub-4211898333188674/1234567890",
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
          });
        } catch (err) {
          console.warn("Banner error:", err);
        }
      } else {
        await AdMob.removeBanner();
      }
    };
    showBanner();
    return () => AdMob.removeBanner().catch(() => {});
  }, [activeTab, showEmergency]);

  // -------------------------------
  // Auth check (prevent flash)
  // -------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsAuthChecked(true);
      if (!session) return;
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // -------------------------------
  // Quick SOS handler
  // -------------------------------
  const handleQuickSOS = async () => {
    if (!session?.user) return;
    const quickType = "🚨 EMERGENCY - SOS";
    const quickSituation = "Quick SOS activated - Immediate help needed";
    setEmergencyType(quickType);
    setSituation(quickSituation);
    setShowEmergency(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(location);
        const { data, error } = await supabase.from("emergency_alerts").insert({
          user_id: session.user.id,
          emergency_type: quickType,
          situation: quickSituation,
          latitude: location.lat,
          longitude: location.lng,
          evidence_files: [],
        }).select().single();

        if (data) setCurrentAlertId(data.id);
        if (error) console.error(error);

        // Notify personal contacts
        const { data: contacts } = await supabase.from("personal_contacts").select("name, phone").eq("user_id", session.user.id);
        if (contacts && contacts.length) {
          await sendNotifications(data.id, contacts.map(c => ({ name: c.name, phone: c.phone })), quickType, quickSituation, location, []);
        }
      },
      () => toast.warning("Could not access location. Using default location.")
    );
  };

  // -------------------------------
  // LocationMap with animated pins
  // -------------------------------
  const LocationMap = ({ alerts, initialLocation }: { alerts: any[]; initialLocation: { lat: number; lng: number } }) => {
    const [displayedAlerts, setDisplayedAlerts] = useState<any[]>([]);
    useEffect(() => {
      alerts.forEach((alert, i) => {
        if (!displayedAlerts.find(a => a.id === alert.id)) {
          setTimeout(() => setDisplayedAlerts(prev => [...prev, alert]), i * 150);
        }
      });
    }, [alerts, displayedAlerts]);

    const newestAlert = displayedAlerts[displayedAlerts.length - 1];

    return (
      <MapContainer center={initialLocation} zoom={15} scrollWheelZoom className="w-full h-96 rounded-lg shadow-md">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {displayedAlerts.map(alert => (
          <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={emergencyIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-bold">{alert.emergency_type}</p>
                <p>{alert.situation}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {newestAlert && (
          <Marker position={[newestAlert.latitude, newestAlert.longitude]} icon={emergencyIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-bold">{newestAlert.emergency_type}</p>
                <p>{newestAlert.situation}</p>
                <p className="text-xs text-red-600">Newest alert</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    );
  };

  if (!isAuthChecked) return null;
  if (!session) return <Navigate to="/auth" replace />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading...</div>}>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Auth */}
                <Route path="/auth" element={
                  <motion.div key="auth" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
                    <AuthSOS />
                  </motion.div>
                } />

                {/* Home */}
                <Route path="/home" element={
                  <motion.div key="home" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
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
                          <div className="flex gap-2">
                            <Button onClick={handleQuickSOS} variant="destructive">SOS</Button>
                            <Button variant="ghost" size="icon" onClick={async () => {
                              await supabase.auth.signOut();
                              toast.success("Logged out");
                            }}>
                              <LogOut className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </header>

                      <main className="container mx-auto px-4 py-6 max-w-2xl">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="emergency" className="flex items-center gap-2"><Shield className="w-4 h-4" />Emergency</TabsTrigger>
                            <TabsTrigger value="contacts" className="flex items-center gap-2">Contacts</TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">Profile</TabsTrigger>
                            <TabsTrigger value="history" className="flex items-center gap-2">History</TabsTrigger>
                          </TabsList>

                          <TabsContent value="emergency">
                            {!alertsLoading && alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
                            <EmergencyForm onEmergencyClick={handleQuickSOS} userId={session.user.id} />
                            {userLocation && <LocationMap alerts={alerts} initialLocation={userLocation} />}
                          </TabsContent>

                          <TabsContent value="contacts"><PersonalContacts userId={session.user.id} /></TabsContent>
                          <TabsContent value="profile"><EmergencyProfile userId={session.user.id} /></TabsContent>
                          <TabsContent value="history"><AlertHistory userId={session.user.id} /></TabsContent>
                        </Tabs>
                      </main>
                    </div>
                  </motion.div>
                } />

                {/* 404 */}
                <Route path="*" element={
                  <motion.div key="notfound" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
                    <NotFound />
                  </motion.div>
                } />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
