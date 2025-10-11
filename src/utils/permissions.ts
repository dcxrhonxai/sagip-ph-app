import { Camera } from '@capacitor/camera';

export async function requestCameraAndMicPermissions() {
  await Camera.requestPermissions({ permissions: ['camera', 'microphone'] });

  const status = await Camera.checkPermissions();
  if (status.camera !== 'granted' || status.microphone !== 'granted') {
    alert('Please allow camera and microphone permissions to continue.');
    return false;
  }
  return true;
}
