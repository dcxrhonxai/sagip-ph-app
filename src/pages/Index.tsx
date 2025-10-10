// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { initAdMob } from "@/integrations/admob";
import EmergencyForm from "@/components/EmergencyForm";
import LocationMap from "@/components/LocationMap";
import PersonalContacts from "@/components/PersonalContacts";
import AlertHistory from "@/components/AlertHistory";
import { ActiveAlerts } from "@/components/ActiveAlerts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("alerts");

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
