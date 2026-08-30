#import "ZanoModule.h"
#import <React/RCTLog.h>
#include "zano-methods.hpp"

@implementation ZanoModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_REMAP_METHOD(
  callZano,
  callZanoMethod:(NSString *)method
  arguments:(NSArray *)arguments
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
  const std::string methodString = [method UTF8String];

  // Re-package the arguments:
  NSUInteger length = [arguments count];
  std::vector<std::string> strings;
  strings.reserve(length);
  for (NSUInteger i = 0; i < length; ++i) {
    NSString *string = [arguments objectAtIndex:i];
    strings.push_back([string UTF8String]);
  }

  // Find the named method:
  for (int i = 0; i < zanoMethodCount; ++i) {
    if (zanoMethods[i].name != methodString) continue;

    // Validate the argument count:
    if (zanoMethods[i].argc != strings.size()) {
      reject(@"Error", @"zano incorrect C++ argument count", nil);
      return;
    }

    // Call the method, with error handling:
    try {
      const std::string out = zanoMethods[i].method(strings);
      resolve(
        [NSString stringWithCString:out.c_str() encoding:NSUTF8StringEncoding]
      );
    } catch (std::exception &e) {
      reject(
        @"Error",
        [NSString stringWithCString:e.what() encoding:NSUTF8StringEncoding],
        nil
      );
    } catch (...) {
      reject(@"Error", @"zano threw a C++ exception", nil);
    }
    return;
  }

  reject(
    @"TypeError",
    [NSString stringWithFormat:@"No zano C++ method %@", method],
    nil
  );
}

/**
 * Creates a directory the Zano SDK writes into, and keeps it out of
 * device backups. The wallet files hold the seed and spend keys, so they
 * must not reach an unencrypted Finder backup.
 *
 * The SDK creates these itself on first use, but only we can set the
 * backup flag, and that requires the directory to already exist.
 */
static BOOL prepareZanoDirectory(NSURL *parent, NSString *name)
{
  NSURL *url = [parent URLByAppendingPathComponent:name isDirectory:YES];

  NSError *error = nil;
  if (![[NSFileManager defaultManager] createDirectoryAtURL:url
        withIntermediateDirectories:YES
        attributes:nil
        error:&error]) {
    RCTLogWarn(@"zano could not create %@: %@", name, error);
    return NO;
  }

  if (![url setResourceValue:@YES
        forKey:NSURLIsExcludedFromBackupKey
        error:&error]) {
    RCTLogWarn(@"zano could not exclude %@ from backups: %@", name, error);
    return NO;
  }

  return YES;
}

- (NSDictionary *)constantsToExport
{
  NSMutableArray *out = [NSMutableArray arrayWithCapacity:zanoMethodCount];
  for (int i = 0; i < zanoMethodCount; ++i) {
    NSString *name = [NSString stringWithCString:zanoMethods[i].name
      encoding:NSUTF8StringEncoding];
    out[i] = name;
  }

  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSError *docsError = nil;
  NSURL *docsDir = [fileManager URLForDirectory:NSDocumentDirectory
    inDomain:NSUserDomainMask
    appropriateForURL:nil
    create:YES
    error:&docsError];
  if (docsDir == nil) {
    RCTLogWarn(@"zano could not resolve the documents directory: %@", docsError);
    return @{ @"methodNames": out };
  }

  // Every directory the SDK derives from the working directory we hand it.
  // `scripts/update-sources.ts` fails the build if this list drifts from the
  // folder names declared in the SDK's `plain_wallet_api.cpp`.
  //
  // `wallets` holds the seed and spend keys, so failing to create it or to
  // mark it excluded from backups is fatal: withholding
  // `documentDirectory` stops the bridge in its constructor instead of
  // letting the SDK write keys somewhere an unencrypted Finder backup would
  // pick up. `logs` and `app_config` carry no key material.
  BOOL walletsReady = prepareZanoDirectory(docsDir, @"wallets");
  prepareZanoDirectory(docsDir, @"logs");
  prepareZanoDirectory(docsDir, @"app_config");
  if (!walletsReady) {
    return @{ @"methodNames": out };
  }

  return @{
    @"methodNames": out,
    @"documentDirectory": [docsDir path]
  };
}

@end
