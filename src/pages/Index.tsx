import { useState } from "react";
import EmergencyForm from "@/components/EmergencyForm";
import LocationMap from "@/components/LocationMap";
import ContactList from "@/components/ContactList";
import { Shield } from "lucide-react";

export interface EmergencyContact {
  id: string;
  name: string;
  type: string;
  phone: string;
  distance?: string;
  isNational?: boolean;
}

const Index = () => {
  const [showEmergency, setShowEmergency] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");

  const handleEmergencyClick = (type: string, description: string) => {
    setEmergencyType(type);
    setSituation(description);
    setShowEmergency(true);
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to Manila coordinates if location access denied
          setUserLocation({ lat: 14.5995, lng: 120.9842 });
        }
      );
    } else {
      // Default to Manila coordinates if geolocation not supported
      setUserLocation({ lat: 14.5995, lng: 120.9842 });
    }
  };

  const handleBack = () => {
    setShowEmergency(false);
    setUserLocation(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Emergency Response PH</h1>
            <p className="text-sm opacity-90">Quick access to emergency services</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!showEmergency ? (
          <EmergencyForm onEmergencyClick={handleEmergencyClick} />
        ) : (
          <div className="space-y-6">
            {/* Emergency Alert */}
            <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-2">Emergency Alert Active</h2>
              <p className="mb-2">
                <strong>Type:</strong> {emergencyType}
              </p>
              <p className="mb-4">
                <strong>Situation:</strong> {situation}
              </p>
              <button
                onClick={handleBack}
                className="bg-primary-foreground text-primary px-4 py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                Cancel Alert
              </button>
            </div>

            {/* Location Map */}
            {userLocation && (
              <div className="bg-card rounded-lg shadow-lg overflow-hidden">
                <LocationMap location={userLocation} />
              </div>
            )}

            {/* Emergency Contacts */}
            <ContactList emergencyType={emergencyType} userLocation={userLocation} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
