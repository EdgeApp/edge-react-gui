package co.edgesecure.app

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import io.sentry.Hint
import io.sentry.SentryEvent
import io.sentry.SentryLevel
import io.sentry.SentryOptions.BeforeBreadcrumbCallback
import io.sentry.SentryOptions.BeforeSendCallback
import io.sentry.android.core.SentryAndroid

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {
                override fun getPackages(): List<ReactPackage> {
                    // Packages that cannot be autolinked yet can be added manually here, for
                    // example:
                    // packages.add(new MyReactNativePackage());
                    return PackageList(this).packages
                }

                override fun getJSMainModuleName(): String = "index"

                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
            }
        )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        val context = applicationContext

        // Retrieve the version string from the app's BuildConfig
        val versionString = BuildConfig.VERSION_NAME

        if ("SENTRY_DSN_URL".contains("SENTRY_DSN")) {
            // Sentry disabled. Need to add sentry keys to env.json
        } else {
            SentryAndroid.init(this) { options ->
                options.dsn = "SENTRY_DSN_URL"

                if (versionString == "99.99.99") {
                    options.environment = "development"
                } else if (versionString.contains("-")) {
                    options.environment = "testing"
                } else {
                    options.environment = "production"
                }

                options.beforeBreadcrumb =
                    BeforeBreadcrumbCallback { breadcrumb, hint ->
                        if ("network.event" == breadcrumb.category ||
                            "http" == breadcrumb.category || "console" == breadcrumb.category
                        ) {
                            null
                        } else {
                            breadcrumb
                        }
                    }
                // Add a callback that will be used before the event is sent to Sentry.
                // With this callback, you can modify the event or, when returning null, also
                // discard the event.
                options.beforeSend =
                    BeforeSendCallback { event: SentryEvent, hint: Hint ->
                        if (SentryLevel.DEBUG == event.level) {
                            null
                        } else {
                            event
                        }
                    }
            }
        }

        // Disable RTL
        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(context, false)

        // Background task:
        MessagesWorker.ensureScheduled(context)
        // MessagesWorker.testRun(context);

        // React Native template code:
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this
            // app.
            load()
        }

        // Expo integration:
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)

        // Expo integration:
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
