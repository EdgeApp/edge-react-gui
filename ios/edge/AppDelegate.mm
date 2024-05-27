#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

// Edge additions:
#import "ExpoModulesCore-Swift.h"
#import "Edge-Swift.h"
#import "RNBootSplash.h"
#import <Bugsnag/Bugsnag.h>
#import <Firebase.h>
#import <FirebaseMessaging.h>
#import <Foundation/Foundation.h>
#import <React/RCTLinkingManager.h>
#import <sys/errno.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate {
  // Edge addition:
  UIView *securityView;
}

// From https://reactnative.dev/docs/0.71/linking#enabling-deep-links
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

// From https://reactnative.dev/docs/0.71/linking#enabling-deep-links
- (BOOL)application:(UIApplication *)application
  continueUserActivity:(nonnull NSUserActivity *)userActivity
    restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // React template code:
  self.moduleName = @"edge";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Native Bugsnag integration:
  BugsnagConfiguration *config = [BugsnagConfiguration loadConfig];
  config.enabledBreadcrumbTypes =
    BSGEnabledBreadcrumbTypeError &
    BSGEnabledBreadcrumbTypeNavigation &
    BSGEnabledBreadcrumbTypeState &
    BSGEnabledBreadcrumbTypeUser;
  [Bugsnag startWithConfiguration:config];

  // Native Firebase integration:
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

  // Client-side background fetch interval:
  [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:60*60*12];

  // React template code:
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// react-native-bootsplash integration:
- (void)customizeRootView:(RCTRootView *)rootView {
  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:rootView];
}

/**
 * Background-fetch logic.
 * Edge addition.
 */
- (void)application:(UIApplication *)application
  performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  EdgeCore *core = [EdgeCore alloc];
  [core fetchPendingLoginsWithCompletion:^(NSArray<NSString *> *problemUsers) {
    if (!problemUsers) {
      return completionHandler(UIBackgroundFetchResultNoData);
    }

    NSString *message = @"Another device is trying to log into: ";
    for (NSUInteger i = 0; i < problemUsers.count; ++i) {
      if (i == 0) {
        message = [message stringByAppendingString:problemUsers[i]];
      } else {
        message = [message stringByAppendingFormat:@", %@", problemUsers[i]];
      }
    }
    printf("Background notification: %s\n", [message UTF8String]);

    dispatch_async(dispatch_get_main_queue(), ^(void) {
      application.applicationIconBadgeNumber = problemUsers.count;
      if (problemUsers.count == 0) {
        return completionHandler(UIBackgroundFetchResultNoData);
      }

      UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
      content.title = @"Urgent Security Issue";
      content.body = message;
      UNTimeIntervalNotificationTrigger* trigger = [UNTimeIntervalNotificationTrigger
          triggerWithTimeInterval:1
                          repeats:NO];
      UNNotificationRequest* request = [UNNotificationRequest
          requestWithIdentifier:@"loginRequest"
                        content:content
                        trigger:trigger];
      [[UNUserNotificationCenter currentNotificationCenter]
          addNotificationRequest:request
           withCompletionHandler:^(NSError *error) {
            completionHandler(UIBackgroundFetchResultNewData);
           }];
    });

    NSString *token = [FIRMessaging messaging].FCMToken;
    if (token) {
      [core updatePushTokenWithToken:token completion:^(BOOL success) {
      }];
    }
  }];
}

/**
 * Hides the app when we go into the background.
 * Edge addition.
 */
- (void)applicationDidEnterBackground:(UIApplication *)application
{
  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
  UIViewController *launchScreen = [storyboard instantiateInitialViewController];
  if (launchScreen == nil) return;
  UIView *launchView = launchScreen.view;
  if (launchView == nil) return;

  launchView.frame = self.window.bounds;
  [self.window addSubview:launchView];
  [self.window makeKeyAndVisible];
  securityView = launchView;
}

/**
 * Shows the app when we come into the foreground.
 * Edge addition.
 */
- (void)applicationWillEnterForeground:(UIApplication *)application
{
  if (securityView != nil) {
    [securityView removeFromSuperview];
    securityView = nil;
  }
}

@end
