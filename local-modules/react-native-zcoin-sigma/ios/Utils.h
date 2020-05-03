#ifndef SIGMAANDROIDWRAPPER_UTILS_H
#define SIGMAANDROIDWRAPPER_UTILS_H

#include "libsigma/src/coin.h"

#define ZEROCOIN_TX_VERSION_3 30
#define ZEROCOIN_TX_VERSION_3_1 31

static const int PROTOCOL_VERSION = 90026;

static const int COMMITMENT_LENGTH = 34;
static const int SERIAL_NUMBER_LENGTH = 32;
static const int PROOF_LENGTH = 1319;

char const hexArray[16] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

unsigned char* hex2bin(const char* str);

const char* bin2hex(const unsigned char* bytes, int size);

void bin2hex(const unsigned char* bytes, int size, char *);
void bin2hex(const char *bytes, int size, char *out);

const char* bin2hex(const char* bytes, int size);

sigma::PublicCoin CreatePublicCoin(const sigma::CoinDenomination &denomination, const char *script);

const char* CreateMintCommitment(sigma::CoinDenomination denomination,
                                            const char* privateKey,
                                            int index);

const char* CreateSpendProof(sigma::CoinDenomination denomination,
                              const char* privateKey,
                              int index,
                              std::vector<const char *> &anonymity_set,
                              int groupId,
                              const char* blockHash,
                              const char* txHash);

const char *GetSerialNumber(sigma::CoinDenomination denomination,
                               const char *privateKey,
                               int index);

#endif //SIGMAANDROIDWRAPPER_UTILS_H
