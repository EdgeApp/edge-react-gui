package co.edgesecure.app;

import android.app.Application;
import android.content.Context;
import android.content.res.Configuration;
import com.bugsnag.android.BreadcrumbType;
import com.bugsnag.android.Bugsnag;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.soloader.SoLoader;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;
import java.util.HashSet;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHostWrapper(
          this,
          new DefaultReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
              return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
              @SuppressWarnings("UnnecessaryLocalVariable")
              List<ReactPackage> packages = new PackageList(this).getPackages();
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // packages.add(new MyReactNativePackage());
              return packages;
            }

            @Override
            protected String getJSMainModuleName() {
              return "index";
            }

            @Override
            protected boolean isNewArchEnabled() {
              return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
            }

            @Override
            protected Boolean isHermesEnabled() {
              return BuildConfig.IS_HERMES_ENABLED;
            }
          });

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    Context context = getApplicationContext();

    // @bugsnag/react-native
    com.bugsnag.android.Configuration config = com.bugsnag.android.Configuration.load(this);
    config.setEnabledBreadcrumbTypes(
        new HashSet<BreadcrumbType>() {
          {
            add(BreadcrumbType.ERROR);
            add(BreadcrumbType.NAVIGATION);
            add(BreadcrumbType.STATE);
            add(BreadcrumbType.USER);
          }
        });
    Bugsnag.start(this, config);

    // Disable RTL
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    sharedI18nUtilInstance.allowRTL(context, false);

    // Background task:
    MessagesWorker.ensureScheduled(context);
    // MessagesWorker.testRun(context);

    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
