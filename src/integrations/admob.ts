// Wrap AdMob so Vite doesn't break SSR/build
export const initAdMob = async () => {
  if (typeof window === "undefined") return; // Skip server-side
  try {
    const { AdMob } = await import('@capacitor/admob');
    await AdMob.initialize({ initializeForTesting: false });
    await AdMob.showBanner({
      adId: import.meta.env.VITE_ADMOB_BANNER_ID,
      position: 'BOTTOM_CENTER',
    });
  } catch (err) {
    console.warn("AdMob not available:", err);
  }
};

export const showInterstitial = async () => {
  if (typeof window === "undefined") return;
  try {
    const { AdMob } = await import('@capacitor/admob');
    await AdMob.prepareInterstitial({ adId: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID });
    await AdMob.showInterstitial();
  } catch (err) {
    console.warn("Interstitial Ad failed:", err);
  }
};

export const showRewarded = async () => {
  if (typeof window === "undefined") return;
  try {
    const { AdMob } = await import('@capacitor/admob');
    await AdMob.prepareRewardVideoAd({ adId: import.meta.env.VITE_ADMOB_REWARDED_ID });
    await AdMob.showRewardVideoAd();
  } catch (err) {
    console.warn("Rewarded Ad failed:", err);
  }
};
