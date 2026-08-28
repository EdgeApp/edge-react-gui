import Firebase
import FirebaseMessaging
import RNBootSplash
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import UIKit
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  /// The scene owns the window, but third-party code still reaches for it here.
  /// `@react-native-firebase/messaging` reads `application.delegate.window` on
  /// `UIApplicationDidFinishLaunchingNotification`, which raises
  /// `doesNotRecognizeSelector` if the delegate has no `window` property at all,
  /// so `SceneDelegate` mirrors its window into this.
  var window: UIWindow?

  /// The root view controller React Native was started into.
  /// iOS can disconnect a scene without killing the process, and the later
  /// reconnect runs `scene(_:willConnectTo:)` again, so `SceneDelegate`
  /// reattaches this instead of mounting a second copy of the app.
  var rootViewController: UIViewController?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  /**
   * Handles app start-up.
   * React Native template code.
   *
   * The window and everything tied to its lifecycle lives in `SceneDelegate`,
   * since this app adopts the `UIScene` lifecycle.
   */
  func application(
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
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return true
  }

  /**
   * Points every new scene at our `SceneDelegate`.
   * The scene manifest in Info.plist names the same configuration.
   */
  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    return UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
  }

  /**
   * Periodic background fetch logic.
   * Edge addition.
   */
  func application(
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
        setBadgeCount(problemUsers.count)

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
}

/// Sets the home-screen badge.
/// `UIApplication.applicationIconBadgeNumber` is deprecated since iOS 17,
/// but our deployment target still includes iOS 15.
private func setBadgeCount(_ count: Int) {
  if #available(iOS 16.0, *) {
    UNUserNotificationCenter.current().setBadgeCount(count)
  } else {
    UIApplication.shared.applicationIconBadgeNumber = count
  }
}

/// Configures the React Native instance.
/// React Native template code.
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  // react-native-bootsplash integration:
  override func customize(_ rootView: RCTRootView) {
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
