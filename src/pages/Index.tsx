import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmergencyForm from "@/components/EmergencyForm";
import LocationMap from "@/components/LocationMap";
import ContactList from "@/components/ContactList";
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
import { supabase } from "@/integrations/supabase/client";

interface IndexProps {
  session: Session;
  initialLocation: { lat: number; lng: number };
  initialAlerts: any[];
}

const Index = ({ session, initialLocation, initialAlerts }: IndexProps) => {
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState(initialLocation);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("emergency");
  const [alerts, setAlerts] = useState(initialAlerts);

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
  // Show banner ad
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
        } catch (error) {
          console.warn("Banner error:", error);
        }
      } else {
        await AdMob.removeBanner();
      }
    };
    showBanner();
    return () => AdMob.removeBanner().catch(() => {});
  }, [activeTab, showEmergency]);

  // -------------------------------
  // Real-time subscription for alerts
  // -------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("realtime-alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_alerts",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAlerts((prev) => [payload.new, ...prev]);
            toast.success("New emergency alert received!");
          } else if (payload.eventType === "UPDATE") {
            setAlerts((prev) =>
              prev.map((a) => (a.id === payload.new.id ? payload.new : a))
            );
          } else if (payload.eventType === "DELETE") {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // -------------------------------
  // Quick SOS submission
  // -------------------------------
  const handleQuickSOS = async () => {
    const type = "🚨 EMERGENCY - SOS";
    const desc = "Quick SOS activated - Immediate help needed";
    handleEmergencyClick(type, desc);
  };

  const handleEmergencyClick = async (type: string, desc: string, evidenceFiles?: any[]) => {
    setEmergencyType(type);
    setSituation(desc);
    setShowEmergency(true);

    const location = userLocation;

    if (session?.user) {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .insert({
          user_id: session.user.id,
          emergency_type: type,
          situation: desc,
          latitude: location.lat,
          longitude: location.lng,
          evidence_files: evidenceFiles || [],
        })
        .select()
        .single();

      if (data) {
        setCurrentAlertId(data.id);

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
          await sendNotifications(data.id, formattedContacts, type, desc, location, evidenceFiles);
        }
      }

      if (error) console.error("Error saving alert:", error);
    }
  };

  const handleCancelEmergency = async () => {
    if (currentAlertId) {
      await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", currentAlertId);
    }
    setShowEmergency(false);
    setCurrentAlertId(null);
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
              navigate("/auth", { replace: true });
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
              {alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
              <EmergencyForm onEmergencyClick={handleEmergencyClick} userId={session.user.id} />
              {userLocation && (
                <LocationMap
                  location={userLocation}
                  alerts={alerts}
                  onAlertUpdate={setAlerts}
                />
              )}
              <Button
                onClick={handleQuickSOS}
                className="w-full h-32 text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse mt-4"
                size="lg"
              >
                🚨 SOS
              </Button>
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
          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-2">Emergency Active</h2>
              <p className="mb-2">
                <strong>Type:</strong> {emergencyType}
              </p>
              <p className="mb-4">
                <strong>Situation:</strong> {situation}
              </p>
              <Button
                onClick={handleCancelEmergency}
                className="bg-primary-foreground text-primary px-4 py-2 rounded-md font-semibold"
              >
                Cancel Alert
              </Button>
            </div>

            {userLocation && <LocationMap location={userLocation} alerts={alerts} onAlertUpdate={setAlerts} />}
            <ContactList emergencyType={emergencyType} userLocation={userLocation} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
