import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Flame, Activity, Car, Home, Users, Camera, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { emergencyFormSchema } from "@/lib/validation";
import { MediaCapture } from "./MediaCapture";
import { UploadedFile } from "@/lib/storage";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Badge } from "./ui/badge";

interface EmergencyFormProps {
  onEmergencyClick: (type: string, situation: string, evidenceFiles?: UploadedFile[]) => void;
  userId: string;
}

const EmergencyForm = ({ onEmergencyClick, userId }: EmergencyFormProps) => {
  const [situation, setSituation] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedFile[]>([]);
  const { isOnline, pendingCount } = useOfflineSync();

  const emergencyTypes = [
    { value: "fire", label: "Fire Emergency", icon: Flame },
    { value: "medical", label: "Medical Emergency", icon: Activity },
    { value: "police", label: "Police / Crime", icon: AlertCircle },
    { value: "accident", label: "Road Accident", icon: Car },
    { value: "disaster", label: "Natural Disaster", icon: Home },
    { value: "other", label: "Other Emergency", icon: Users },
  ];

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const handleSubmit = () => {
    // Validate input using Zod schema
    const result = emergencyFormSchema.safeParse({
      situation,
      emergencyType,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    onEmergencyClick(emergencyType, situation.trim(), evidenceFiles);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="flex items-center justify-between bg-card rounded-lg p-3 shadow">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600">Offline Mode</span>
            </>
          )}
        </div>
        {pendingCount > 0 && (
          <Badge variant="outline">{pendingCount} pending sync</Badge>
        )}
      </div>

      {/* Warning Banner */}
      <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Emergency Response</h2>
        <p className="text-muted-foreground">
          Fill out the form below to get immediate access to emergency services in your area
        </p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-lg shadow-lg p-6 space-y-6">
        {/* Situation Description */}
        <div className="space-y-2">
          <label htmlFor="situation" className="text-sm font-semibold text-foreground block">
            Describe Your Situation *
          </label>
          <Textarea
            id="situation"
            placeholder="Please describe what's happening and where you are..."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="min-h-32 text-base resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be as specific as possible to help emergency services respond quickly
          </p>
        </div>

        {/* Emergency Type Selection */}
        <div className="space-y-2">
          <label htmlFor="emergency-type" className="text-sm font-semibold text-foreground block">
            Type of Emergency *
          </label>
          <Select value={emergencyType} onValueChange={setEmergencyType}>
            <SelectTrigger id="emergency-type" className="text-base h-12">
              <SelectValue placeholder="Select emergency type..." />
            </SelectTrigger>
            <SelectContent>
              {emergencyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value} className="text-base py-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Media Capture Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Evidence (Optional)
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMediaCapture(!showMediaCapture)}
            >
              <Camera className="w-4 h-4 mr-2" />
              {showMediaCapture ? 'Hide' : 'Add'} Photos/Videos/Audio
            </Button>
          </div>
          {showMediaCapture && (
            <MediaCapture userId={userId} onFilesUploaded={handleFilesUploaded} />
          )}
          {evidenceFiles.length > 0 && !showMediaCapture && (
            <p className="text-xs text-green-600">
              {evidenceFiles.length} file(s) attached
            </p>
          )}
        </div>

        {/* Emergency Button */}
        <Button
          onClick={handleSubmit}
          className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          <AlertCircle className="w-6 h-6 mr-2" />
          NEED HELP NOW
        </Button>

        {/* Info Text */}
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>By clicking the button above, your location will be detected automatically</p>
          <p className="font-semibold text-foreground">
            In life-threatening emergencies, call 911 immediately
          </p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-accent/10 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-foreground">Emergency Tips:</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Stay calm and speak clearly</li>
          <li>Provide your exact location if possible</li>
          <li>Don't hang up until told to do so</li>
          <li>Follow dispatcher instructions carefully</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyForm;
