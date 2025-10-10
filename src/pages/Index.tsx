// src/pages/Index.tsx
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
import { useEmergencyNotifications } from '@/hooks/useEmergencyNotifications';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { Shield, LogOut, History, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';

// ✅ Your actual Index page component
export default function Index() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('alerts');

  // Initialize AdMob on mount
  useEffect(() => {
    initAdMob();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-red-500" /> Sagip PH
        </h1>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          <LogOut className="mr-2 w-4 h-4" /> Logout
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 gap-2">
          <TabsTrigger value="alerts">Active</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <ActiveAlerts />
        </TabsContent>

        <TabsContent value="contacts">
          <PersonalContacts />
        </TabsContent>

        <TabsContent value="history">
          <AlertHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
