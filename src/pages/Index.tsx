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

// ✅ Correct import for your push notifications
import { initPushService } from '@/services/pushService';
