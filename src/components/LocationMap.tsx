import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

export interface AlertMarker {
  id: string;
  lat: number;
  lng: number;
  emergencyType: string;
  situation: string;
  createdAt: string;
}

interface LocationMapProps {
  initialLocation: { lat: number; lng: number } | [number, number];
  initialAlerts: AlertMarker[];
}

const LocationMap = ({ initialLocation, initialAlerts }: LocationMapProps) => {
  const [alerts, setAlerts] = useState<AlertMarker[]>(initialAlerts);

  // Track the newest alert ID to pulse/highlight
  const newestAlertId = alerts.length > 0 ? alerts[alerts.length - 1].id : null;

  // Handle animated pin drop for new alerts
  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  // Default Leaflet icon fix
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const mapCenter =
    Array.isArray(initialLocation) ? { lat: initialLocation[0], lng: initialLocation[1] } : initialLocation;

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ width: "100%", height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {alerts.map((alert) => {
        const isNewest = alert.id === newestAlertId;

        return (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{alert.emergencyType}</strong>
              <br />
              {alert.situation}
              <br />
              {new Date(alert.createdAt).toLocaleTimeString()}
            </Popup>

            {isNewest && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                style={{
                  position: "absolute",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,0,0,0.3)",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  zIndex: 1000,
                }}
              />
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default LocationMap;
