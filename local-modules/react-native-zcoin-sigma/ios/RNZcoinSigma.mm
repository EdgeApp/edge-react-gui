#import "RNZcoinSigma.h"
#include "Utils.h"


@implementation RNZcoinSigma

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getMintCommitment:(float) denomination privateKey:(nonnull NSString*) privateKey index:(NSInteger) index c:(RCTResponseSenderBlock) callback)
{
    sigma::CoinDenomination coinDenomination;
    sigma::IntegerToDenomination((int64_t) (denomination * COIN), coinDenomination);

    const char* cstr = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *commitment = CreateMintCommitment(coinDenomination, cstr, (int) index);
    const char *serialNumber = GetSerialNumber(coinDenomination, cstr, (int) index);
    callback(@[[NSString stringWithUTF8String:commitment], [NSString stringWithUTF8String:serialNumber]]);
    delete commitment;
    delete serialNumber;
}

RCT_EXPORT_METHOD(getSpendProof:(float) denomination privateKey:(nonnull NSString*) privateKey index:(NSInteger) index anonymitySet:(nonnull NSArray*) anonymitySet groupId:(NSInteger) groupId blockHash:(NSString*) blockHash txHash:(NSString*) txHash c:(RCTResponseSenderBlock) callback)
{
    sigma::CoinDenomination coinDenomination;
    sigma::IntegerToDenomination((int64_t) (denomination * COIN), coinDenomination);
    
    const char* cstr = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    
    std::vector<const char *> anonymitySetVector;
    int anonymitySetSize = (int) [anonymitySet count];
    for (int i = 0; i < anonymitySetSize; i++) {
        NSString* string = [anonymitySet objectAtIndex:i];
        const char *rawString = [string cStringUsingEncoding:NSUTF8StringEncoding];
        anonymitySetVector.push_back(rawString);
    }
    
    const char* blockHashC = [blockHash cStringUsingEncoding:NSUTF8StringEncoding];
    const char* txHashC = [txHash cStringUsingEncoding:NSUTF8StringEncoding];
    
    const char* spendProof = CreateSpendProof(coinDenomination,
            cstr, (int) index, anonymitySetVector, (int) groupId, blockHashC, txHashC);
    callback(@[[NSString stringWithUTF8String:spendProof]]);
    delete spendProof;
}

@end
