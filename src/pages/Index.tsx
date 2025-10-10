import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DEFAULT_LAT, DEFAULT_LNG } from '@/integrations/supabase/client';
import { initAdMob } from '@/integrations/admob';
import EmergencyForm from '@/components/EmergencyForm';
import LocationMap from '@/components/LocationMap';
import PersonalContacts from '@/components/PersonalContacts';
import AlertHistory from '@/components/AlertHistory';
import { ActiveAlerts } from '@/components/ActiveAlerts';
import { EmergencyProfile } from '@/components/EmergencyProfile';
import { AudioRecorder } from '@/components/AudioRecorder';
import { CameraCapture } from '@/components/CameraCapture';
import { VideoRecorder } from '@/components/VideoRecorder';
import { Shield, LogOut, History, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { useEmergencyNotifications } from '@/hooks/useEmergencyNotifications';
import type { Session } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState('');
  const [situation, setSituation] = useState('');
  const [currentAlertId, setCurrentAlertId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('emergency');

  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastVideo, setLastVideo] = useState<string | null>(null);

  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(session?.user?.id);
  const { sendNotifications } = useEmergencyNotifications();

  // Initialize AdMob
  useEffect(() => {
    initAdMob();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/auth');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/auth');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleQuickSOS = async () => {
    handleEmergencyClick('🚨 EMERGENCY - SOS', 'Quick SOS activated - Immediate help needed');
  };

  const handleEmergencyClick = async (type: string, description: string, evidenceFiles?: any[]) => {
    setEmergencyType(type);
    setSituation(description);
    setShowEmergency(true);

    const location = userLocation ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    setUserLocation(location);

    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
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
      if (error) console.error('Error saving alert:', error);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = async () => {
    if (currentAlertId) {
      await supabase
        .from('emergency_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', currentAlertId);
    }
    setShowEmergency(false);
    setUserLocation(null);
    setCurrentAlertId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  if (!session) return null;

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
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

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

              {/* Media Capture Components */}
              <div className="space-y-4 mt-6">
                <AudioRecorder onRecordingComplete={setLastAudio} />
                <CameraCapture onPhotoCapture={setLastPhoto} />
                <VideoRecorder onVideoComplete={setLastVideo} />
              </div>

              {/* Media Preview Section */}
              <div className="mt-6 space-y-4">
                {lastAudio && (
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <p className="font-semibold">Last Recorded Audio:</p>
                    <audio src={lastAudio} controls className="w-full mt-2" />
                  </div>
                )}
                {lastPhoto && (
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <p className="font-semibold">Last Captured Photo:</p>
                    <img src={lastPhoto} alt="Captured" className="w-full mt-2 rounded-lg" />
                  </div>
                )}
                {lastVideo && (
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <p className="font-semibold">Last Recorded Video:</p>
                    <video src={lastVideo} controls className="w-full mt-2 rounded-lg" />
                  </div>
                )}
              </div>
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
              <p className="mb-2">
                <strong>Type:</strong> {emergencyType}
              </p>
              <p className="mb-4">
                <strong>Situation:</strong> {situation}
              </p>
              <button
                onClick={handleBack}
                className="bg-primary-foreground text-primary px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                Cancel Alert
              </button>
            </div>

            {userLocation && <LocationMap location={userLocation} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
