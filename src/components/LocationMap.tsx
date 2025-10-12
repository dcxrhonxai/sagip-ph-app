import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion } from "framer-motion";

// Custom empty icon because we'll render marker with motion div
const BlankIcon = new L.DivIcon({ className: "custom-marker" });

// Motion variants for “drop + bounce”
const dropVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 500, damping: 25 } },
};

export const LocationMap = ({
  alerts,
  initialLocation,
}: {
  alerts: any[];
  initialLocation: { lat: number; lng: number };
}) => {
  const [displayedAlerts, setDisplayedAlerts] = useState<any[]>([]);

  // Stagger alerts with a slight delay for pin-drop effect
  useEffect(() => {
    alerts.forEach((alert, i) => {
      if (!displayedAlerts.find((a) => a.id === alert.id)) {
        setTimeout(() => setDisplayedAlerts((prev) => [...prev, alert]), i * 200);
      }
    });
  }, [alerts, displayedAlerts]);

  const newestAlert = displayedAlerts[displayedAlerts.length - 1];

  return (
    <MapContainer center={initialLocation} zoom={15} scrollWheelZoom className="w-full h-96 rounded-lg shadow-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {displayedAlerts.map((alert) => (
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={BlankIcon} // use motion div
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{alert.emergency_type}</p>
              <p>{alert.situation}</p>
            </div>
          </Popup>
          <motion.div
            className="w-8 h-10 bg-red-600 rounded-full shadow-lg"
            variants={dropVariants}
            initial="hidden"
            animate="visible"
          />
        </Marker>
      ))}

      {newestAlert && (
        <Marker
          position={[newestAlert.latitude, newestAlert.longitude]}
          icon={BlankIcon}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{newestAlert.emergency_type}</p>
              <p>{newestAlert.situation}</p>
              <p className="text-xs text-red-600">Newest alert</p>
            </div>
          </Popup>
          <motion.div
            className="w-10 h-12 bg-red-600 rounded-full shadow-lg"
            variants={{
              hidden: { y: -120, opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
                transition: { type: "spring", stiffness: 500, damping: 20, repeat: Infinity, repeatType: "mirror" },
              },
            }}
            initial="hidden"
            animate="visible"
          />
        </Marker>
      )}
    </MapContainer>
  );
};
