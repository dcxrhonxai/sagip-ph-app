import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

export const initAdMob = async () => {
  await AdMob.initialize({
    requestTrackingAuthorization: true,
    initializeForTesting: true, // set to false for production
  });
};

export const showBannerAd = async () => {
  const options: BannerAdOptions = {
    adId: 'ca-app-pub-4211898333188674/9617953134',
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true,
  };
  await AdMob.showBanner(options);
};
