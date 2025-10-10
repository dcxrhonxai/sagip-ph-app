import { useState } from "react";
import { VoiceRecorder } from "@independo/capacitor-voice-recorder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
}

export const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        toast({ title: "Permission denied", variant: "destructive" });
        return;
      }
      await VoiceRecorder.startRecording();
      setIsRecording(true);
      setDuration(0);

      const interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
      (window as any).recordingInterval = interval;
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to start recording", variant: "destructive" });
    }
  };

  const stopRecording = async () => {
    try {
      const result = await VoiceRecorder.stopRecording();
      if ((window as any).recordingInterval) clearInterval((window as any).recordingInterval);
      setIsRecording(false);

      if (result.value?.recordDataBase64) {
        const blob = new Blob([Uint8Array.from(atob(result.value.recordDataBase64), (c) => c.charCodeAt(0))], { type: "audio/aac" });
        const file = new File([blob], `audio_${Date.now()}.aac`, { type: "audio/aac" });
        setAudioUrl(URL.createObjectURL(blob));
        onRecordingComplete(file);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to stop recording", variant: "destructive" });
    }
  };

  const playAudio = () => { if (audioUrl) new Audio(audioUrl).play(); };
  const deleteAudio = () => { setAudioUrl(null); setDuration(0); };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Audio Recorder</h3>
      {!isRecording && !audioUrl && <Button onClick={startRecording}><Mic /> Start Recording</Button>}
      {isRecording && <Button onClick={stopRecording}><Square /> Stop Recording</Button>}
      {audioUrl && (
        <div className="flex gap-2">
          <Button onClick={playAudio}><Play /> Play</Button>
          <Button onClick={deleteAudio} variant="destructive"><Trash2 /> Delete</Button>
        </div>
      )}
    </Card>
  );
};
