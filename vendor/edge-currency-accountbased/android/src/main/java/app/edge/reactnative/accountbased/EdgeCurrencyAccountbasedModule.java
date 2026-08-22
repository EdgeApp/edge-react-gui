package app.edge.reactnative.accountbased;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import java.util.HashMap;
import java.util.Map;

public class EdgeCurrencyAccountbasedModule extends ReactContextBaseJavaModule {
  EdgeCurrencyAccountbasedModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put(
        "sourceUri",
        "file:///android_asset/edge-currency-accountbased/edge-currency-accountbased.js");
    return constants;
  }

  @Override
  public String getName() {
    return "EdgeCurrencyAccountbasedModule";
  }
}
