# iOS 26 migration: UIScene lifecycle, and what is left before Xcode 27

Status: the UIScene lifecycle adoption described in "What shipped" is done.
Everything under "What is still owed" is not.

## Why this exists

Building Edge with the iOS 26 SDK turns on Apple's Liquid Glass design system for
every standard UIKit control. That conflicts with Edge's own styling, so
`ios/edge/Info.plist` currently sets `UIDesignRequiresCompatibility` to opt out.
Apple has said that flag goes away in the next major Xcode, so the opt-out stops
working as soon as the build boxes move to Xcode 27 (expected around September
2026). The work below has to land before that move, and it cannot wait on the
React Native 0.86 upgrade, which is tracked separately and is not ready.

## What shipped

`AppDelegate` no longer owns a window. `ios/edge/SceneDelegate.swift` adopts
`UIWindowSceneDelegate`, `Info.plist` declares a single-scene
`UIApplicationSceneManifest`, and `AppDelegate` vends the scene configuration.
This removes the three deprecated call sites the audit flagged:
`UIWindow(frame: UIScreen.main.bounds)`, `applicationDidEnterBackground`, and
`applicationWillEnterForeground`. It also replaces `applicationIconBadgeNumber`
(deprecated in iOS 17) with `UNUserNotificationCenter.setBadgeCount`, guarded for
the iOS 15.6 deployment target.

Two things about React Native 0.79 made this more than a file split, and both are
worth knowing before anyone touches this code again:

1. **React Native has no scene-aware linking entry points.** `RCTLinkingManager`
   only exposes the `UIApplicationDelegate` forms, and `getInitialURL` reads the
   cold-launch URL out of `bridge.launchOptions`. iOS stops putting deep-link keys
   into `didFinishLaunchingWithOptions` the moment a scene manifest exists, so the
   scene rebuilds those launch options from `UIScene.ConnectionOptions` before
   starting React Native. Without that step, `Linking.getInitialURL()` resolves to
   null on every cold-launch deep link, and nothing crashes to tell you.
2. **`@react-native-firebase/messaging` reads `application.delegate.window`.** Its
   `UIApplicationDidFinishLaunchingNotification` observer walks
   `delegate.window.rootViewController.view` looking for an `RCTRootView`. A
   delegate with no `window` property at all raises `doesNotRecognizeSelector` and
   the app aborts on launch. `AppDelegate` therefore keeps a `window` property that
   the scene mirrors its own window into.

Both are React Native 0.79 and Firebase facts, not Edge choices, so re-check them
after the 0.86 upgrade rather than assuming the shims are still needed.

### How it was verified

Driven on an iOS 18.6 simulator against a debug build, with temporary logging in
the scene callbacks that was removed before commit:

- Cold launch reaches the wallet list, and a Buy quote resolves, so window
  creation and the React Native start path work under the scene.
- Backgrounding logs `sceneDidEnterBackground`, and the next foreground observes
  the LaunchScreen privacy overlay present and removes it, so both halves of the
  privacy screen survived the move.
- A cold launch from `edge://...` arrives with `UIApplicationLaunchOptionsURLKey`
  populated, and the app surfaces its own "Unknown deep link format" banner, which
  proves the URL travelled from the scene through `getInitialURL` into JS.
- A warm `edge://...` reaches `scene(_:openURLContexts:)`.
- `setBadgeCount` puts the requested count on the home-screen icon once badge
  authorization is granted.
- Home-screen quick actions reach `windowScene(_:performActionFor:)` while the app
  runs, and `connectionOptions.shortcutItem` on a cold launch, both ending in Safari
  on the action's URL. The item replayed through those entry points is the real one
  `QuickActionsManager` registers, taken back out of `UIApplication.shortcutItems`,
  because SpringBoard's icon context menu cannot be opened from the test harness.
- A universal link reaches JS through both the cold path
  (`launchOptions(from:)` rebuilding the `userActivityDictionary`, which the app
  answers with "Parsing link...") and the warm path (`scene(_:continue:)`, answered
  with "No wallets exist that support this link."). Those two are driven from a
  synthesized `NSUserActivity` rather than a real link, for the reason below.
- The Release configuration compiles.

### Universal links are not associated today

`edge.app` serves a 404 HTML page at `/.well-known/apple-app-site-association`, and
Apple's CDN has no entry for the domain. The app ships
`com.apple.developer.associated-domains: applinks:edge.app`, but with no association
file iOS never hands the app a browsing-web activity, so both universal-link paths
are unreachable in production regardless of this change. That is worth fixing on its
own, and until it is, the scene code above cannot be exercised by a real link.

## What is still owed before Xcode 27

### 1. Remove `UIDesignRequiresCompatibility`

This is the item with the hard deadline, and it is a visual-QA problem rather than
a code problem. Edge draws almost everything itself in React Native, so the
exposure is limited to the places where UIKit still renders:

| Surface | Where | Risk |
|---|---|---|
| Status bar | `src/components/services/StatusBarManager.tsx` | Contrast against the themed header |
| Blur backgrounds | `src/components/common/BlurBackground.tsx`, `QrModal`, `LoginScene` (rn-id-blurview) | Liquid Glass changes what a `UIBlurEffect` looks like |
| Native modals and alerts | `react-native-screens` presentation, system alerts | New material behind sheets |
| Tab bar and safe-area math | `src/components/themed/MenuTabs.tsx`, `useSafeAreaInsets` callers | Inset changes shift the custom tab bar |
| Keyboard accessory | Amount-entry scenes | New keyboard chrome height |

The work is: flip the flag locally, walk those surfaces on an iOS 26 simulator,
and fix what breaks. Doing it behind the flag first is safe, because the flag is
still honored on Xcode 26 build boxes, so the fixes can land ahead of the removal
and the flag can be deleted in a small follow-up.

### 2. Navigation stack

React Navigation 6 with `react-native-screens` 4.16. The v7 and v8 line is where
the iOS 26 presentation work lands upstream. This is the piece most entangled with
the React Native 0.86 upgrade, so sequence it after that lands rather than doing it
twice.

### 3. Re-check the two shims after React Native 0.86

The launch-options rebuild and the `AppDelegate.window` mirror both exist to work
around versions of React Native and Firebase we happen to be on. Newer React Native
adds its own scene handling, and keeping a hand-rolled copy alongside it is how you
get two competing deep-link paths.

## Deadline

Practical deadline is the Xcode 27 move, around September 2026, not an iOS 27
launch date. Treat it as a Q3 2026 completion target. Item 1 is the only one that
strictly must land by then. Items 2 and 3 are cleanup that gets cheaper if it
follows the React Native 0.86 upgrade instead of racing it.
