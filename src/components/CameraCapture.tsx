import { useState } from "react";
import { Camera, CameraResultType, CameraSource, Photo } from "@capacitor/camera";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera as CameraIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onPhotoTaken: (photoDataUrl: string) => void;
}

export const CameraCapture = ({ onPhotoTaken }: CameraCaptureProps) => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const { toast } = useToast();

  const takePhoto = async () => {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
      });

      if (capturedPhoto.dataUrl) {
        setPhoto(capturedPhoto);
        onPhotoTaken(capturedPhoto.dataUrl);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast({
        title: "Error",
        description: "Failed to capture photo",
        variant: "destructive",
      });
    }
  };

  const deletePhoto = () => {
    setPhoto(null);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Camera Capture</h3>

      <div className="space-y-4">
        {!photo && (
          <Button onClick={takePhoto} className="w-full">
            <CameraIcon className="mr-2 h-4 w-4" /> Take Photo
          </Button>
        )}

        {photo && (
          <div className="space-y-2">
            <img src={photo.dataUrl} alt="Captured" className="w-full rounded-lg" />
            <div className="flex gap-2">
              <Button onClick={takePhoto} variant="secondary" className="flex-1">
                <CameraIcon className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button onClick={deletePhoto} variant="destructive" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
