package co.edgesecure.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import android.util.Base64

/**
 * React Native bridge to the native HMAC API signer.
 * The secret never enters Java as a contiguous plaintext constant.
 */
class EdgeApiSignerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  init {
    System.loadLibrary("edge_api_signer")
  }

  override fun getName(): String = "EdgeApiSigner"

  @ReactMethod
  fun signMessage(
    message: String,
    promise: Promise,
  ) {
    try {
      val packageName = reactApplicationContext.packageName
      val signature = nativeSignMessage(message, packageName)
      val apiKey = nativeApiKey()
      val map: WritableMap = Arguments.createMap()
      map.putString("apiKey", apiKey)
      map.putString("signature", Base64.encodeToString(signature, Base64.NO_WRAP))
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("EDGE_API_SIGNER", e.message, e)
    }
  }

  @ReactMethod
  fun getApiKey(promise: Promise) {
    try {
      promise.resolve(nativeApiKey())
    } catch (e: Exception) {
      promise.reject("EDGE_API_SIGNER", e.message, e)
    }
  }

  private external fun nativeSignMessage(
    message: String,
    packageName: String,
  ): ByteArray

  private external fun nativeApiKey(): String
}
