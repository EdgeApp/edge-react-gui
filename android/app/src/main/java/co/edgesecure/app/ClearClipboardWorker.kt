package co.edgesecure.app

import android.content.ClipboardManager
import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Clears a secret that EdgeClipboardModule put on the clipboard. The name of
 * this class gets stored in the OS so it can re-instantiate us, so we can't
 * rename this class.
 */
class ClearClipboardWorker(
  context: Context,
  params: WorkerParameters,
) : Worker(context, params) {
  override fun doWork(): Result {
    val clipboard =
      applicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

    // Android 10+ only lets the focused app read the clipboard, so in the
    // background the description is null and we cannot tell whose clip it is.
    // Keep the clip only when we can see that it is no longer ours.
    val description = clipboard.primaryClipDescription
    if (description != null && description.label != EdgeClipboardModule.CLIP_LABEL) {
      return Result.success()
    }

    clipboard.clearPrimaryClip()
    return Result.success()
  }
}
