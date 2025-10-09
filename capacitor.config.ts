import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wxtech.emergencyresponseph',
  appName: 'Emergency Response PH',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // How long to display the splash screen in milliseconds
      launchShowDuration: 3000, 
      // Whether to auto hide the splash screen
      launchAutoHide: true,
      // The background color of the splash screen
      backgroundColor: "#ffffff", 
      // Set the scale type of the image (Android only)
      androidScaleType: "CENTER_CROP",
      // (Optional) Show a spinner on top of the splash screen
      showSpinner: true,
      // (Optional) Color of the spinner
      spinnerColor: "#999999", 
    },
  },
};

export default config;
