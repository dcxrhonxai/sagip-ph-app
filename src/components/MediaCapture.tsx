import { useState } from "react";
import { VoiceRecorder } from "@independo/capacitor-voice-recorder";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Camera as CameraIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MediaCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastVideo, setLastVideo] = useState<string | null>(null);
  const { toast } = useToast();

  // ---------- AUDIO ----------
  const startAudioRecording = async () => {
    try {
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (permission.value) {
        await VoiceRecorder.startRecording();
        setIsRecording(true);
        setAudioDuration(0);
        const interval = setInterval(() => setAudioDuration((prev) => prev + 1), 1000);
        (window as any).recordingInterval = interval;
      } else {
        toast({ title: "Permission denied", description: "Microphone permission is required", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to start recording", variant: "destructive" });
    }
  };

  const stopAudioRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      if ((window as any).recordingInterval) clearInterval((window as any).recordingInterval);
      setIsRecording(false);
      if (result.value?.recordDataBase64) {
        const url = `data:audio/aac;base64,${result.value.recordDataBase64}`;
        setAudioData(url);
        toast({ title: "Recording complete", description: `Recorded ${audioDuration} seconds` });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to stop recording", variant: "destructive" });
    }
  };

  const playAudio = () => {
    if (audioData) new Audio(audioData).play();
  };

  const deleteAudio = () => {
    setAudioData(null);
    setAudioDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ---------- PHOTO ----------
  const capturePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (photo.dataUrl) setLastPhoto(photo.dataUrl);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to capture photo", variant: "destructive" });
    }
  };

  // ---------- VIDEO ----------
  const recordVideo = async () => {
    try {
      const video = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        mediaType: "VIDEO",
      });
      if (video.webPath) setLastVideo(video.webPath);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to record video", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* AUDIO */}
      <Card className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Audio Recording</h3>
        {!isRecording && !audioData && (
          <Button onClick={startAudioRecording} className="w-full">
            <Mic className="mr-2 h-4 w-4" /> Start Recording
          </Button>
        )}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-4 bg-destructive/10 rounded-lg">
              <div className="animate-pulse h-3 w-3 bg-destructive rounded-full" />
              <span className="font-mono text-lg">{formatDuration(audioDuration)}</span>
            </div>
            <Button onClick={stopAudioRecording} variant="destructive" className="w-full">
              <Square className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          </div>
        )}
        {audioData && !isRecording && (
          <div className="space-y-2">
            <audio controls src={audioData} className="w-full" />
            <div className="flex gap-2">
              <Button onClick={playAudio} className="flex-1">
                <Play className="mr-2 h-4 w-4" /> Play
              </Button>
              <Button onClick={deleteAudio} variant="destructive" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* PHOTO */}
      <Card className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Photo Capture</h3>
        <Button onClick={capturePhoto} className="w-full">
          <CameraIcon className="mr-2 h-4 w-4" /> Capture Photo
        </Button>
        {lastPhoto && <img src={lastPhoto} alt="Last captured" className="w-full rounded-md mt-2" />}
      </Card>

      {/* VIDEO */}
      <Card className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Video Recording</h3>
        <Button onClick={recordVideo} className="w-full">
          <Video className="mr-2 h-4 w-4" /> Record Video
        </Button>
        {lastVideo && <video controls src={lastVideo} className="w-full rounded-md mt-2" />}
      </Card>
    </div>
  );
};
