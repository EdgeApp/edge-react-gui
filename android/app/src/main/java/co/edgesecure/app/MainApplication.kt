package co.edgesecure.app

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory
import io.sentry.Hint
import io.sentry.SentryEvent
import io.sentry.SentryLevel
import io.sentry.SentryOptions.BeforeBreadcrumbCallback
import io.sentry.SentryOptions.BeforeSendCallback
import io.sentry.android.core.SentryAndroid

class MainApplication :
  Application(),
  ReactApplication {
  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

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
              "http" == breadcrumb.category ||
              "console" == breadcrumb.category
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
    loadReactNative(this)

    // Expo integration:
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    // Expo integration:
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
