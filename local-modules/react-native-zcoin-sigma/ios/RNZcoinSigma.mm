
#import "RNZcoinSigma.h"

@implementation RNZcoinSigma

RCT_EXPORT_MODULE();
asdasd
RCT_EXPORT_METHOD(getMintCommitment:(float) denomination privateKey:(NSArray *) nsPrivateKey index:(NSInteger *) nsIndex callback:(RCTResponseSenderBlock) callback)
{
    callback(@[@"ios commitment"])
}

RCT_EXPORT_METHOD(getSpendProof:(float) denomination privateKey:(NSArray *) nsPrivateKey index:(NSInteger *) nsIndex anonymitySet:(NSArray *) nsAnonymitySet groupId:(NSInteger *) groupId blockHash:(NSString *) nsBlockHash
txHash:(NSString *) nsTxHash callback:(RCTResponseSenderBlock) callback)
{
    callback(@[@"ios proof"])
}

@end
  
