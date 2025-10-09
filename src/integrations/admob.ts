// /src/integrations/admob.ts
import { Capacitor } from "@capacitor/core";

let isInitialized = false;

const isNative = Capacitor.getPlatform() !== "web";

export const initAdMob = async () => {
  if (!isNative || isInitialized) return;
  isInitialized = true;

  try {
    // Import dynamically to avoid Vite SSR/build issues
    const { AdMob } = await import("@capacitor/admob");

    await AdMob.initialize({ initializeForTesting: false });

    // Show banner by default
    const bannerId = import.meta.env.VITE_ADMOB_BANNER_ID;
    if (bannerId) {
      await AdMob.showBanner({
        adId: bannerId,
        position: "BOTTOM_CENTER",
      });
    }
  } catch (err) {
    console.error("AdMob initialization failed:", err);
  }
};

export const showInterstitial = async () => {
  if (!isNative) return;

  try {
    const { AdMob } = await import("@capacitor/admob");
    const adId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;

    if (adId) {
      await AdMob.prepareInterstitial({ adId });
      await AdMob.showInterstitial();
    }
  } catch (err) {
    console.error("Error showing interstitial ad:", err);
  }
};

export const showRewarded = async () => {
  if (!isNative) return;

  try {
    const { AdMob } = await import("@capacitor/admob");
    const adId = import.meta.env.VITE_ADMOB_REWARDED_ID;

    if (adId) {
      await AdMob.prepareRewardVideoAd({ adId });
      await AdMob.showRewardVideoAd();
    }
  } catch (err) {
    console.error("Error showing rewarded ad:", err);
  }
};
