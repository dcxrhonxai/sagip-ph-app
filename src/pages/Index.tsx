import { useState } from "react";
import EmergencyForm from "@/components/EmergencyForm";
import LocationMap from "@/components/LocationMap";
import ContactList from "@/components/ContactList";
import ShareLocation from "@/components/ShareLocation";
import PersonalContacts from "@/components/PersonalContacts";
import AlertHistory from "@/components/AlertHistory";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { EmergencyProfile } from "@/components/EmergencyProfile";
import { Shield, LogOut, Users, History, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { useEmergencyNotifications } from "@/hooks/useEmergencyNotifications";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";

export interface EmergencyContact {
  id: string;
  name: string;
  type: string;
  phone: string;
  distance?: string;
  isNational?: boolean;
}

interface IndexProps {
  session: Session;
}

const Index = ({ session }: IndexProps) => {
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("emergency");
  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(session.user.id);
  const { sendNotifications } = useEmergencyNotifications();

  // ✅ Initialize AdMob safely (native only)
  useState(() => {
    const initAdMob = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false });
          console.log("✅ AdMob initialized on native platform");
        } catch (err) {
          console.error("AdMob init failed:", err);
        }
      }
    };
    initAdMob();
  });

  const handleQuickSOS = async () => {
    const quickType = "🚨 EMERGENCY - SOS";
    const quickSituation = "Quick SOS activated - Immediate help needed";
    handleEmergencyClick(quickType, quickSituation);
  };

  const handleEmergencyClick = async (type: string, description: string, evidenceFiles?: any[]) => {
    setEmergencyType(type);
    setSituation(description);
    setShowEmergency(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);

          // Insert alert into Supabase
          const { supabase } = await import("@/integrations/supabase/client");
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
        },
        (error) => {
          console.error("Error getting location:", error);
          const defaultLocation = { lat: 14.5995, lng: 120.9842 };
          setUserLocation(defaultLocation);
          toast.warning("Could not access your location. Using default location.");
        }
      );
    } else {
      setUserLocation({ lat: 14.5995, lng: 120.9842 });
      toast.warning("Geolocation not supported. Using default location.");
    }
  };

  const handleBack = async () => {
    if (currentAlertId) {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", currentAlertId);
    }
    setShowEmergency(false);
    setUserLocation(null);
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
              {!alertsLoading && alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
              <div className="mb-6">
                <Button
                  onClick={handleQuickSOS}
                  className="w-full h-32 text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse"
                  size="lg"
                >
                  🚨 SOS
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Tap for instant emergency alert
                </p>
              </div>
              <EmergencyForm onEmergencyClick={handleEmergencyClick} userId={session.user.id} />
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
              <h2 className="text-xl font-bold mb-2">Emergency Alert Active</h2>
              <p className="mb-2"><strong>Type:</strong> {emergencyType}</p>
              <p className="mb-4"><strong>Situation:</strong> {situation}</p>
              <button
                onClick={handleBack}
                className="bg-primary-foreground text-primary px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                Cancel Alert
              </button>
            </div>

            {userLocation && <LocationMap location={userLocation} />}

            <ContactList emergencyType={emergencyType} userLocation={userLocation} />

            {userLocation && <ShareLocation userId={session.user.id} location={userLocation} situation={situation} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
