import React, { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const VideoRecorder: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startVideoRecording = async () => {
    try {
      setIsRecording(true);

      const result = await Camera.pickVideos({
        source: CameraSource.Camera, // 🔥 forces camera, not file picker
        limit: 1,
        quality: 100,
      });

      if (result && result.photos && result.photos.length > 0) {
        const videoPath = result.photos[0].path;
        if (videoPath) setVideoUrl(videoPath);
      } else if (result && result.path) {
        setVideoUrl(result.path);
      }

      setIsRecording(false);
    } catch (error) {
      console.error("Error recording video:", error);
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-semibold mb-4">Video Recorder</h2>

      <button
        onClick={startVideoRecording}
        disabled={isRecording}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {isRecording ? "Recording..." : "Record Video"}
      </button>

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          className="mt-4 w-full max-w-md mx-auto rounded-lg border"
        />
      )}
    </div>
  );
};

export default VideoRecorder;
