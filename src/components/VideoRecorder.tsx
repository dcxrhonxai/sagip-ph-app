import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "@/components/ui/button";

interface VideoRecorderProps {
  onRecordingComplete: (videoData: string) => void;
}

export const VideoRecorder = ({ onRecordingComplete }: VideoRecorderProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const recordVideo = async () => {
    try {
      const video = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        mediaType: "VIDEO",
      });

      if (video.webPath) {
        setVideoUrl(video.webPath);
        onRecordingComplete(video.webPath);
      }
    } catch (err) {
      console.error("Video recording failed:", err);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={recordVideo} className="w-full">
        Record Video
      </Button>

      {videoUrl && (
        <video controls src={videoUrl} className="w-full mt-2 rounded-md" />
      )}
    </div>
  );
};
