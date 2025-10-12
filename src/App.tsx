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
import ContactList from "@/components/ContactList";
import PersonalContacts from "@/components/PersonalContacts";
import AlertHistory from "@/components/AlertHistory";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { EmergencyProfile } from "@/components/EmergencyProfile";
import { Shield, LogOut, Heart, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { useEmergencyNotifications } from "@/hooks/useEmergencyNotifications";
import type { Session } from "@supabase/supabase-js";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Lazy load Auth page
const AuthSOS = lazy(() => import("./pages/AuthSOS"));

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Custom icon for emergencies
const emergencyIcon = new L.Icon({
  iconUrl: "/icons/marker-red.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("emergency");
  const [initialLocation, setInitialLocation] = useState({ lat: 14.5995, lng: 120.9842 });
  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(session?.user?.id);
  const { sendNotifications } = useEmergencyNotifications();

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
          console.log("✅ AdMob initialized");
        } catch (err) {
          console.error("AdMob init failed:", err);
        }
      }
    };
    initAdMob();
  }, []);

  // -------------------------------
  // Auth session check
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
  // AdMob banner on home tab
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
          console.warn(err);
        }
      } else {
        await AdMob.removeBanner();
      }
    };
    showBanner();
    return () => AdMob.removeBanner().catch(() => {});
  }, [activeTab, showEmergency]);

  // -------------------------------
  // Quick SOS / Emergency handler
  // -------------------------------
  const handleEmergencyClick = async (type: string, description: string, evidenceFiles?: any[]) => {
    setEmergencyType(type);
    setSituation(description);
    setShowEmergency(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);

          if (session?.user) {
            const { data, error } = await supabase
              .from("emergency_alerts")
              .insert({
                user_id: session.user.id,
                emergency_type: type,
                situation: description,
                latitude: location.lat,
                longitude: location.lng,
                evidence_files: evidenceFiles || [],
              })
              .select()
              .single();

            if (data) setCurrentAlertId(data.id);
            if (error) console.error("Error saving alert:", error);

            // Send notifications to personal contacts
            const { data: contacts } = await supabase
              .from("personal_contacts")
              .select("name, phone")
              .eq("user_id", session.user.id);

            if (contacts && contacts.length > 0) {
              const formattedContacts = contacts.map((c) => ({
                name: c.name,
                phone: c.phone,
                email: session.user.email ? session.user.email : undefined,
              }));
              await sendNotifications(
                data.id,
                formattedContacts,
                type,
                description,
                location,
                evidenceFiles?.map((f) => ({ url: f.url, type: f.type }))
              );
            }
          }
        },
        () => {
          const defaultLocation = { lat: 14.5995, lng: 120.9842 };
          setUserLocation(defaultLocation);
          toast.warning("Could not access your location. Using default location.");
        }
      );
    }
  };

  const handleQuickSOS = () => {
    handleEmergencyClick("🚨 EMERGENCY - SOS", "Quick SOS activated - Immediate help needed");
  };

  const handleBack = async () => {
    if (currentAlertId) {
      await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", currentAlertId);
    }
    setShowEmergency(false);
    setUserLocation(null);
    setCurrentAlertId(null);
  };

  if (!isAuthChecked) return null;

  // -------------------------------
  // Home page JSX (fully merged)
  // -------------------------------
  const HomePage = () => (
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
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!showEmergency ? (
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
              {!alertsLoading && alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
              <EmergencyForm onEmergencyClick={handleQuickSOS} userId={session.user.id} />

              {userLocation && (
                <MapContainer
                  center={userLocation}
                  zoom={15}
                  scrollWheelZoom={true}
                  className="w-full h-96 rounded-lg shadow-md"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {alerts.map((alert) => (
                    <Marker
                      key={alert.id}
                      position={[alert.latitude, alert.longitude]}
                      icon={emergencyIcon}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-bold">{alert.emergency_type}</p>
                          <p>{alert.situation}</p>
                          <p className="text-xs text-gray-500">Reported by: {alert.user_id}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
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
        ) : (
          <div>
            {/* Active emergency UI (map + contacts) */}
            <p>Emergency active! Map and contacts displayed here.</p>
            <Button onClick={handleBack}>End Emergency</Button>
          </div>
        )}
      </main>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Router>
          <Suspense
            fallback={
              <div className="text-center mt-10 text-gray-500">Loading page...</div>
            }
          >
            <AnimatePresence mode="wait">
              <Routes>
                {/* Root redirect */}
                <Route
                  path="/"
                  element={
                    session ? (
                      <Navigate to="/home" replace />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />

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

                {/* Home page */}
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
                        <HomePage />
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
                      <div className="text-center mt-20 text-gray-500">
                        404 - Page not found
                      </div>
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
