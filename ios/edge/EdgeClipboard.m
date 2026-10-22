#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface EdgeClipboard : NSObject <RCTBridgeModule>
@end

@implementation EdgeClipboard

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(setSensitiveString
                  : (NSString *)text
                  expirySeconds:(double)expirySeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (text == nil) {
    reject(@"EDGE_CLIPBOARD", @"text is required", nil);
    return;
  }

  // The OS removes the item at the expiration date, even if the app is
  // suspended or killed first. Local-only keeps it off Universal Clipboard.
  NSDate *expiry = [NSDate dateWithTimeIntervalSinceNow:expirySeconds];
  [[UIPasteboard generalPasteboard]
    setItems:@[ @{ @"public.utf8-plain-text" : text } ]
     options:@{
       UIPasteboardOptionExpirationDate : expiry,
       UIPasteboardOptionLocalOnly : @YES
     }];
  resolve(nil);
}

@end
