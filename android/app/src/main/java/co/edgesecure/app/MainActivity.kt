package co.edgesecure.app

import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.concurrentReactEnabled
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String? {
        return "edge"
    }

    /**
     * Returns the instance of the [ReactActivityDelegate]. Here we use a util class [ ] which
     * allows you to easily enable Fabric and Concurrent React (aka React 18) with two boolean
     * flags.
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            DefaultReactActivityDelegate(
                this,
                mainComponentName!!,
                // If you opted-in for the New Architecture, we enable the Fabric Renderer.
                fabricEnabled, // fabricEnabled
                // If you opted-in for the New Architecture, we enable Concurrent React (i.e. React
                // 18).
                concurrentReactEnabled // concurrentRootEnabled
            )
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Keep the splash screen around until we are ready to hide it:
        RNBootSplash.init(this)
        super.onCreate(null)

        // Hide app contents in the background:
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            setRecentsScreenshotEnabled(false);
        }

        // Lock the app to portrait mode:
        if (resources.getBoolean(R.bool.portrait_only)) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
    }

    // Edge addition
    override fun invokeDefaultOnBackPressed() {
        moveTaskToBack(true)
    }
}
