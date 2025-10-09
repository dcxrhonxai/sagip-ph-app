// Wrap AdMob usage to prevent Vite build errors
let AdMobInstance: any = null;

export const getAdMob = async () => {
  if (typeof window !== 'undefined' && window.Capacitor) {
    if (!AdMobInstance) {
      const { AdMob } = await import('@capacitor/admob');
      AdMobInstance = AdMob;
    }
    return AdMobInstance;
  }
  return null;
};

export const initializeAds = async () => {
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.initialize({ initializeForTesting: false });
    await AdMob.showBanner({
      adId: 'ca-app-pub-4211898333188674/4158088739',
      position: 'BOTTOM_CENTER',
    });
  } catch (err) {
    console.error('AdMob initialization failed:', err);
  }
};

export const showInterstitialAd = async () => {
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.prepareInterstitial({ adId: 'ca-app-pub-4211898333188674/3209190335' });
    await AdMob.showInterstitial();
  } catch (err) {
    console.error('Interstitial ad failed:', err);
  }
};

export const showRewardedAd = async () => {
  const AdMob = await getAdMob();
  if (!AdMob) return;

  try {
    await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-4211898333188674/1896108662' });
    await AdMob.showRewardVideoAd();
  } catch (err) {
    console.error('Rewarded ad failed:', err);
  }
};
