package app.lovable.fcbb65b390f2441890e8a8de327e1a60

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.getcapacitor.Plugin

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Registers any plugins if needed
        registerPlugin(Plugin::class.java)
    }
}
