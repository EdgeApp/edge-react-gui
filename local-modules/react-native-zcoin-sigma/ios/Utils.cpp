#include "Utils.h"
#include <iostream>
#include <sstream>
#include "libsigma/bitcoin/uint256.h"
#include "libsigma/bitcoin/streams.h"
#include "libsigma/src/coinspend.h"
#include "libsigma/src/sigma_primitives.h"
#include "libsigma/secp256k1/include/secp256k1_group.hpp"
#include "libsigma/secp256k1/include/secp256k1_scalar.hpp"

unsigned char *hex2bin(const char *hexstr) {
    size_t length = strlen(hexstr) / 2;
    unsigned char *chrs = (unsigned char *) malloc((length + 1) * sizeof(*chrs));
    for (size_t i = 0, j = 0; j < length; i += 2, j++) {
        chrs[j] = (hexstr[i] % 32 + 9) % 25 * 16 + (hexstr[i + 1] % 32 + 9) % 25;
    }
    chrs[length] = '\0';
    return chrs;
}

const char *bin2hex(const unsigned char *bytes, int size) {
    std::string str;
    for (int i = 0; i < size; ++i) {
        const unsigned char ch = bytes[i];
        str.append(&hexArray[(ch & 0xF0) >> 4], 1);
        str.append(&hexArray[ch & 0xF], 1);
    }
    return str.c_str();
}

const char *bin2hex(const char *bytes, int size) {
    std::string str;
    for (int i = 0; i < size; ++i) {
        const unsigned char ch = (const unsigned char) bytes[i];
        str.append(&hexArray[(ch & 0xF0) >> 4], 1);
        str.append(&hexArray[ch & 0xF], 1);
    }
    return str.c_str();
}

void bin2hex(const unsigned char* bytes, int size, char *out) {
    std::string str;
    for (int i = 0; i < size; ++i) {
        const unsigned char ch = bytes[i];
        str.append(&hexArray[(ch & 0xF0) >> 4], 1);
        str.append(&hexArray[ch & 0xF], 1);
    }
    memcpy((void*)out, str.c_str(), str.size());
}

void bin2hex(const char *bytes, int size, char *out) {
    std::string str;
    for (int i = 0; i < size; ++i) {
        const unsigned char ch = (const unsigned char) bytes[i];
        str.append(&hexArray[(ch & 0xF0) >> 4], 1);
        str.append(&hexArray[ch & 0xF], 1);
    }
    memcpy((void*)out, str.c_str(), str.size());
}

sigma::PublicCoin CreatePublicCoin(const sigma::CoinDenomination &denomination, const char *script) {
    secp_primitives::GroupElement groupElement;
    groupElement.deserialize(hex2bin(script));
    return sigma::PublicCoin(groupElement, denomination);
}

const char *CreateMintCommitment(sigma::CoinDenomination denomination,
                                    const char *privateKey,
                                    int index) {
    sigma::Params *sigmaParams = sigma::Params::get_default();
    sigma::BIP44MintData bip44MintData = sigma::BIP44MintData(hex2bin(privateKey), index);
    sigma::PrivateCoin privateCoin(sigmaParams, denomination, bip44MintData, ZEROCOIN_TX_VERSION_3);
    const sigma::PublicCoin &publicCoin = privateCoin.getPublicCoin();
    const GroupElement &groupElement = publicCoin.getValue();
    char* result = new char[2 * COMMITMENT_LENGTH + 1];
    memset(result, 0, 2 * COMMITMENT_LENGTH + 1);
    bin2hex(groupElement.getvch().data(), COMMITMENT_LENGTH, result);
    return result;
}
    
const char *CreateSpendProof(sigma::CoinDenomination denomination,
                             const char *privateKey,
                             int index,
                             std::vector<const char *> &anonymity_set,
                             int groupId,
                             const char *blockHash,
                             const char *txHash) {
    sigma::Params *sigmaParams = sigma::Params::get_default();
    sigma::BIP44MintData bip44MintData = sigma::BIP44MintData(hex2bin(privateKey), index);
    sigma::PrivateCoin privateCoin(sigmaParams, denomination, bip44MintData, ZEROCOIN_TX_VERSION_3_1);

    std::vector<sigma::PublicCoin> publicCoins;
    for (auto &commitment : anonymity_set) {
        publicCoins.push_back(CreatePublicCoin(denomination, commitment));
    }

    sigma::SpendMetaData spendMetaData(static_cast<uint32_t>(groupId), uint256S(blockHash), uint256S(txHash));

    sigma::CoinSpend coinSpend(privateCoin.getParams(), privateCoin, publicCoins, spendMetaData, true);
    coinSpend.setVersion(privateCoin.getVersion());

    CDataStream serializedCoinSpend(SER_NETWORK, PROTOCOL_VERSION);
    serializedCoinSpend << coinSpend;

    if (coinSpend.Verify(publicCoins, spendMetaData, true)) {
        char* result = new char[2 * PROOF_LENGTH + 1];
        memset(result, 0, 2 * PROOF_LENGTH + 1);
        bin2hex(serializedCoinSpend.str().c_str(), PROOF_LENGTH, result);
        return result;
    } else {
        return new char[1];
    }
}

const char *GetSerialNumber(sigma::CoinDenomination denomination,
                               const char *privateKey,
                               int index) {
    sigma::Params *sigmaParams = sigma::Params::get_default();
    sigma::BIP44MintData bip44MintData = sigma::BIP44MintData(hex2bin(privateKey), index);
    sigma::PrivateCoin privateCoin(sigmaParams, denomination, bip44MintData, ZEROCOIN_TX_VERSION_3);
    auto* buffer = new unsigned char[SERIAL_NUMBER_LENGTH];
    privateCoin.getSerialNumber().serialize(buffer);
    char* result = new char[2 * SERIAL_NUMBER_LENGTH + 1];
    memset(result, 0, 2 * SERIAL_NUMBER_LENGTH + 1);
    bin2hex(buffer, SERIAL_NUMBER_LENGTH, result);
    return result;
}
