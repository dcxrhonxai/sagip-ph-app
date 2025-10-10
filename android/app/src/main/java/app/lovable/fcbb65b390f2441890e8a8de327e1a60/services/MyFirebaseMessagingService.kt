package app.lovable.fcbb65b390f2441890e8a8de327e1a60.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall
import com.getcapacitor.community.pushnotifications.PushNotifications

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Log received message
        Log.d("FCMService", "Message received: ${remoteMessage.data}")

        // Forward to Capacitor Push Plugin
        val pushPlugin = PushNotifications()
        val data = JSObject()
        remoteMessage.data.forEach { (key, value) ->
            data.put(key, value)
        }
        pushPlugin.notifyListeners("pushNotificationReceived", data)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCMService", "New FCM token: $token")

        // Forward token to Capacitor Push Plugin
        val pushPlugin = PushNotifications()
        val data = JSObject()
        data.put("value", token)
        pushPlugin.notifyListeners("registration", data)
    }
}
