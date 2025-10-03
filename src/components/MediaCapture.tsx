import { useState } from "react";
import { CameraCapture } from "./CameraCapture";
import { AudioRecorder } from "./AudioRecorder";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { compressVideo, formatFileSize, getVideoSize } from "@/lib/videoCompression";

export const MediaCapture = () => {
  const [capturedMedia, setCapturedMedia] = useState<Array<{
    type: 'photo' | 'video' | 'audio';
    data: string;
    timestamp: Date;
    size?: number;
  }>>([]);
  const { toast } = useToast();

  const handleCameraCapture = async (imageData: string, type: 'photo' | 'video') => {
    let finalData = imageData;
    let size = getVideoSize(imageData);

    if (type === 'video') {
      toast({
        title: "Compressing video...",
        description: "Please wait while we optimize your video",
      });

      finalData = await compressVideo(imageData);
      size = getVideoSize(finalData);

      toast({
        title: "Video ready",
        description: `Size: ${formatFileSize(size)}`,
      });
    }

    setCapturedMedia((prev) => [
      ...prev,
      {
        type,
        data: finalData,
        timestamp: new Date(),
        size,
      },
    ]);
  };

  const handleAudioCapture = (audioData: string) => {
    const size = getVideoSize(audioData);
    setCapturedMedia((prev) => [
      ...prev,
      {
        type: 'audio',
        data: audioData,
        timestamp: new Date(),
        size,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="camera">
          <CameraCapture onCapture={handleCameraCapture} />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioRecorder onRecordingComplete={handleAudioCapture} />
        </TabsContent>
      </Tabs>

      {capturedMedia.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Captured Media ({capturedMedia.length})</h3>
          <div className="space-y-2">
            {capturedMedia.map((media, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                <span className="text-sm">
                  {media.type.charAt(0).toUpperCase() + media.type.slice(1)} - {media.timestamp.toLocaleTimeString()}
                </span>
                {media.size && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(media.size)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
