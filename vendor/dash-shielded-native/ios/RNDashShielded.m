#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNDashShielded, RCTEventEmitter<RCTBridgeModule>)

RCT_EXTERN_METHOD(initialize:(NSString *)seed
:(NSInteger *)account
:(NSString *)alias
:(NSString *)networkName
:(NSString *)defaultHost
:(NSInteger *)defaultPort
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(stop:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(startSync:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(stopSync:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(deriveShieldedAddress:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(deriveShieldedAddressFromSeed:(NSString *)seed
:(NSString *)network
:(NSInteger *)account
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(isValidAddress:(NSString *)address
:(NSString *)network
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(deriveViewingKey:(NSString *)seed
:(NSString *)network
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(warmUpProver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(isProverReady:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(poll:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(proposeTransfer:(NSString *)alias
:(NSString *)amountCredits
:(NSString *)toAddress
:(NSString *)memo
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(createTransfer:(NSString *)alias
:(NSString *)proposalId
:(NSString *)seed
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

@end
