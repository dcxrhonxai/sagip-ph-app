package app.lovable.fcbb65b390f2441890e8a8de327e1a60

import android.content.Intent
import android.os.Bundle
import androidx.core.content.FileProvider
import com.getcapacitor.Plugin
import com.getcapacitor.community.firebase.messaging.FirebaseMessagingPlugin
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register Capacitor and Firebase plugins
        registerPlugins()

        // Handle any intent (like notification or camera capture)
        handleIntent(intent)
    }

    private fun registerPlugins() {
        // Register Firebase Messaging Plugin for push notifications
        this.bridge?.getPluginManager()?.registerPlugin(FirebaseMessagingPlugin::class.java)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }

    private fun handleIntent(intent: Intent) {
        if (intent.action == android.media.action.IMAGE_CAPTURE) {
            // Handle camera intent (optional)
        }
    }

    // Safely get FileProvider URI
    fun getFileProviderUri(file: java.io.File) =
        FileProvider.getUriForFile(
            this,
            "app.lovable.fcbb65b390f2441890e8a8de327e1a60.fileprovider",
            file
        )
}
