import { Capacitor } from "@capacitor/core";

let AdMob: typeof import("@capacitor-community/admob").AdMobPlugin;

export const initAdMob = async () => {
  if (Capacitor.isNativePlatform()) {
    AdMob = (await import("@capacitor-community/admob")).AdMob;
    try {
      await AdMob.initialize({ initializeForTesting: false });
      await AdMob.showBanner({
        adId: "ca-app-pub-4211898333188674/4158088739", // Replace with your banner ID
        position: "BOTTOM_CENTER",
      });
    } catch (err) {
      console.error("AdMob failed:", err);
    }
  }
};

export const showInterstitial = async () => {
  if (!AdMob) return;
  try {
    await AdMob.prepareInterstitial({ adId: "ca-app-pub-4211898333188674/3209190335" });
    await AdMob.showInterstitial();
  } catch (err) {
    console.error("Interstitial failed:", err);
  }
};

export const showRewarded = async () => {
  if (!AdMob) return;
  try {
    await AdMob.prepareRewardVideoAd({ adId: "ca-app-pub-4211898333188674/1896108662" });
    await AdMob.showRewardVideoAd();
  } catch (err) {
    console.error("Rewarded ad failed:", err);
  }
};
