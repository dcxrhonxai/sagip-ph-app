export const initAdMob = async () => {
  if (window?.Capacitor?.isNative) {
    try {
      const { AdMob } = await import("@capacitor/admob");
      await AdMob.initialize({ initializeForTesting: false });
      await AdMob.showBanner({
        adId: "ca-app-pub-4211898333188674/4158088739",
        position: "BOTTOM_CENTER",
      });
      return AdMob;
    } catch (err) {
      console.error("AdMob failed:", err);
    }
  }
};

export const showInterstitialAd = async () => {
  const { AdMob } = await import("@capacitor/admob");
  await AdMob.prepareInterstitial({
    adId: "ca-app-pub-4211898333188674/3209190335",
  });
  await AdMob.showInterstitial();
};

export const showRewardedAd = async () => {
  const { AdMob } = await import("@capacitor/admob");
  await AdMob.prepareRewardVideoAd({
    adId: "ca-app-pub-4211898333188674/1896108662",
  });
  await AdMob.showRewardVideoAd();
};
