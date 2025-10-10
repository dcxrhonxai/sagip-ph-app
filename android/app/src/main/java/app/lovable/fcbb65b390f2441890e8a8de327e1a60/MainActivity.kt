package app.lovable.fcbb65b390f2441890e8a8de327e1a60

import android.content.Intent
import android.os.Bundle
import androidx.core.content.FileProvider
import com.getcapacitor.BridgeActivity
import com.getcapacitor.Plugin
import com.getcapacitor.community.firebase.messaging.FirebaseMessagingPlugin

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Capacitor plugins
        registerPlugins()

        // Handle intent if app is opened via notification or camera
        handleIntent(intent)
    }

    private fun registerPlugins() {
        // Firebase Messaging for push notifications
        this.bridge?.getPluginManager()?.registerPlugin(FirebaseMessagingPlugin::class.java)

        // Register other plugins here as needed
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }

    private fun handleIntent(intent: Intent) {
        // Handle camera capture intents if needed
        if (intent.action == android.media.action.IMAGE_CAPTURE) {
            // Optional: handle camera intent here
        }
        // You can handle other custom intents here
    }

    /**
     * Helper to get a FileProvider URI safely
     * Usage: val uri = getFileProviderUri(file)
     */
    fun getFileProviderUri(file: java.io.File) =
        FileProvider.getUriForFile(
            this,
            "app.lovable.fcbb65b390f2441890e8a8de327e1a60.fileprovider",
            file
        )
}
