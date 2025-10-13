import { MapPin } from "lucide-react";

interface LocationMapProps {
  location: {
    lat: number;
    lng: number;
  };
}

const LocationMap = ({ location }: LocationMapProps) => {
  return (
    <div className="relative">
      {/* Map Preview - Using static map for now */}
      <div className="h-64 bg-muted relative overflow-hidden">
        <iframe
          title="Location Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${location.lat},${location.lng}&zoom=15&maptype=roadmap`}
        ></iframe>
        
        {/* Location Marker Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg animate-bounce">
            <MapPin className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-card p-4 border-t">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Your Location Detected</p>
            <p className="text-sm text-muted-foreground">
              Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Emergency services near you have been identified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
