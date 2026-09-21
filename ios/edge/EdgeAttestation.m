#import <React/RCTBridgeModule.h>

// Objective-C bridge that exposes the Swift `EdgeAttestation` class to the
// React Native (old architecture) bridge.
@interface RCT_EXTERN_MODULE (EdgeAttestation, NSObject)

RCT_EXTERN_METHOD(isSupported
                  : (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAttestation
                  : (NSString *)challenge
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(generateAssertion
                  : (NSString *)challenge
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// keyId is nullable: JS passes the key it means to discard, or null for
// whichever one is stored. Keep this declaration in step with the Swift
// @objc selector - a mismatch is not a build error, it fails at runtime.
RCT_EXTERN_METHOD(clearKey
                  : (NSString *)keyId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
