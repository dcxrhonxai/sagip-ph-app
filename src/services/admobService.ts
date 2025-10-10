// src/services/admobService.ts
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

/**
 * Initialize AdMob on app launch.
 */
export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true, // Ask for consent on iOS
      testingDevices: [], // Optional: add device IDs while testing
      initializeForTesting: false,
    });
    console.log('✅ AdMob initialized');
  } catch (error) {
    console.error('❌ AdMob init failed:', error);
  }
}

/**
 * Show banner ad at bottom of screen.
 */
export async function showBannerAd() {
  try {
    await AdMob.showBanner({
      adId: 'ca-app-pub-4211898333188674/6300978111', // Replace with your actual banner ID
      position: BannerAdPosition.BOTTOM_CENTER,
      size: BannerAdSize.BANNER,
    });
    console.log('📢 Banner shown');
  } catch (error) {
    console.error('⚠️ Show banner failed:', error);
  }
}

/**
 * Hide current banner ad.
 */
export async function hideBannerAd() {
  try {
    await AdMob.hideBanner();
    console.log('🚫 Banner hidden');
  } catch (error) {
    console.error('⚠️ Hide banner failed:', error);
  }
}
