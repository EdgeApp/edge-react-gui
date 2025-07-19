import { EdgeAccount, EdgeCurrencyConfig, EdgeTokenId } from 'edge-core-js'

import { EdgeAsset } from '../types/types'
import { getTokenId } from '../util/CurrencyInfoHelpers'
import { infoServerData } from '../util/network'

interface FioAsset {
  chainCode: string
  tokenCodes?: { [tokenId: string]: string }
}

export interface FioValidationResult {
  isValid: boolean
  error?: string
  fioChainCode?: string
  fioTokenCode?: string
}

/**
 * Special mapping that defines `chain_codes` and `token_codes` for FIO tx's
 * that do not fit the typical pattern of using currency codes
 */
const FIO_ASSET_MAP: { [pluginId: string]: FioAsset } = {
  algorand: {
    chainCode: 'ALGO'
  },
  arbitrum: {
    chainCode: 'ARB'
  },
  avalanche: {
    chainCode: 'AVAX'
  },
  base: {
    chainCode: 'BASE'
  },
  binance: {
    chainCode: 'BNB'
  },
  binancesmartchain: {
    chainCode: 'BSC'
  },
  bitcoin: {
    chainCode: 'BTC'
  },
  bitcoincash: {
    chainCode: 'BCH'
  },
  bobevm: {
    chainCode: 'BOBNETWORK'
  },
  cardano: {
    chainCode: 'ADA'
  },
  celo: {
    chainCode: 'CELO'
  },
  dash: {
    chainCode: 'DASH'
  },
  dogecoin: {
    chainCode: 'DOGE'
  },
  eos: {
    chainCode: 'EOS'
  },
  ethereum: {
    chainCode: 'ETH'
  },
  fantom: {
    chainCode: 'FTM'
  },
  filecoin: {
    chainCode: 'FIL'
  },
  fio: {
    chainCode: 'FIO'
  },
  hedera: {
    chainCode: 'HBAR'
  },
  liberland: {
    chainCode: 'LLD'
  },
  litecoin: {
    chainCode: 'LTC'
  },
  optimism: {
    chainCode: 'OPT'
  },
  polkadot: {
    chainCode: 'DOT'
  },
  polygon: {
    chainCode: 'POL'
  },
  ripple: {
    chainCode: 'XRP'
  },
  solana: {
    chainCode: 'SOL'
  },
  stellar: {
    chainCode: 'XLM'
  },
  tezos: {
    chainCode: 'XTZ'
  },
  tron: {
    chainCode: 'TRX'
  },
  zcash: {
    chainCode: 'ZEC'
  }
}

export const fioCodeToEdgeAsset = (
  account: EdgeAccount,
  fioChainCode: string,
  fioTokenCode: string
): EdgeAsset | undefined => {
  const fioAssets = infoServerData.rollup?.fioAssets ?? FIO_ASSET_MAP

  const pluginId =
    // Check the table first:
    Object.keys(fioAssets).find(
      pluginId => fioAssets[pluginId].chainCode === fioChainCode
    ) ??
    // Otherwise, just match the main currency code:
    Object.keys(account.currencyConfig).find(
      pluginId =>
        account.currencyConfig[pluginId].currencyInfo.currencyCode ===
        fioChainCode
    )

  // Bail out if we don't know about this chain:
  if (pluginId == null) return

  // If the token code matches the chain code, we want the main asset:
  if (fioTokenCode === fioChainCode) return { pluginId, tokenId: null }

  // Find the token being asked for:
  const fioTokens = fioAssets[pluginId]?.tokenCodes ?? {}
  const tokenId =
    // Check the special token mappings for this chain:
    Object.keys(fioTokens).find(
      tokenId => fioTokens[tokenId] === fioTokenCode
    ) ??
    // Otherwise, do a normal token lookup:
    getTokenId(account.currencyConfig[pluginId], fioTokenCode)

  // Bail out if we couldn't find a matching token:
  if (tokenId === undefined) return

  return { pluginId, tokenId }
}

export const tokenIdToFioCode = (
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): { fioChainCode: string; fioTokenCode: string } => {
  const fioAssets = infoServerData.rollup?.fioAssets ?? FIO_ASSET_MAP

  const { pluginId } = currencyConfig.currencyInfo
  const fioChainCode =
    fioAssets[pluginId]?.chainCode ?? currencyConfig.currencyInfo.currencyCode

  // We want the main asset:
  if (tokenId == null) return { fioChainCode, fioTokenCode: fioChainCode }

  const fioTokenCode =
    // Check the special token mappings for this chain:
    fioAssets[pluginId]?.tokenCodes?.[tokenId] ??
    // Otherwise, do a normal token lookup:
    currencyConfig.allTokens[tokenId]?.currencyCode

  if (fioTokenCode == null) {
    throw new Error(`Cannot find ${tokenId} on ${pluginId}`)
  }

  return { fioChainCode, fioTokenCode }
}

/**
 * Validate if an Edge asset can be converted to FIO codes using the whitelist
 * TODO: Integrate into the rest of FIO utils
 */
export const validateFioAsset = (
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): FioValidationResult => {
  const fioAssets = infoServerData.rollup?.fioAssets ?? FIO_ASSET_MAP
  const { pluginId } = currencyConfig.currencyInfo

  // Check if this plugin is supported
  const fioAsset = fioAssets[pluginId]
  if (fioAsset == null) {
    return {
      isValid: false,
      error: `${currencyConfig.currencyInfo.displayName} is not supported by FIO Protocol`
    }
  }

  const fioChainCode = fioAsset.chainCode

  // For native assets (tokenId is null)
  if (tokenId == null) {
    return {
      isValid: true,
      fioChainCode,
      fioTokenCode: fioChainCode
    }
  }

  // For tokens, check if the token is in the whitelist
  const fioTokenCode = fioAsset.tokenCodes?.[tokenId]
  if (fioTokenCode == null) {
    const tokenInfo = currencyConfig.allTokens[tokenId]
    const tokenName =
      tokenInfo?.displayName ?? tokenInfo?.currencyCode ?? tokenId
    return {
      isValid: false,
      error: `${tokenName} is not supported by FIO Protocol`
    }
  }

  return {
    isValid: true,
    fioChainCode,
    fioTokenCode
  }
}
