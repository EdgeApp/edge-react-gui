#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

// Edge additions:
#import "Edge-Swift.h"
#import "RNBootSplash.h"
#import <Bugsnag/Bugsnag.h>
#import <Firebase.h>
#import <FirebaseMessaging.h>
#import <Foundation/Foundation.h>
#import <React/RCTLinkingManager.h>
#import <sys/errno.h>
#import <UserNotifications/UserNotifications.h>

@implementation AppDelegate

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
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

// react-native-bootsplash integration:
- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps {
  UIView *rootView = [super createRootViewWithBridge:bridge
                                          moduleName:moduleName
                                           initProps:initProps];

  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:rootView];

  return rootView;
}

// Edge background-fetch logic:
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

@end
