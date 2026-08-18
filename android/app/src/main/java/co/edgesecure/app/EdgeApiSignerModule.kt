package co.edgesecure.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import android.util.Base64
import java.nio.charset.StandardCharsets

/**
 * React Native bridge to the native HMAC API signer.
 * The secret never enters Java as a contiguous plaintext constant.
 */
class EdgeApiSignerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    /**
     * React Native constructs every module while building the package list, so
     * an UnsatisfiedLinkError here would kill the app at startup. Record the
     * failure instead, so EdgeApiSignerPackage can leave the module unregistered
     * and JS sees an honestly absent signer rather than one that rejects every
     * call.
     */
    val libraryLoaded: Boolean =
      try {
        System.loadLibrary("edge_api_signer")
        true
      } catch (e: UnsatisfiedLinkError) {
        false
      }
  }

  override fun getName(): String = "EdgeApiSigner"

  @ReactMethod
  fun signMessage(
    message: String,
    promise: Promise,
  ) {
    if (!libraryLoaded) {
      promise.reject("EDGE_API_SIGNER", "edge_api_signer library is unavailable")
      return
    }
    try {
      // Real UTF-8 bytes for both message and packageName (not JNI Modified UTF-8).
      val messageUtf8 = message.toByteArray(StandardCharsets.UTF_8)
      val packageNameUtf8 =
        reactApplicationContext.packageName.toByteArray(StandardCharsets.UTF_8)
      val signature = nativeSignMessage(messageUtf8, packageNameUtf8)
      val apiKey = nativeApiKey()
      val map: WritableMap = Arguments.createMap()
      map.putString("apiKey", apiKey)
      map.putString("signature", Base64.encodeToString(signature, Base64.NO_WRAP))
      promise.resolve(map)
    } catch (e: Throwable) {
      promise.reject("EDGE_API_SIGNER", e.message, e)
    }
  }

  @ReactMethod
  fun getApiKey(promise: Promise) {
    if (!libraryLoaded) {
      promise.reject("EDGE_API_SIGNER", "edge_api_signer library is unavailable")
      return
    }
    try {
      promise.resolve(nativeApiKey())
    } catch (e: Throwable) {
      promise.reject("EDGE_API_SIGNER", e.message, e)
    }
  }

  private external fun nativeSignMessage(
    messageUtf8: ByteArray,
    packageNameUtf8: ByteArray,
  ): ByteArray

  private external fun nativeApiKey(): String
}
