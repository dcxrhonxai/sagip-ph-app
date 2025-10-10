package app.lovable.fcbb65b390f2441890e8a8de327e1a60.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.getcapacitor.JSObject
import com.getcapacitor.Capacitor

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM_TOKEN", "Refreshed token: $token")
        // Optionally, send the token to your backend
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.d("FCM_MESSAGE", "Message received from: ${message.from}")

        // Send push notification data to Capacitor JS layer
        val data = JSObject()
        data.put("title", message.notification?.title ?: "")
        data.put("body", message.notification?.body ?: "")
        data.put("data", message.data)

        Capacitor.emit("pushNotificationReceived", data)
    }
}
