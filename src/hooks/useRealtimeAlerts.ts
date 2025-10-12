// src/hooks/useRealtimeAlerts.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmergencyAlert {
  id: string;
  user_id: string;
  emergency_type: string;
  situation: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export const useRealtimeAlerts = (userId?: string) => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    const fetchInitialAlerts = async () => {
      const { data, error } = await supabase
        .from<EmergencyAlert>("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) setAlerts(data);
      setIsLoading(false);
    };

    fetchInitialAlerts();

    // Subscribe to Realtime changes
    subscription = supabase
      .channel("public:emergency_alerts")
      .on(
        "postgres_changes",
        {
          event: "*", // insert, update, delete
          schema: "public",
          table: "emergency_alerts",
        },
        (payload) => {
          const newAlert = payload.new as EmergencyAlert;

          setAlerts((prev) => {
            switch (payload.eventType) {
              case "INSERT":
                return [newAlert, ...prev];
              case "UPDATE":
                return prev.map((a) => (a.id === newAlert.id ? newAlert : a));
              case "DELETE":
                return prev.filter((a) => a.id !== payload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [userId]);

  return { alerts, isLoading };
};
