#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNZcash, RCTEventEmitter<RCTBridgeModule>)

// Synchronizer
RCT_EXTERN_METHOD(initialize:(NSString *)seed
:(NSInteger *)birthdayHeight
:(NSString *)alias
:(NSString *)networkName
:(NSString *)defaultHost
:(NSInteger *)defaultPort
:(BOOL *)newWallet
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(stop:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(getLatestNetworkHeight:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(getBirthdayHeight:(NSString *)host
:(NSInteger *)port
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(proposeTransfer:(NSString *)alias
:(NSString *)zatoshi
:(NSString *)toAddress
:(NSString *)memo
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(proposeFulfillingPaymentURI:(NSString *)alias
:(NSString *)paymentUri
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(createTransfer:(NSString *)alias
:(NSString *)proposalBase64
:(NSString *)seed
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(broadcastTransfer:(NSString *)alias
:(NSString *)txid
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(shieldFunds:(NSString *)alias
:(NSString *)seed
:(NSString *)memo
:(NSString *)threshold
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(rescan:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(emitExistingTransactions:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

// Derivation tool
RCT_EXTERN_METHOD(deriveViewingKey:(NSString *)seed
:(NSString *)network
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(deriveUnifiedAddress:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(isValidAddress:(NSString *)address
:(NSString *)network
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

// Orchard -> Ironwood migration (NU6.3)
RCT_EXTERN_METHOD(proposeOrchardToIronwoodMigration:(NSString *)alias
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)
RCT_EXTERN_METHOD(ironwoodActivationHeight:(NSString *)networkName
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(poll:(NSString *)alias
resolver:(RCTPromiseResolveBlock)resolve
rejecter:(RCTPromiseRejectBlock)reject
)

// Events
RCT_EXTERN_METHOD(supportedEvents)

@end
