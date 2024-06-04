package co.edgesecure.app

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import io.sentry.android.core.SentryAndroid
import io.sentry.Hint
import io.sentry.SentryEvent
import io.sentry.SentryLevel
import io.sentry.SentryOptions.BeforeSendCallback

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
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()

        // Retrieve the version string from the app's BuildConfig
        val versionString = BuildConfig.VERSION_NAME

        SentryAndroid.init(this) { options ->
          options.dsn = "SENTRY_DSN_URL"

          if (versionString == "99.99.99") {
            options.environment = "development"
          } else if (versionString.contains("-")) {
            options.environment = "testing"
          } else {
            options.environment = "production"
          }

          // Add a callback that will be used before the event is sent to Sentry.
          // With this callback, you can modify the event or, when returning null, also discard the event.
          options.beforeSend =
            BeforeSendCallback { event: SentryEvent, hint: Hint ->
              if (SentryLevel.DEBUG == event.level) {
                null
              } else {
                event
              }
            }
        }

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

        // Expo addition:
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    // Expo addition:
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
