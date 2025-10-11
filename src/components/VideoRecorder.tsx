import React from 'react';
import { requestCameraAndMicPermissions } from '@/utils/permissions';
import { Media } from '@capacitor-community/media';

export default function VideoRecorder() {
  const handleRecord = async () => {
    const granted = await requestCameraAndMicPermissions();
    if (!granted) return;

    // Example video recording start
    try {
      await Media.startRecordVideo();
      alert('Recording started!');
    } catch (err) {
      console.error(err);
      alert('Failed to start recording');
    }
  };

  const handleStop = async () => {
    const result = await Media.stopRecordVideo();
    alert('Video saved: ' + JSON.stringify(result));
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <button onClick={handleRecord}>Start Recording</button>
      <button onClick={handleStop}>Stop Recording</button>
    </div>
  );
}
