import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import type { LatLngExpression } from "leaflet";

export interface AlertMarker {
  id: string;
  lat: number;
  lng: number;
  emergencyType: string;
  situation: string;
  createdAt: string;
}

interface LocationMapProps {
  initialLocation?: LatLngExpression;
  initialAlerts?: AlertMarker[];
}

const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -35],
});

const AnimateMarker = ({ alert }: { alert: AlertMarker }) => {
  const map = useMap();
  const [position, setPosition] = useState<LatLngExpression>([alert.lat, alert.lng]);

  // Pan map to new marker if it's the newest alert
  useEffect(() => {
    map.flyTo([alert.lat, alert.lng], map.getZoom());
  }, [alert.lat, alert.lng, map]);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Marker position={position} icon={markerIcon}>
        <Popup>
          <strong>{alert.emergencyType}</strong>
          <br />
          {alert.situation}
        </Popup>
      </Marker>
    </motion.div>
  );
};

const LocationMap = ({ initialLocation = [14.5995, 120.9842], initialAlerts = [] }: LocationMapProps) => {
  const [alerts, setAlerts] = useState<AlertMarker[]>(initialAlerts);

  // Example: Subscribe to real-time updates
  useEffect(() => {
    // Replace this with your Supabase subscription
    const fakeRealtime = setInterval(() => {
      const newAlert: AlertMarker = {
        id: Date.now().toString(),
        lat: 14.5995 + Math.random() * 0.01,
        lng: 120.9842 + Math.random() * 0.01,
        emergencyType: "🚨 SOS",
        situation: "New emergency detected",
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [...prev, newAlert]);
    }, 8000);

    return () => clearInterval(fakeRealtime);
  }, []);

  return (
    <MapContainer center={initialLocation} zoom={14} className="w-full h-96 rounded-lg shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AnimatePresence>
        {alerts.map((alert) => (
          <AnimateMarker key={alert.id} alert={alert} />
        ))}
      </AnimatePresence>
    </MapContainer>
  );
};

export default LocationMap;
