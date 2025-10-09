export const initAdMob = async () => {
  if (window.Capacitor?.isNative) {
    try {
      const { AdMob } = await import('@capacitor/admob');
      await AdMob.initialize({ initializeForTesting: false });

      // Show banner
      await AdMob.showBanner({
        adId: import.meta.env.VITE_ADMOB_BANNER_ID,
        position: 'BOTTOM_CENTER',
      });

      return AdMob;
    } catch (err) {
      console.error('AdMob init failed:', err);
    }
  }
};
