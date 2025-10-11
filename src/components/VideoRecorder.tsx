import React, { useState } from "react";
import { Media } from "@capacitor-community/media";
import { Camera } from "@capacitor/camera";

// Request camera + mic permissions
async function requestCameraAndMicPermissions(): Promise<boolean> {
  try {
    await Camera.requestPermissions({ permissions: ["camera", "microphone"] });
    const status = await Camera.checkPermissions();
    if (status.camera !== "granted" || status.microphone !== "granted") {
      alert("Please grant camera and microphone permissions to continue.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Permission request error:", err);
    alert("Failed to request permissions.");
    return false;
  }
}

export default function VideoRecorder() {
  const [recording, setRecording] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Start video recording
  const handleStartRecording = async () => {
    const granted = await requestCameraAndMicPermissions();
    if (!granted) return;

    try {
      setLoading(true);
      await Media.startRecordVideo();
      setRecording(true);
      alert("Recording started!");
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording.");
    } finally {
      setLoading(false);
    }
  };

  // Stop recording and get file path
  const handleStopRecording = async () => {
    try {
      setLoading(true);
      const result = await Media.stopRecordVideo();
      console.log("Video saved:", result);
      setVideoPath(result.path || null);
      alert("Recording stopped!");
    } catch (err) {
      console.error("Error stopping recording:", err);
      alert("Could not stop recording.");
    } finally {
      setRecording(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100 text-center">
      <h1 className="text-2xl font-bold mb-6">🎥 Video Recorder</h1>

      {!recording ? (
        <button
          onClick={handleStartRecording}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Preparing..." : "Start Recording"}
        </button>
      ) : (
        <button
          onClick={handleStopRecording}
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Stopping..." : "Stop Recording"}
        </button>
      )}

      {videoPath && (
        <div className="mt-8 w-full max-w-md">
          <h2 className="text-lg font-medium mb-2">Preview</h2>
          <video
            controls
            className="rounded-xl w-full border border-gray-300 shadow-sm"
            src={videoPath.startsWith("file://") ? videoPath : `file://${videoPath}`}
          />
          <p className="mt-2 text-sm text-gray-600 break-all">
            Saved to: {videoPath}
          </p>
        </div>
      )}
    </div>
  );
}
