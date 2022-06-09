#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <ReactCommon/RCTTurboModuleManager.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
