import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useEmergencyNotifications } from "@/hooks/useEmergencyNotifications";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";

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

interface Props {
  session: Session;
}

const Index = ({ session }: Props) => {
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState("emergency");
  const { sendNotifications } = useEmergencyNotifications();

  // -------------------------------
  // AdMob (native)
  // -------------------------------
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false }).catch(console.error);
    }
  }, []);

  // -------------------------------
  // Initial location & alerts
  // -------------------------------
  useEffect(() => {
    const loadInitialData = async () => {
      // User location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setUserLocation({ lat: 14.5995, lng: 120.9842 }) // Manila fallback
        );
      } else {
        setUserLocation({ lat: 14.5995, lng: 120.9842 });
      }

      // Initial alerts
      const { data } = await supabase
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setAlerts(data);
    };

    loadInitialData();
  }, []);

  // -------------------------------
  // Realtime subscription
  // -------------------------------
  useEffect(() => {
    const subscription = supabase
      .from("emergency_alerts")
      .on("INSERT", (payload) => setAlerts((prev) => [payload.new, ...prev]))
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, []);

  // -------------------------------
  // Quick SOS
  // -------------------------------
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

    if (data) {
      // Notify personal contacts
      const { data: contacts } = await supabase
        .from("personal_contacts")
        .select("name, phone")
        .eq("user_id", session.user.id);

      if (contacts && contacts.length > 0) {
        await sendNotifications(
          data.id,
          contacts.map((c) => ({ name: c.name, phone: c.phone })),
          data.emergency_type,
          data.situation,
          userLocation
        );
      }
    }
  };

  // -------------------------------
  // Map marker animation variants
  // -------------------------------
  const markerVariants = {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 30 } },
  };

  const newestAlertId = alerts[0]?.id;

  // -------------------------------
  // Render
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
              navigate("/auth", { replace: true });
              toast.success("Logged out successfully");
            }}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main */}
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

          <TabsContent value="emergency" className="space-y-4">
            {alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
            <EmergencyForm onEmergencyClick={() => {}} userId={session.user.id} />

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
                      variants={markerVariants}
                      initial="initial"
                      animate="animate"
                      exit={{ opacity: 0 }}
                    >
                      <Marker
                        position={[alert.latitude, alert.longitude]}
                        icon={
                          alert.id === newestAlertId
                            ? new L.Icon({
                                iconUrl: require("@/assets/pulse-pin.png"), // custom pulsing pin
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

export default Index;
