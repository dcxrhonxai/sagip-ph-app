// src/services/admobService.ts
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

/**
 * Initialize AdMob once when the app starts.
 * Safe to call multiple times (no duplicate initialization errors).
 */
export async function initAdMob() {
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true, // Ask for user consent on iOS
      testingDevices: [], // Optional: add test device IDs here
      initializeForTesting: false, // Set to true while testing ads
    });
    console.log('✅ AdMob initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AdMob:', error);
  }
}

/**
 * Optional: Show a banner ad (call when needed)
 */
export async function showBannerAd() {
  try {
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/6300978111', // ← replace with your own ad unit ID
      position: BannerAdPosition.BOTTOM_CENTER,
      size: BannerAdSize.BANNER,
    });
    console.log('📢 Banner ad displayed');
  } catch (error) {
    console.error('⚠️ Failed to show banner ad:', error);
  }
}

/**
 * Optional: Hide the current banner ad
 */
export async function hideBannerAd() {
  try {
    await AdMob.hideBanner();
    console.log('🚫 Banner ad hidden');
  } catch (error) {
    console.error('⚠️ Failed to hide banner ad:', error);
  }
}
