package app.edge.rnmonero;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RnMoneroModule extends ReactContextBaseJavaModule {
  private native String callMoneroJNI(String method, String[] arguments);

  private native String[] getMethodNames();

  // Sets the C++ callback so WalletListener events route through onWalletEvent
  private native void initEventCallback();

  private final ExecutorService moneroExecutor = Executors.newSingleThreadExecutor();
  private final ExecutorService nymCompletionExecutor = Executors.newSingleThreadExecutor();

  static {
    System.loadLibrary("rnmonero");
  }

  public RnMoneroModule(ReactApplicationContext reactContext) {
    super(reactContext);
    initEventCallback();
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("methodNames", getMethodNames());
    constants.put("documentDirectory", getReactApplicationContext().getFilesDir().getAbsolutePath());
    return constants;
  }

  @Override
  public String getName() {
    return "MoneroLwsfModule";
  }

  @ReactMethod
  public void callMonero(String method, ReadableArray arguments, Promise promise) {
    // Re-package the arguments:
    String[] strings = new String[arguments.size()];
    for (int i = 0; i < arguments.size(); ++i) {
      strings[i] = arguments.getString(i);
    }

    ExecutorService executor =
      isNymCompletionMethod(method) ? nymCompletionExecutor : moneroExecutor;
    executor.execute(() -> {
      try {
        promise.resolve(callMoneroJNI(method, strings));
      } catch (Exception e) {
        promise.reject("MoneroError", e);
      }
    });
  }

  private static boolean isNymCompletionMethod(String method) {
    return "resolveFetch".equals(method) || "rejectFetch".equals(method);
  }

  // Required by React Native NativeEventEmitter on Android
  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(int count) {}

  // Called from C++ WalletListener via JNI on the SDK refresh thread.
  // Forwards the event to JS through RCTDeviceEventEmitter.
  public void onWalletEvent(String walletId, String eventName, String jsonPayload) {
    ReactApplicationContext ctx = getReactApplicationContext();
    if (ctx == null || !ctx.hasActiveReactInstance()) return;

    WritableMap params = Arguments.createMap();
    params.putString("walletId", walletId);
    params.putString("eventName", eventName);
    params.putString("data", jsonPayload);

    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
       .emit("MoneroWalletEvent", params);
  }
}
