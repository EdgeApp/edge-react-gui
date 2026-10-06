package co.edgesecure.app

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.os.PersistableBundle
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.TimeUnit

/**
 * Copies secrets to the clipboard, marked sensitive and scheduled to be
 * cleared.
 */
class EdgeClipboardModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    /** Identifies our own clip, so the worker can tell it from a newer one. */
    const val CLIP_LABEL = "EdgeSensitive"
    const val WORK_NAME = "EdgeClipboardClear"
  }

  override fun getName(): String = "EdgeClipboard"

  @ReactMethod
  fun setSensitiveString(
    text: String,
    expirySeconds: Double,
    promise: Promise,
  ) {
    try {
      val context = reactApplicationContext
      // Schedule the clear before writing the clip, so a failure in either
      // step never leaves a secret on the clipboard with no clear pending.
      // WorkManager runs the clear even if the app is in the background or
      // its process has died. A second copy restarts the countdown.
      val request =
        OneTimeWorkRequest
          .Builder(ClearClipboardWorker::class.java)
          .setInitialDelay(expirySeconds.toLong(), TimeUnit.SECONDS)
          .build()
      WorkManager
        .getInstance(context)
        .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)

      val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      val clip = ClipData.newPlainText(CLIP_LABEL, text)
      // Hides the text in the Android 13+ clipboard preview:
      clip.description.extras =
        PersistableBundle().apply { putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true) }
      clipboard.setPrimaryClip(clip)
      promise.resolve(null)
    } catch (e: Throwable) {
      promise.reject("EDGE_CLIPBOARD", e.message, e)
    }
  }
}
