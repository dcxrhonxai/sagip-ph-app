import { useState, useEffect, useCallback } from "react";
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
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import LocationMap, { AlertMarker } from "@/components/LocationMap";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("emergency");
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);

  // Live alerts state
  const [alerts, setAlerts] = useState<AlertMarker[]>([]);

  // -------------------------------
  // Auth check
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
  // Initialize AdMob
  // -------------------------------
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false }).catch(console.error);
    }
  }, []);

  // -------------------------------
  // Show banner ad only on emergency tab
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
  // Load initial alerts
  // -------------------------------
  const fetchInitialAlerts = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from("emergency_alerts")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) console.error(error);
    else setAlerts(data || []);
  }, [session]);

  useEffect(() => {
    fetchInitialAlerts();
  }, [fetchInitialAlerts]);

  // -------------------------------
  // Subscribe to real-time alerts
  // -------------------------------
  useEffect(() => {
    if (!session) return;

    const subscription = supabase
      .channel("public:emergency_alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emergency_alerts" }, (payload) => {
        const newAlert: AlertMarker = {
          id: payload.new.id,
          lat: payload.new.latitude,
          lng: payload.new.longitude,
          emergencyType: payload.new.emergency_type,
          situation: payload.new.situation,
          createdAt: payload.new.created_at,
        };
        setAlerts((prev) => [...prev, newAlert]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  // -------------------------------
  // Quick SOS
  // -------------------------------
  const handleQuickSOS = async () => {
    if (!session?.user) return;

    const type = "🚨 EMERGENCY - SOS";
    const situation = "Quick SOS activated - Immediate help needed";

    if (!navigator.geolocation) {
      toast.warning("Geolocation not supported. Using default location.");
      setUserLocation({ lat: 14.5995, lng: 120.9842 });
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);

        const { data, error } = await supabase
          .from("emergency_alerts")
          .insert({
            user_id: session.user.id,
            emergency_type: type,
            situation,
            latitude: location.lat,
            longitude: location.lng,
          })
          .select()
          .single();

        if (error) console.error(error);
        if (data) setCurrentAlertId(data.id);
      },
      (err) => {
        console.warn(err);
        setUserLocation({ lat: 14.5995, lng: 120.9842 });
      }
    );
  };

  if (!isAuthChecked) return null;

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
              toast.success("Logged out successfully");
            }}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
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
            <div className="mb-6">
              <ActiveAlerts alerts={alerts} />
            </div>
            <div className="mb-6">
              <Button
                onClick={handleQuickSOS}
                className="w-full h-32 text-3xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse"
              >
                🚨 SOS
              </Button>
            </div>
            {session && <EmergencyForm onEmergencyClick={handleQuickSOS} userId={session.user.id} />}
            <LocationMap initialLocation={userLocation || [14.5995, 120.9842]} initialAlerts={alerts} />
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
