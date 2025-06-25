import { EdgeAccount } from 'edge-core-js'

import { EdgeAsset } from '../types/types'
import { getTokenId } from '../util/CurrencyInfoHelpers'
import { infoServerData } from '../util/network'

export interface FioAsset {
  chainCode: string
  tokenCodes: { [tokenId: string]: string }
}

/**
 * Special mapping that defines `chain_codes` and `token_codes` for FIO tx's
 * that do not fit the typical pattern of using currency codes
 */
export const FIO_ASSET_MAP: { [pluginId: string]: FioAsset } = {
  abstract: {
    chainCode: 'ABSTRACT',
    tokenCodes: {}
  },
  ethereum: {
    chainCode: 'ETH', // Make this explicit so L2's don't take it
    tokenCodes: {}
  },
  ethereumpo: {
    chainCode: 'ETHEREUMPO',
    tokenCodes: {}
  },
  optimism: {
    chainCode: 'OPT',
    tokenCodes: {}
  },
  bobevm: {
    chainCode: 'BOBNETWORK',
    tokenCodes: {}
  },
  zksync: {
    chainCode: 'ZKSYNC',
    tokenCodes: {}
  },
  binancesmartchain: {
    chainCode: 'BSC',
    tokenCodes: {}
  },
  sonic: {
    chainCode: 'SONIC',
    tokenCodes: {}
  },
  ripple: {
    chainCode: 'XRP',
    tokenCodes: {
      'USD-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': 'USDGH',
      'EUR-rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq': 'EURGH',
      'USD-rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B': 'USDBS',
      'EUR-rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B': 'EURBS',
      'USD-rEn9eRkX25wfGPLysUMAvZ84jAzFNpT5fL': 'USDST'
    }
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
