import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoRecorderProps {
  onVideoComplete: (file: File) => void;
}

export const VideoRecorder = ({ onVideoComplete }: VideoRecorderProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
      onVideoComplete(file);
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" capture="camcorder" ref={inputRef} onChange={handleCapture} className="hidden" />
      <Button onClick={() => inputRef.current?.click()}>Record Video</Button>
      {videoUrl && <video src={videoUrl} controls className="w-full mt-2 rounded-lg" />}
    </div>
  );
};
