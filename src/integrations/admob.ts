// src/integrations/admob/admob.ts
export const initAdMob = async () => {
  if (window?.Capacitor?.isNative) {
    const { AdMob } = await import("@capacitor/admob");
    try {
      await AdMob.initialize({ initializeForTesting: false });
      await AdMob.showBanner({
        adId: "ca-app-pub-xxxx/yyyy", // Replace with your real banner ad ID
        position: "BOTTOM_CENTER",
      });
    } catch (err) {
      console.error("AdMob failed:", err);
    }
  }
};

export const showInterstitialAd = async () => {
  if (window?.Capacitor?.isNative) {
    const { AdMob } = await import("@capacitor/admob");
    try {
      await AdMob.prepareInterstitial({ adId: "ca-app-pub-xxxx/yyyy" });
      await AdMob.showInterstitial();
    } catch (err) {
      console.error("Interstitial Ad failed:", err);
    }
  }
};

export const showRewardedAd = async () => {
  if (window?.Capacitor?.isNative) {
    const { AdMob } = await import("@capacitor/admob");
    try {
      await AdMob.prepareRewardVideoAd({ adId: "ca-app-pub-xxxx/yyyy" });
      await AdMob.showRewardVideoAd();
    } catch (err) {
      console.error("Rewarded Ad failed:", err);
    }
  }
};
