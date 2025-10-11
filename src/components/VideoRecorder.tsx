// src/components/VideoRecorder.tsx
import React, { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const VideoRecorder: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const recordVideo = async () => {
    try {
      const video = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        promptLabelPhoto: "Record video",
        saveToGallery: true,
      });

      if (video.webPath) {
        setVideoUrl(video.webPath);
      }
    } catch (error) {
      console.error("Error recording video:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <button
        onClick={recordVideo}
        className="px-4 py-2 text-white bg-blue-600 rounded-lg"
      >
        Record Video
      </button>

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          className="mt-4 rounded-xl w-[90%] max-w-md"
        />
      )}
    </div>
  );
};

export default VideoRecorder;
