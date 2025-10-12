import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface AlertMarker {
  id: string;
  lat: number;
  lng: number;
  emergencyType: string;
  situation: string;
  createdAt: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("emergency");
  const [alerts, setAlerts] = useState<AlertMarker[]>([]);
  const { sendNotifications } = useEmergencyNotifications();

  // -------------------------------
  // Auth check & redirect if not logged in
  // -------------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsAuthChecked(true);
      if (!session) navigate("/auth", { replace: true });
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/auth", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // -------------------------------
  // Real-time alerts subscription
  // -------------------------------
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`realtime-emergency-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_alerts" },
        (payload) => {
          const newAlert = payload.new as AlertMarker;
          setAlerts((prev) => [...prev, newAlert]);
        }
      )
      .subscribe();

    // Load initial alerts
    supabase
      .from<AlertMarker>("emergency_alerts")
      .select("*")
      .order("createdAt", { ascending: true })
      .then(({ data }) => {
        if (data) setAlerts(data);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // -------------------------------
  // Initialize AdMob (native only)
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
  // Show banner ad on home tab only
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
        } catch (err) {}
      } else {
        await AdMob.removeBanner();
      }
    };
    showBanner();
    return () => AdMob.removeBanner().catch(() => {});
  }, [activeTab, showEmergency]);

  // -------------------------------
  // Quick SOS handler
  // -------------------------------
  const handleQuickSOS = async () => {
    const quickType = "🚨 EMERGENCY - SOS";
    const quickSituation = "Quick SOS activated - Immediate help needed";
    handleEmergencyClick(quickType, quickSituation);
  };

  const handleEmergencyClick = async (type: string, description: string, evidenceFiles?: any[]) => {
    setEmergencyType(type);
    setSituation(description);
    setShowEmergency(true);

    if (!session?.user) return;

    const location = userLocation ?? { lat: 14.5995, lng: 120.9842 };
    setUserLocation(location);

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

    if (error) console.error(error);

    // Notify personal contacts
    const { data: contacts } = await supabase
      .from("personal_contacts")
      .select("name, phone")
      .eq("user_id", session.user.id);

    if (contacts && contacts.length > 0) {
      const formattedContacts = contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: session.user.email ?? undefined,
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
  };

  // -------------------------------
  // Wait for auth check before rendering
  // -------------------------------
  if (!isAuthChecked) return null;

  // -------------------------------
  // Leaflet default icon
  // -------------------------------
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const newestAlertId = alerts.length > 0 ? alerts[alerts.length - 1].id : null;

  // -------------------------------
  // Render /home page
  // -------------------------------
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
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {!showEmergency ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="emergency" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Emergency
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emergency">
              {alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
              <Button
                onClick={handleQuickSOS}
                className="w-full h-24 text-2xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse mb-4"
              >
                SOS
              </Button>
              <EmergencyForm onEmergencyClick={handleEmergencyClick} userId={session.user.id} />

              {/* Animated Live Map */}
              <MapContainer
                center={userLocation ?? { lat: 14.5995, lng: 120.9842 }}
                zoom={13}
                style={{ width: "100%", height: "500px", borderRadius: 12 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {alerts.map((alert, index) => {
                  const isNewest = alert.id === newestAlertId;
                  return (
                    <Marker key={alert.id} position={[alert.lat, alert.lng]} icon={defaultIcon}>
                      <Popup>
                        <strong>{alert.emergencyType}</strong>
                        <br />
                        {alert.situation}
                        <br />
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </Popup>

                      {/* Pin Drop Animation */}
                      <motion.div
                        initial={{ y: -50, scale: 0.5, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                        style={{
                          position: "absolute",
                          width: 25,
                          height: 41,
                          transform: "translate(-50%, -100%)",
                          pointerEvents: "none",
                          zIndex: 1000,
                        }}
                      >
                        {isNewest && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                            style={{
                              position: "absolute",
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              backgroundColor: "rgba(255,0,0,0.3)",
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              zIndex: 999,
                            }}
                          />
                        )}
                      </motion.div>
                    </Marker>
                  );
                })}
              </MapContainer>
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
          <div>{/* Active emergency view */}</div>
        )}
      </main>
    </div>
  );
};

export default Index;
