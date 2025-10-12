import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

interface Alert {
  id: string;
  emergency_type: string;
  situation: string;
  latitude: number;
  longitude: number;
}

interface LocationMapProps {
  location: { lat: number; lng: number };
  alerts: Alert[];
  onAlertUpdate?: (alerts: Alert[]) => void;
}

const highlightIcon = new L.Icon({
  iconUrl: "/icons/pin-new.svg",
  iconSize: [35, 45],
  iconAnchor: [17, 45],
});

const normalIcon = new L.Icon({
  iconUrl: "/icons/pin.svg",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

const FlyToLatest = ({ position }: { position: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([position.lat, position.lng], map.getZoom());
  }, [position, map]);
  return null;
};

const LocationMap = ({ location, alerts, onAlertUpdate }: LocationMapProps) => {
  const latestAlert = alerts.length > 0 ? alerts[0] : null;
  const mapRef = useRef<any>(null);

  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={15}
      style={{ height: "400px", width: "100%" }}
      whenCreated={(map) => (mapRef.current = map)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Animate each alert marker */}
      {alerts.map((alert) => (
        <Marker
          key={alert.id}
          position={[alert.latitude, alert.longitude]}
          icon={alert.id === latestAlert?.id ? highlightIcon : normalIcon}
        >
          <Popup>
            <strong>{alert.emergency_type}</strong>
            <p>{alert.situation}</p>
          </Popup>
        </Marker>
      ))}

      {/* Animate the newest alert */}
      {latestAlert && (
        <motion.div
          key={latestAlert.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1.5 }}
          transition={{ duration: 0.5, yoyo: Infinity }}
        />
      )}

      {/* Fly to the newest alert automatically */}
      {latestAlert && <FlyToLatest position={{ lat: latestAlert.latitude, lng: latestAlert.longitude }} />}
    </MapContainer>
  );
};

export default LocationMap;
