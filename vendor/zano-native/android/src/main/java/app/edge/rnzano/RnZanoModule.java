package app.edge.rnzano;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.HashMap;
import java.util.Map;

public class RnZanoModule extends ReactContextBaseJavaModule {
  private native String callZanoJNI(String method, String[] arguments);

  private native String[] getMethodNames();

  static {
    System.loadLibrary("rnzano");
  }

  public RnZanoModule(ReactApplicationContext reactContext) {
    super(reactContext);
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
    return "ZanoModule";
  }

  @ReactMethod
  public void callZano(String method, ReadableArray arguments, Promise promise) {
    // Re-package the arguments:
    String[] strings = new String[arguments.size()];
    for (int i = 0; i < arguments.size(); ++i) {
      strings[i] = arguments.getString(i);
    }

    try {
      promise.resolve(callZanoJNI(method, strings));
    } catch (Exception e) {
      promise.reject("ZanoError", e);
    }
  }
}
