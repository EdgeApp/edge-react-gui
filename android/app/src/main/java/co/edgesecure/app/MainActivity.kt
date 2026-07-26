package co.edgesecure.app

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "edge"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled].
   * The Expo wrapper forwards activity lifecycle events (onCreate intent capture, onNewIntent)
   * to expo modules; expo-quick-actions needs it to deliver shortcut taps on cold start.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
    )

  // Edge addition
  override fun onCreate(savedInstanceState: Bundle?) {
    // Keep the splash screen around until we are ready to hide it:
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)

    // Hide app contents in the background:
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      setRecentsScreenshotEnabled(false)
    }

    applyOrientationLock()
  }

  // Edge addition
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    // We handle orientation and screenSize config changes ourselves, so `onCreate` does not run
    // again when the device rotates or changes size. Re-apply the lock here so that a rotation we
    // did not ask for is corrected, and so that a device which genuinely changes screen-size class
    // (a foldable being unfolded, or the user changing the display-size setting) is re-evaluated.
    applyOrientationLock()
  }

  /**
   * Restricts the app to portrait, except on tablets. Landscape is only supported on a large
   * screen, so phones stay locked no matter how the device is turned. This mirrors what iOS does
   * with its `UISupportedInterfaceOrientations~ipad` keys.
   *
   * `portrait_only` is `true` by default and overridden to `false` for tablet-sized screens, so
   * the manifest declares portrait and this relaxes it only where landscape is actually supported.
   */
  private fun applyOrientationLock() {
    val orientation =
      if (resources.getBoolean(R.bool.portrait_only)) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED

    if (requestedOrientation != orientation) {
      requestedOrientation = orientation
    }
  }

  // Edge addition
  override fun invokeDefaultOnBackPressed() {
    moveTaskToBack(true)
  }
}
