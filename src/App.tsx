import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import { AudioRecorder } from "@/components/AudioRecorder";
import { CameraCapture } from "@/components/CameraCapture";
import { Button } from "@/components/ui/button";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const [activeTab, setActiveTab] = useState<"audio" | "camera">("audio");
  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  const handleRecordingComplete = (audioData: string) => {
    setLastAudio(audioData);
    console.log("Recorded audio:", audioData);
  };

  const handlePhotoCapture = (photoData: string) => {
    setLastPhoto(photoData);
    console.log("Captured photo:", photoData);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/media"
              element={
                <div className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setActiveTab("audio")}
                      variant={activeTab === "audio" ? "primary" : "default"}
                    >
                      Audio Recorder
                    </Button>
                    <Button
                      onClick={() => setActiveTab("camera")}
                      variant={activeTab === "camera" ? "primary" : "default"}
                    >
                      Camera Capture
                    </Button>
                  </div>

                  <div className="mt-4">
                    {activeTab === "audio" && (
                      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                    )}
                    {activeTab === "camera" && (
                      <CameraCapture onPhotoCapture={handlePhotoCapture} />
                    )}
                  </div>
                </div>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
