#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

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

  // Real UTF-8 bytes + explicit length (not UTF8String/strlen, which truncate
  // on embedded NUL and can return NULL for unpaired surrogates).
  NSData *msgData = [message dataUsingEncoding:NSUTF8StringEncoding];
  if (msgData == nil) {
    reject(@"EDGE_API_SIGNER", @"message is not valid UTF-8", nil);
    return;
  }

  const char *bundleCStr = [bundleId UTF8String];
  if (bundleCStr == NULL) {
    reject(@"EDGE_API_SIGNER", @"bundleIdentifier UTF-8 conversion failed", nil);
    return;
  }

  uint8_t signature[32];
  int rc = edge_api_hmac_sign(
    (const uint8_t *)msgData.bytes,
    (size_t)msgData.length,
    bundleCStr,
    signature
  );
  if (rc != 0) {
    reject(@"EDGE_API_SIGNER", @"edge_api_hmac_sign failed", nil);
    return;
  }

  // stringWithUTF8String returns nil on invalid UTF-8, and a nil value in a
  // dictionary literal raises rather than rejecting.
  NSString *apiKey = [NSString stringWithUTF8String:edge_api_key()];
  if (apiKey == nil) {
    reject(@"EDGE_API_SIGNER", @"apiKey is not valid UTF-8", nil);
    return;
  }

  resolve(@{
    @"apiKey" : apiKey,
    @"signature" : edgeBase64(signature, 32)
  });
}

RCT_EXPORT_METHOD(getApiKey
                  : (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *apiKey = [NSString stringWithUTF8String:edge_api_key()];
  if (apiKey == nil) {
    reject(@"EDGE_API_SIGNER", @"apiKey is not valid UTF-8", nil);
    return;
  }
  resolve(apiKey);
}

@end
