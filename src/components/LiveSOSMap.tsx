import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/lib/supabaseClient";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SOSAlert {
  id: string;
  emergency_type: string;
  situation: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export const LiveSOSMap = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    // Fetch initial alerts
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from<SOSAlert>("emergency_alerts")
        .select("*")
        .eq("status", "active");
      if (error) console.error(error);
      else setAlerts(data || []);
    };
    fetchAlerts();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel("realtime-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "emergency_alerts" },
        (payload) => {
          setAlerts((prev) => [...prev, payload.new]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "emergency_alerts" },
        (payload) => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? payload.new : a))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <MapContainer
      center={[14.5995, 120.9842]} // Manila as default center
      zoom={12}
      scrollWheelZoom
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {alerts.map((alert) => (
        <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
          <Popup>
            <strong>{alert.emergency_type}</strong>
            <br />
            {alert.situation}
            <br />
            <small>{new Date(alert.created_at).toLocaleString()}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
