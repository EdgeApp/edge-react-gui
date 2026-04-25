package co.edgesecure.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "edge"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // Edge addition
  override fun onCreate(savedInstanceState: Bundle?) {
    // Keep the splash screen around until we are ready to hide it:
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Hide app contents in the background:
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      setRecentsScreenshotEnabled(false)
    }

    // Lock the app to portrait mode:
    if (resources.getBoolean(R.bool.portrait_only)) {
      requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    if (maybeOpenInBrowser(intent)) {
      intent.data = null
    }
  }

  override fun onNewIntent(intent: Intent) {
    if (!maybeOpenInBrowser(intent)) {
      super.onNewIntent(intent)
    }
  }

  /**
   * Opens https/http URLs in the default browser when they aren't
   * registered deep link hosts handled by React Native. This prevents
   * shortcut intents from being misrouted through the deep link handler.
   * Returns true if the URL was opened in the browser.
   */
  private fun maybeOpenInBrowser(intent: Intent?): Boolean {
    val data = intent?.data ?: return false
    val scheme = data.scheme
    if (scheme != "https" && scheme != "http") return false

    val host = data.host
    if (DEEP_LINK_HOSTS.contains(host)) return false

    val browserIntent = Intent(Intent.ACTION_VIEW, data)
    return try {
      startActivity(browserIntent)
      true
    } catch (e: ActivityNotFoundException) {
      false
    }
  }

  companion object {
    private val DEEP_LINK_HOSTS = setOf(
      "deep.edge.app",
      "dl.edge.app",
      "return.edge.app"
    )
  }

  // Edge addition
  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}
