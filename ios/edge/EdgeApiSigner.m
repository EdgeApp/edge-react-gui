#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#include <string.h>

#include "edge_api_sign.h"

@interface EdgeApiSigner : NSObject <RCTBridgeModule>
@end

@implementation EdgeApiSigner

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

static NSString *edgeBase64(const uint8_t *bytes, size_t len)
{
  NSData *data = [NSData dataWithBytes:bytes length:len];
  return [data base64EncodedStringWithOptions:0];
}

RCT_EXPORT_METHOD(signMessage
                  : (NSString *)message
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (message == nil) {
    reject(@"EDGE_API_SIGNER", @"message is required", nil);
    return;
  }

  NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
  if (bundleId == nil) {
    reject(@"EDGE_API_SIGNER", @"bundleIdentifier is nil", nil);
    return;
  }

  const char *msg = [message UTF8String];
  size_t msg_len = strlen(msg);
  uint8_t signature[32];

  int rc = edge_api_hmac_sign(
    (const uint8_t *)msg,
    msg_len,
    [bundleId UTF8String],
    signature
  );
  if (rc != 0) {
    reject(@"EDGE_API_SIGNER", @"edge_api_hmac_sign failed", nil);
    return;
  }

  resolve(@{
    @"apiKey" : [NSString stringWithUTF8String:edge_api_key()],
    @"signature" : edgeBase64(signature, 32)
  });
}

RCT_EXPORT_METHOD(getApiKey
                  : (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([NSString stringWithUTF8String:edge_api_key()]);
}

@end
