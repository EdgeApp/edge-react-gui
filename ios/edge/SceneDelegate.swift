import ExpoQuickActions
import React
import UIKit

/**
 * Owns the app's single window and its lifecycle.
 *
 * iOS 26 deprecates the `UIApplicationDelegate` window and lifecycle callbacks
 * for apps that adopt the `UIScene` lifecycle, and Xcode 27 is expected to drop
 * the `UIDesignRequiresCompatibility` opt-out entirely, so window creation,
 * foreground/background transitions, deep links and quick actions all live here
 * instead of on `AppDelegate`.
 */
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  var securityView: UIView?

  /**
   * Handles app start-up for this scene.
   *
   * React Native is created once by `AppDelegate`, but the root view is mounted
   * into the window this scene owns.
   */
  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    // A reconnecting scene already has React Native running, and starting it
    // again would mount a second copy of the app, so reuse the root view
    // controller from the first connection. Edge addition.
    if let rootViewController = appDelegate.rootViewController {
      window.rootViewController = rootViewController
      window.makeKeyAndVisible()

      // Only the first mount reads the launch options and the initial quick
      // action, so whatever arrived with the reconnect goes through the
      // running-app handlers instead. Edge addition.
      if let shortcutItem = connectionOptions.shortcutItem {
        self.windowScene(windowScene, performActionFor: shortcutItem) { _ in }
      }
      if !connectionOptions.urlContexts.isEmpty {
        self.scene(scene, openURLContexts: connectionOptions.urlContexts)
      }
      for userActivity in connectionOptions.userActivities {
        self.scene(scene, continue: userActivity)
      }
      return
    }

    // Capture a home-screen quick action on a cold launch so
    // expo-quick-actions can report it as the initial action once JS loads.
    // Under the scene lifecycle this arrives in the connection options rather
    // than in the application launch options. Edge addition.
    if let shortcutItem = connectionOptions.shortcutItem {
      ExpoQuickActions.initialAction = shortcutItem
    }

    factory.startReactNative(
      withModuleName: "edge",
      in: window,
      launchOptions: Self.launchOptions(from: connectionOptions)
    )
    appDelegate.rootViewController = window.rootViewController
  }

  /**
   * Handles deep links while the app is running.
   * The scene lifecycle replaces `application(_:open:options:)`.
   */
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: [:]
      )
    }
  }

  /**
   * Handles universal links.
   * The scene lifecycle replaces
   * `application(_:continue:restorationHandler:)`.
   */
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  /**
   * Handles home-screen quick action taps while the app is running.
   * Mirrors ExpoQuickActionsAppDelegate, which never runs because our
   * app delegate is not an ExpoAppDelegate. Edge addition.
   */
  func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    NotificationCenter.default.post(
      name: Notification.Name("onQuickAction"), object: shortcutItem)
    completionHandler(true)
  }

  /**
   * Hides the app when we go into the background.
   * Edge addition.
   */
  func sceneDidEnterBackground(_ scene: UIScene) {
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
  func sceneWillEnterForeground(_ scene: UIScene) {
    if let view = securityView {
      view.removeFromSuperview()
      securityView = nil
    }
  }

  /**
   * Rebuilds the launch options React Native expects from the scene's
   * connection options.
   *
   * `RCTLinkingManager.getInitialURL` reads the cold-launch URL out of the
   * bridge's launch options, but iOS does not put deep-link keys into
   * `didFinishLaunchingWithOptions` once the scene lifecycle is adopted, so
   * without this the first `Linking.getInitialURL()` after a cold launch
   * would always resolve to null.
   */
  private static func launchOptions(
    from connectionOptions: UIScene.ConnectionOptions
  ) -> [AnyHashable: Any] {
    if let url = connectionOptions.urlContexts.first?.url {
      return [UIApplication.LaunchOptionsKey.url: url]
    }

    let webActivity = connectionOptions.userActivities.first { userActivity in
      userActivity.activityType == NSUserActivityTypeBrowsingWeb
    }
    if let webActivity = webActivity {
      return [
        UIApplication.LaunchOptionsKey.userActivityDictionary: [
          UIApplication.LaunchOptionsKey.userActivityType: webActivity.activityType,
          "UIApplicationLaunchOptionsUserActivityKey": webActivity
        ]
      ]
    }

    return [:]
  }
}
