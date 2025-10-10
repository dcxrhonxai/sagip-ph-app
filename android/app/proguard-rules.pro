# ------------------------------------------------------------
# ✅ PROGUARD RULES — PLAY STORE SAFE / CAPACITOR VERIFIED
# ------------------------------------------------------------

# Keep essential Capacitor classes
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Keep Cordova and plugin classes
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# Keep Firebase Messaging classes
-keep class com.google.firebase.messaging.FirebaseMessagingService { *; }
-keep class com.google.firebase.messaging.RemoteMessage { *; }
-keep class com.google.firebase.iid.FirebaseInstanceIdReceiver { *; }

# Keep AdMob / Google Ads SDK
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Keep Play Services + Analytics
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }

# Keep reflection-based access (common in React/Vite/Capacitor)
-keepattributes *Annotation*
-keepattributes Signature,InnerClasses,EnclosingMethod

# Keep all @JavascriptInterface annotated methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep classes used in WebView JS bridge
-keepclassmembers class ** {
    public <init>(android.content.Context);
}

# Keep classes for serialization/deserialization (Gson, etc.)
-keep class * implements java.io.Serializable { *; }

# Suppress some irrelevant warnings
-dontwarn java.lang.invoke.*
-dontwarn javax.annotation.**
-dontwarn org.jetbrains.annotations.**

# Final rule: do not optimize too aggressively
-dontoptimize
-dontpreverify
