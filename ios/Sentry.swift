import Sentry

func initializeSentry() {
  let dsnUrl = "SENTRY_DSN_URL"  // Replaced during build
  let maybeVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"]
  let version = maybeVersion as? String ?? "99.99.99"

  guard !dsnUrl.contains("SENTRY_DSN") else {
    print("Please set the SENTRY_DSN_URL in env.json. Sentry disabled.")
    return
  }

  SentrySDK.start { options in
    options.dsn = dsnUrl
    options.debug = true

    switch version {
    case "99.99.99":
      options.environment = "development"
    case let v where v.contains("-"):
      options.environment = "testing"
    default:
      options.environment = "production"
    }

    // Discard automatic breadcrumbs:
    options.beforeBreadcrumb = { breadcrumb in
      switch breadcrumb.category {
      case "http", "console", "navigation", "ui.lifecycle", "xhr":
        return nil
      default:
        return breadcrumb
      }
    }

    options.tracesSampleRate = 0.2
    options.enableCaptureFailedRequests = false
  }
}
