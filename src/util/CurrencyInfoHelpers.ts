import type {
  EdgeAccount,
  EdgeCurrencyConfig,
  EdgeCurrencyInfo,
  EdgeCurrencyWallet,
  EdgeToken,
  EdgeTokenId,
  EdgeTokenMap,
  JsonObject
} from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { ENV } from '../env'
import type { EdgeAsset } from '../types/types'
import { asMaybeContractLocation } from './cleaners'

/**
 * Returns true if this currency supports existing wallets,
 * but doesn't allow new wallets.
 */
export function isKeysOnlyPlugin(pluginId: string): boolean {
  const { keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  return keysOnlyMode || ENV.KEYS_ONLY_PLUGINS[pluginId]
}

export type FindTokenParams =
  | {
      account: EdgeAccount
      pluginId: string
      networkLocation: JsonObject
    }
  | {
      allTokens: EdgeTokenMap
      networkLocation: JsonObject
    }

export const findTokenIdByNetworkLocation = (
  params: FindTokenParams
): EdgeTokenId | undefined => {
  const { networkLocation } = params
  let allTokens: EdgeTokenMap
  if ('allTokens' in params) {
    allTokens = params.allTokens
  } else {
    allTokens = params.account.currencyConfig[params.pluginId]?.allTokens
    if (allTokens == null) return
  }

  for (const tokenId in allTokens) {
    const edgeToken = allTokens[tokenId]
    if (edgeToken == null) return
    let found = true
    for (const key in networkLocation) {
      const left = edgeToken?.networkLocation?.[key]
      const right = networkLocation[key]
      if (left === undefined) {
        // If the key is not found then assume this key doesn't exist in any token
        // and we can early return undefined
        console.warn(`findTokenIdByNetworkLocation: key '${key}' not found`)
        return
      }
      if (left === right) continue

      // In the special case of EVM contract addresses which are valid in both lower and upper case,
      // we need to compare them case-insensitively. We know the stored contract address is lower case
      // so only lower case the parameter if it's a string.
      if (typeof right === 'string') {
        if (left === right.toLowerCase()) {
          continue
        }
      }
      found = false
      break
    }
    if (found) {
      return tokenId
    }
  }
  // If we get here, return undefined as we found no match
}

export const getTokenId = (
  currencyConfig: EdgeCurrencyConfig,
  currencyCode: string
): EdgeTokenId | undefined => {
  if (currencyConfig == null) return
  if (currencyConfig.currencyInfo.currencyCode === currencyCode) return null
  const { allTokens } = currencyConfig
  const tokenId = Object.keys(allTokens).find(
    edgeToken => allTokens[edgeToken].currencyCode === currencyCode
  )
  return tokenId
}

/**
 * Get the currencyCode associated with a tokenId
 */
export const getCurrencyCode = (
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string => {
  if (tokenId == null) {
    return wallet.currencyInfo.currencyCode
  } else {
    if (wallet.currencyConfig.allTokens[tokenId] == null) {
      // Fail gracefully if we don't have the token for some reason
      console.warn(
        `getCurrencyCode: tokenId: '${tokenId}' not found for wallet pluginId: '${wallet.currencyInfo.pluginId}'`
      )
      return ''
    }
    return wallet.currencyConfig.allTokens[tokenId].currencyCode
  }
}

/**
 * Get the currencyCode associated with a tokenId
 */
export const getCurrencyCodeWithAccount = (
  account: EdgeAccount,
  pluginId: string,
  tokenId: EdgeTokenId
): string | undefined => {
  if (account.currencyConfig[pluginId] == null) {
    return
  }

  if (tokenId == null) {
    return account.currencyConfig[pluginId].currencyInfo.currencyCode
  } else {
    if (account.currencyConfig[pluginId].allTokens[tokenId] == null) {
      // Fail gracefully if we don't have the token for some reason
      console.warn(
        `getCurrencyCodeWithAccount: tokenId: '${tokenId}' not found for pluginId: '${pluginId}'`
      )
      return ''
    }
    return account.currencyConfig[pluginId].allTokens[tokenId].currencyCode
  }
}

export const getToken = (
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): EdgeToken | undefined => {
  if (tokenId == null) {
    // Either special handling should be done by the caller, or the workflow should not allow this to execute.
  } else {
    const allTokens = wallet.currencyConfig.allTokens
    if (allTokens[tokenId] == null) {
      showError(`Could not find tokenId ${tokenId}`)
      return
    }
    return allTokens[tokenId]
  }
}

/**
 * Extracts the contract address from an EdgeToken using its tokenId.
 *
 * This utility function safely retrieves the contract address from a token's
 * networkLocation object. It's designed to work with EVM-based tokens that
 * have contract addresses stored in their networkLocation metadata.
 *
 * @param currencyConfig - The EdgeCurrencyConfig containing the token information
 * @param tokenId - The unique identifier for the token. If null, this represents
 *                  the native currency of the blockchain (e.g., ETH on Ethereum)
 *                  and will return null since native currencies don't have contract addresses.
 *
 * @returns The contract address as a string, or null if tokenId is null (native currency)
 *
 * @throws {Error} When tokenId is not null but:
 *   - The token cannot be found in the currency config
 *   - The token exists but has no networkLocation
 *   - The networkLocation exists but has no contractAddress
 *
 * @example
 * ```typescript
 * // Get USDC contract address on Ethereum
 * const usdcTokenId = getTokenId(ethConfig, 'USDC')
 * const contractAddress = getContractAddress(ethConfig, usdcTokenId)
 * // Returns: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
 *
 * // Native currency (ETH) has no contract address
 * const ethContractAddress = getContractAddress(ethConfig, null)
 * // Returns: null
 * ```
 *
 * @see asMaybeContractLocation - The cleaner function used to safely extract contract addresses
 * @see getTokenId - Helper to get tokenId from currency code (deprecated pattern)
 */
export const getContractAddress = (
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): string | null => {
  // Native currency (tokenId === null) has no contract address
  if (tokenId == null) return null

  // Get the EdgeToken from the currency config
  const edgeToken = currencyConfig.allTokens[tokenId]
  if (edgeToken == null) {
    throw new Error(
      `getContractAddress: Cannot find token for tokenId "${tokenId}" in ${currencyConfig.currencyInfo.pluginId}`
    )
  }

  // Extract contract address using the safe cleaner utility
  const contractLocation = asMaybeContractLocation(edgeToken.networkLocation)
  if (contractLocation == null) {
    throw new Error(
      `getContractAddress: No contract address found for tokenId "${tokenId}" in ${
        currencyConfig.currencyInfo.pluginId
      }. Token networkLocation: ${JSON.stringify(edgeToken.networkLocation)}`
    )
  }

  return contractLocation.contractAddress
}

export function checkAssetFilter(
  details: EdgeAsset,
  allowedAssets?: EdgeAsset[],
  excludeAssets?: EdgeAsset[]
): boolean {
  if (allowedAssets != null && !hasAsset(allowedAssets, details)) {
    return false
  }
  if (excludeAssets != null && hasAsset(excludeAssets, details)) {
    return false
  }
  return true
}

/**
 * Returns true if the asset array includes the given asset.
 */
export function hasAsset(assets: EdgeAsset[], target: EdgeAsset): boolean {
  for (const asset of assets) {
    if (
      asset.pluginId === target.pluginId &&
      asset.tokenId === target.tokenId
    ) {
      return true
    }
  }
  return false
}

/**
 * The `currencyCodes` are in the format "ETH:DAI",
 */
export const currencyCodesToEdgeAssets = (
  account: EdgeAccount,
  currencyCodes: string[]
): EdgeAsset[] => {
  const chainCodePluginIdMap = Object.keys(account.currencyConfig).reduce(
    (map: Record<string, string>, pluginId) => {
      const chainCode =
        account.currencyConfig[pluginId].currencyInfo.currencyCode
      map[chainCode] ??= pluginId
      return map
    },
    { BNB: 'binancesmartchain', ETH: 'ethereum' } // HACK: Prefer BNB Smart Chain over Beacon Chain if provided a BNB currency code) and Ethereum over L2s
  )

  const edgeTokenIds: EdgeAsset[] = []

  for (const code of currencyCodes) {
    const [parent, child] = code.split(':')
    const pluginId = chainCodePluginIdMap[parent]
    const currencyConfig = account.currencyConfig[pluginId]
    if (currencyConfig == null) continue

    // Add the mainnet EdgeAsset if we haven't yet
    if (
      edgeTokenIds.find(
        edgeTokenId =>
          edgeTokenId.tokenId == null && edgeTokenId.pluginId === pluginId
      ) == null
    ) {
      edgeTokenIds.push({ pluginId, tokenId: null })
    }

    // Add tokens
    if (child != null) {
      const tokenId = Object.keys(currencyConfig.builtinTokens).find(
        tokenId => currencyConfig.builtinTokens[tokenId].currencyCode === child
      )
      if (tokenId != null) edgeTokenIds.push({ pluginId, tokenId })
    }
  }

  return edgeTokenIds
}

/**
 * Find the currencyInfo for the given walletType
 */
export const findCurrencyInfo = (
  account: EdgeAccount,
  walletType: string
): EdgeCurrencyInfo | undefined => {
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const config = account.currencyConfig[pluginId]
    if (config.currencyInfo.walletType === walletType)
      return config.currencyInfo
  }
}
