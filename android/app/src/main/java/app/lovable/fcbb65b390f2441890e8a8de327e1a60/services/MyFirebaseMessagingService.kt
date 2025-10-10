package app.lovable.fcbb65b390f2441890e8a8de327e1a60.services

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d("FCM", "Message received from: ${remoteMessage.from}")

        remoteMessage.notification?.let {
            Log.d("FCM", "Notification Title: ${it.title}")
            Log.d("FCM", "Notification Body: ${it.body}")
        }

        remoteMessage.data.isNotEmpty().let {
            Log.d("FCM", "Data Payload: ${remoteMessage.data}")
        }
    }

    override fun onNewToken(token: String) {
        Log.d("FCM", "Refreshed Token: $token")
        // TODO: Send token to your backend if needed
    }
}
