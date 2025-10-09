// Wrap AdMob usage so Vite does not break SSR/build
export const initializeAdMob = async () => {
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    try {
      const { AdMob } = await import('@capacitor/admob');
      await AdMob.initialize({ initializeForTesting: false });

      // Show bottom banner
      await AdMob.showBanner({
        adId: "ca-app-pub-4211898333188674/4158088739",
        position: "BOTTOM_CENTER",
      });

      return AdMob;
    } catch (err) {
      console.error('AdMob initialization failed:', err);
      return null;
    }
  }
  return null;
};
