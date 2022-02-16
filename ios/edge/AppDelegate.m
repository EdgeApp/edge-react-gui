#import "AppDelegate.h"
#import "edgeApiKey.h"

#import <Bugsnag/Bugsnag.h>
#import <Firebase.h>
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import <sys/errno.h>
#import <UserNotifications/UserNotifications.h>

#if DEBUG
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application
  continueUserActivity:(nonnull NSUserActivity *)userActivity
    restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  BugsnagConfiguration *config = [BugsnagConfiguration loadConfig];
  config.enabledBreadcrumbTypes =
    BSGEnabledBreadcrumbTypeError &
    BSGEnabledBreadcrumbTypeNavigation &
    BSGEnabledBreadcrumbTypeState &
    BSGEnabledBreadcrumbTypeUser;
  [Bugsnag startWithConfiguration:config];

  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

#if DEBUG
  InitializeFlipper(application);
#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"edge"
                                            initialProperties:nil];

  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }

  // Client-side background fetch interval:
  [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:60*60*12];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  UIStoryboard *sb = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
  UIViewController *vc = [sb instantiateInitialViewController];
  rootView.loadingView = vc.view;
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)application:(UIApplication *)application
  performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [self fetchMessagesWithCompletion:^(NSArray *problemUsers, NSError *error) {
    if (error) {
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
  }];
}

typedef void (^MessagesHandler)(NSArray<NSString *> *problemUsers, NSError *error);

/**
 * Goes to the auth server and figures out which users have 2fa resets.
 */
- (void)fetchMessagesWithCompletion:(MessagesHandler)completionHandler {
  NSError *error = nil;

  // Locate the `logins` folder:
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,
                                                       NSUserDomainMask, YES);
  NSString *basePath = [paths firstObject];
  NSString *loginsPath = [NSString pathWithComponents:@[ basePath, @"logins" ]];

  // List the logins folder:
  NSFileManager *fs = [NSFileManager defaultManager];
  NSArray *files = [fs contentsOfDirectoryAtPath:loginsPath error:&error];
  if (!files) {
    return completionHandler(@[], nil);
  }

  // Load the files:
  NSMutableDictionary<NSString *, NSString *> *loginIds =
      [[NSMutableDictionary alloc] init];
  for (NSUInteger i = 0; i < files.count; ++i) {
    NSString *where = [NSString pathWithComponents:@[ loginsPath, files[i] ]];
    NSData *data = [NSData dataWithContentsOfFile:where options:0 error:&error];
    if (!data)
      continue;
    id json = [NSJSONSerialization JSONObjectWithData:data
                                              options:0
                                                error:&error];
    if (!json || ![json isKindOfClass:[NSDictionary class]])
      continue;

    if (!json[@"loginAuthBox"]) continue;
    id loginId = json[@"loginId"];
    id username = json[@"username"];
    if (!loginId || ![loginId isKindOfClass:[NSString class]])
      continue;
    if (!username || ![username isKindOfClass:[NSString class]])
      continue;
    loginIds[loginId] = username;
  }

  // Prepare our payload:
  NSDictionary *payloadJson = @{@"loginIds" : [loginIds allKeys]};
  NSData *payloadData = [NSJSONSerialization dataWithJSONObject:payloadJson
                                                        options:0
                                                          error:&error];
  if (!payloadData) {
    return completionHandler(nil, error);
  }

  // Prepare our headers:
  NSURL *url = [NSURL URLWithString:@"https://auth.airbitz.co/api/v2/messages"];
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];
  [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  [request setValue:[@"Token " stringByAppendingString:@EDGE_API_KEY]
      forHTTPHeaderField:@"Authorization"];
  request.HTTPMethod = @"POST";
  request.HTTPBody = payloadData;

  // Prepare to handle the results:
  typedef void (^DataHandler)(NSData *data, NSURLResponse *response, NSError *error);
  DataHandler handler = ^(NSData *data, NSURLResponse *response,
                          NSError *error) {
    if (error) return completionHandler(nil, error);

    // Check the HTTP status code:
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if (httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
        return completionHandler(nil, [self makeReplyError]);
      }
      NSLog(@"status %ld", httpResponse.statusCode);
    } else {
      return completionHandler(nil, [self makeReplyError]);
    }

    // Parse the reply:
    id json = [NSJSONSerialization JSONObjectWithData:data
                                               options:0
                                                 error:&error];
    if (!json) return completionHandler(nil, error);
    if (![json isKindOfClass:[NSDictionary class]]) {
      return completionHandler(nil, [self makeReplyError]);
    }
    id statusCode = json[@"status_code"];
    if (!statusCode ||
        ![statusCode isKindOfClass:[NSNumber class]] ||
        [((NSNumber *)statusCode) integerValue] != 0) {
      return completionHandler(nil, [self makeReplyError]);
    }
    id results = json[@"results"];
    if (!results || ![results isKindOfClass:[NSArray class]]) {
      return completionHandler(nil, [self makeReplyError]);
    }
    NSArray *messages = (NSArray *)results;

    // Find messages with problems:
    NSMutableArray *problemUsers = [[NSMutableArray alloc] init];
    for (NSUInteger i = 0; i < messages.count; ++i) {
      id message = messages[i];
      if (![message isKindOfClass:[NSDictionary class]]) continue;
      NSString *username = loginIds[message[@"loginId"]];
      if (!username) continue;

      id pendingVouchers = message[@"pendingVouchers"];
      BOOL hasVoucher = pendingVouchers &&
        [pendingVouchers isKindOfClass:[NSArray class]] &&
        ((NSArray *)pendingVouchers).count > 0;

      id otpResetPending = message[@"otpResetPending"];
      BOOL hasReset = otpResetPending &&
        [otpResetPending isKindOfClass:[NSNumber class]] &&
        [((NSNumber *)otpResetPending) boolValue];

      if (hasVoucher || hasReset) {
        [problemUsers addObject:username];
      }
    }

    completionHandler(problemUsers, nil);
  };

  // Do the fetch:
  NSLog(@"fetching %@ %@", request.URL, [[NSString alloc]
    initWithData:payloadData encoding:NSUTF8StringEncoding]);
  NSURLSession *fetcher = [NSURLSession sharedSession];
  [[fetcher dataTaskWithRequest:request completionHandler:handler] resume];
}

-(NSError *)makeReplyError
{
  return [NSError errorWithDomain:NSPOSIXErrorDomain code:EBADMSG userInfo:nil];
}

@end
