import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onPhotoCapture: (file: File) => void;
}

export const CameraCapture = ({ onPhotoCapture }: CameraCaptureProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      onPhotoCapture(file);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" capture="environment" ref={inputRef} onChange={handleCapture} className="hidden" />
      <Button onClick={() => inputRef.current?.click()}>Capture Photo</Button>
      {photoUrl && <img src={photoUrl} alt="Captured" className="w-full mt-2 rounded-lg" />}
    </div>
  );
};
