import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";

// Custom emergency icon
const emergencyIcon = new L.Icon({
  iconUrl: "/icons/marker-red.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

const AnimatedMarkers = ({ alerts }: { alerts: any[] }) => {
  const [displayedAlerts, setDisplayedAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Animate each new alert with delay
    alerts.forEach((alert, index) => {
      if (!displayedAlerts.find((a) => a.id === alert.id)) {
        setTimeout(() => {
          setDisplayedAlerts((prev) => [...prev, alert]);
        }, index * 150); // staggered entry: 150ms per pin
      }
    });
  }, [alerts, displayedAlerts]);

  return (
    <AnimatePresence>
      {displayedAlerts.map((alert, index) => (
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={emergencyIcon}
          eventHandlers={{
            add: (e) => {
              // optional: do something when marker added
            },
          }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{alert.emergency_type}</p>
              <p>{alert.situation}</p>
              <p className="text-xs text-gray-500">Reported by: {alert.user_id}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </AnimatePresence>
  );
};

const LocationMap = ({ alerts, initialLocation }: { alerts: any[]; initialLocation: { lat: number; lng: number } }) => {
  const newestAlert = alerts[alerts.length - 1];

  return (
    <MapContainer center={initialLocation} zoom={15} scrollWheelZoom={true} className="w-full h-96 rounded-lg shadow-md">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Animate all pins dropping in */}
      <AnimatedMarkers alerts={alerts} />

      {/* Highlight newest pin */}
      {newestAlert && (
        <Marker
          position={[newestAlert.latitude, newestAlert.longitude]}
          icon={emergencyIcon}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          />
          <Popup>
            <div className="space-y-1">
              <p className="font-bold">{newestAlert.emergency_type}</p>
              <p>{newestAlert.situation}</p>
              <p className="text-xs text-gray-500">Newest alert</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default LocationMap;
