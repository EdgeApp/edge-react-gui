package co.edgesecure.app

import android.app.Application
import android.content.res.Configuration
import com.bugsnag.android.BreadcrumbType
import com.bugsnag.android.Bugsnag
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {
                override fun getPackages(): List<ReactPackage> =
                    PackageList(this).packages
                        .apply {
                            // Packages that cannot be autolinked yet can be added manually here,
                            // for example:
                            // add(MyReactNativePackage())
                        }

                override fun getJSMainModuleName(): String = "index"

                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
            }
        )

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

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

        // Disable RTL:
        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(applicationContext, false)

        // Background task:
        MessagesWorker.ensureScheduled(applicationContext)
        // MessagesWorker.testRun(context);

        // React Native template code:
        SoLoader.init(this, /* native exopackage */ false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this
            // app.
            load()
        }
        ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)

        // Expo addition:
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    // Expo addition:
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
