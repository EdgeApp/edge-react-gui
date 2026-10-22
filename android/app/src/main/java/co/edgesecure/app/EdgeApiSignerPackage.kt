package co.edgesecure.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers the EdgeApiSigner native module with React Native. */
class EdgeApiSignerPackage : ReactPackage {
  /**
   * Registering a module whose JNI library is missing would make
   * `hasNativeApiSigner()` true and steer JS away from its credential
   * fallback, so an unusable signer is simply not registered.
   */
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    if (EdgeApiSignerModule.libraryLoaded) listOf(EdgeApiSignerModule(reactContext))
    else emptyList()

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
