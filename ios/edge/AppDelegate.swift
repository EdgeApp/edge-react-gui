import Expo
import Firebase
import FirebaseMessaging
import RNBootSplash
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import UIKit
import UserNotifications

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var securityView: UIView?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  /**
   * Handles deep links.
   * From https://reactnative.dev/docs/0.79/linking?ios-language=swift#enabling-deep-links
   */
  override func application(
    _ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  /**
   * Handles deep links.
   * From https://reactnative.dev/docs/0.79/linking?ios-language=swift#enabling-deep-links
   */
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

  /**
   * Handles app start-up.
   * React Native template code.
   */
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize SDK's:
    initializeSentry()
    FirebaseApp.configure()

    // Client-side background fetch interval:
    application.setMinimumBackgroundFetchInterval(60 * 60 * 12)

    // React Native template code:
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "edge",
      in: window,
      launchOptions: launchOptions
    )

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  /**
   * Periodic background fetch logic.
   * Edge addition.
   */
  override func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    let core = EdgeCore()

    // Update the Firebase token on the push server:
    if let token = Messaging.messaging().fcmToken {
      core.updatePushToken(token: token) { _ in
        // Nothing to do.
      }
    }

    // Send an alert if any users have pending logins:
    core.fetchPendingLogins { problemUsers in
      guard let problemUsers = problemUsers else {
        return completionHandler(.noData)
      }

      if problemUsers.isEmpty {
        return completionHandler(.noData)
      }

      let message = "Another device is trying to log into: " + problemUsers.joined(separator: ", ")
      print("Background notification: \(message)")

      DispatchQueue.main.async {
        application.applicationIconBadgeNumber = problemUsers.count

        let content = UNMutableNotificationContent()
        content.title = "Urgent Security Issue"
        content.body = message

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
          identifier: "loginRequest", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { _ in
          completionHandler(.newData)
        }
      }
    }

  }

  /**
   * Hides the app when we go into the background.
   * Edge addition.
   */
  override func applicationDidEnterBackground(_ application: UIApplication) {
    guard
      let storyboard = UIStoryboard(name: "LaunchScreen", bundle: nil) as UIStoryboard?,
      let launchScreen = storyboard.instantiateInitialViewController(),
      let launchView = launchScreen.view,
      let window = self.window
    else {
      return
    }

    launchView.frame = window.bounds
    window.addSubview(launchView)
    window.makeKeyAndVisible()
    self.securityView = launchView
  }

  /**
   * Shows the app when we come into the foreground.
   * Edge addition.
   */
  override func applicationWillEnterForeground(_ application: UIApplication) {
    if let view = securityView {
      view.removeFromSuperview()
      securityView = nil
    }
  }
}

/// Configures the React Native instance.
/// React Native template code.
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  // react-native-bootsplash integration:
  override func customize(_ rootView: UIView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("LaunchScreen", rootView: rootView)
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
