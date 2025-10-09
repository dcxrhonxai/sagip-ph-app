import { useState } from "react";
import { Media, RecordingFile } from "@capacitor-community/media";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onRecordingComplete: (audioData: string) => void;
}

export const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingFile, setRecordingFile] = useState<RecordingFile | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const recording = await Media.createRecording({ title: "New Recording" });
      setRecordingFile(recording);
      setIsRecording(true);
      setDuration(0);

      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      (window as any).recordingInterval = interval;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingFile) return;

      const stoppedRecording = await Media.stopRecording({ recording: recordingFile });

      if ((window as any).recordingInterval) {
        clearInterval((window as any).recordingInterval);
      }

      setIsRecording(false);

      if (stoppedRecording.filePath) {
        const audioUrl = stoppedRecording.filePath;
        setAudioData(audioUrl);
        onRecordingComplete(audioUrl);

        toast({
          title: "Recording complete",
          description: `Recorded ${duration} seconds of audio`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
      console.error("Error stopping recording:", error);
    }
  };

  const playAudio = () => {
    if (audioData) {
      const audio = new Audio(audioData);
      audio.play();
    }
  };

  const deleteRecording = () => {
    setAudioData(null);
    setDuration(0);
    setRecordingFile(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Audio Recording</h3>

      <div className="space-y-4">
        {!isRecording && !audioData && (
          <Button onClick={startRecording} className="w-full">
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-4 bg-destructive/10 rounded-lg">
              <div className="animate-pulse h-3 w-3 bg-destructive rounded-full" />
              <span className="font-mono text-lg">{formatDuration(duration)}</span>
            </div>
            <Button onClick={stopRecording} variant="destructive" className="w-full">
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          </div>
        )}

        {audioData && !isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-center p-4 bg-secondary/10 rounded-lg">
              <span className="font-mono text-lg">Duration: {formatDuration(duration)}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={playAudio} variant="secondary" className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Play
              </Button>
              <Button onClick={deleteRecording} variant="destructive" className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
