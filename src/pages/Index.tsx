import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";
import { useEmergencyNotifications } from "@/hooks/useEmergencyNotifications";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";

interface IndexProps {
  session: Session;
}

const Index = ({ session }: IndexProps) => {
  const navigate = useNavigate();
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("emergency");

  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(session.user.id);
  const { sendNotifications } = useEmergencyNotifications();

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
  // Show banner ad on emergency tab
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

            {/* Emergency Tab */}
            <TabsContent value="emergency">
              {!alertsLoading && alerts.length > 0 && <ActiveAlerts alerts={alerts} />}
              <EmergencyForm onEmergencyClick={() => {}} userId={session.user.id} />
              {userLocation && <LocationMap location={userLocation} />}
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
          <div>{/* Active emergency UI (map + contacts) */}</div>
        )}
      </main>
    </div>
  );
};

export default Index;
