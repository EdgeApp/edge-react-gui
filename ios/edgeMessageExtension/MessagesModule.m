//
//  MessagesModule.m
//  MessagesExtension
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE (MessagesModule, NSObject)

RCT_EXTERN_METHOD(insertSticker
                  : (NSString *)stickerUrl resolver
                  : (RCTPromiseResolveBlock)resolve rejector
                  : (RCTPromiseRejectBlock)reject)

@end
