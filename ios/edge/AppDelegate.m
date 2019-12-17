/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"
#import "edgeApiKey.h"

#import "RCTSplashScreen.h"
#import <BugsnagReactNative.h>
#import <Firebase.h>
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>
#import <sys/errno.h>
#import <UserNotifications/UserNotifications.h>

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
  [BugsnagReactNative start];
  [FIRApp configure];

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"edge"
                                            initialProperties:nil];

  [RCTSplashScreen open:rootView withImageNamed:@"splash"];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  // Client-side background fetch interval:
  [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:60*60*12];

  // Notification permissions:
  [[UNUserNotificationCenter currentNotificationCenter]
      requestAuthorizationWithOptions:UNAuthorizationOptionBadge | UNAuthorizationOptionAlert
      completionHandler: ^(BOOL granted, NSError *error) {
        if (error) NSLog(@"failed to get notification permission");
        else NSLog(granted ? @"notifications granted" : @"notifications not granted");
      }];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
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
  [self fetchMessagesWithCompletion:^(NSArray *resetUsers, NSError *error) {
    if (error) {
      return completionHandler(UIBackgroundFetchResultNoData);
    }

    NSString *message = @"Someone is trying to reset the 2-factor for these accounts: ";
    for (NSUInteger i = 0; i < resetUsers.count; ++i) {
      if (i == 0) {
        message = [message stringByAppendingString:resetUsers[i]];
      } else {
        message = [message stringByAppendingFormat:@", %@", resetUsers[i]];
      }
    }

    dispatch_async(dispatch_get_main_queue(), ^(void) {
      application.applicationIconBadgeNumber = resetUsers.count;
      if (resetUsers.count == 0) {
        return completionHandler(UIBackgroundFetchResultNoData);
      }

      UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
      content.title = @"Urgent";
      content.body = message;
      UNTimeIntervalNotificationTrigger* trigger = [UNTimeIntervalNotificationTrigger
          triggerWithTimeInterval:1
                          repeats:NO];
      UNNotificationRequest* request = [UNNotificationRequest
          requestWithIdentifier:@"2faReset"
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

typedef void (^MessagesHandler)(NSArray<NSString *> *resetUsers, NSError *error);

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

    // Find messages with 2fa resets:
    NSMutableArray *resetUsers = [[NSMutableArray alloc] init];
    for (NSUInteger i = 0; i < messages.count; ++i) {
      id message = messages[i];
      if (![message isKindOfClass:[NSDictionary class]]) continue;
      NSString *username = loginIds[message[@"loginId"]];
      if (!username) continue;
      id otpResetPending = message[@"otpResetPending"];
      if (otpResetPending &&
        [otpResetPending isKindOfClass:[NSNumber class]] &&
        [((NSNumber *)otpResetPending) boolValue]) {
        [resetUsers addObject:username];
      }
    }

    completionHandler(resetUsers, nil);
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
