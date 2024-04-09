package co.edgesecure.app

import android.app.Application
import android.content.res.Configuration
import com.bugsnag.android.BreadcrumbType
import com.bugsnag.android.Bugsnag
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher.onApplicationCreate
import expo.modules.ApplicationLifecycleDispatcher.onConfigurationChanged
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {
                override fun getUseDeveloperSupport(): Boolean {
                    return BuildConfig.DEBUG
                }

                override fun getPackages(): List<ReactPackage> {
                    // Packages that cannot be autolinked yet can be added manually here, for
                    // example:
                    // packages.add(new MyReactNativePackage());
                    return PackageList(this).packages
                }

                override fun getJSMainModuleName(): String {
                    return "index"
                }

                override val isNewArchEnabled: Boolean
                    protected get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                override val isHermesEnabled: Boolean
                    protected get() = BuildConfig.IS_HERMES_ENABLED
            }
        )

    override fun onCreate() {
        super.onCreate()
        val context = applicationContext

        // @bugsnag/react-native
        val config = com.bugsnag.android.Configuration.load(this)
        config.enabledBreadcrumbTypes = object : HashSet<BreadcrumbType?>() {
            init {
                add(BreadcrumbType.ERROR)
                add(BreadcrumbType.NAVIGATION)
                add(BreadcrumbType.STATE)
                add(BreadcrumbType.USER)
            }
        }
        Bugsnag.start(this, config)

        // Disable RTL
        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(context, false)

        // Background task:
        MessagesWorker.ensureScheduled(context)
        // MessagesWorker.testRun(context);
        SoLoader.init(this, /* native exopackage */ false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this
            // app.
            load()
        }
        ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
        onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        onConfigurationChanged(this, newConfig)
    }
}
