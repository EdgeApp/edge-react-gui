import type { EdgeAccount, EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'

import { fetchToken, serverTokenToEdgeToken } from '../util/tokenService'

/**
 * Migrates enabled tokens from builtin tokens to custom tokens by fetching
 * them from the rates server. This runs after account login to ensure users
 * upgrading to the new codebase have their enabled tokens available as custom tokens.
 *
 * @param account - The logged-in account
 * @returns Promise that resolves when migration is complete
 */
export async function migrateEnabledTokensFromServer(
  account: EdgeAccount
): Promise<void> {
  const { currencyWallets } = account
  const tokensToMigrate = new Map<string, Set<string>>() // pluginId -> Set<tokenId>

  // Collect all enabled tokenIds grouped by pluginId from all wallets
  for (const walletId in currencyWallets) {
    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
    const { currencyInfo, currencyConfig, enabledTokenIds } = wallet
    const { pluginId } = currencyInfo
    const { customTokens } = currencyConfig

    // Get or create the set for this pluginId
    let tokenSet = tokensToMigrate.get(pluginId)
    if (tokenSet == null) {
      tokenSet = new Set()
      tokensToMigrate.set(pluginId, tokenSet)
    }

    // Add enabled tokenIds that aren't already in customTokens
    for (const tokenId of enabledTokenIds) {
      if (customTokens[tokenId] == null) {
        tokenSet.add(tokenId)
      }
    }
  }

  // If no migration needed, return early
  if (tokensToMigrate.size === 0) {
    return
  }

  // Fetch missing tokens from the server and add them to customTokens
  const currencyConfigs = account.currencyConfig
  let migratedCount = 0

  for (const [pluginId, tokenIds] of tokensToMigrate) {
    const currencyConfig = currencyConfigs[pluginId]
    if (currencyConfig == null) continue

    const results = await Promise.allSettled(
      Array.from(tokenIds).map(
        async tokenId => await fetchToken({ tokenId, pluginId })
      )
    )

    const tokensToAdd: EdgeToken[] = []
    const tokenIdArray = Array.from(tokenIds)
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const tokenId = tokenIdArray[i]
      if (result.status === 'rejected') {
        console.warn(
          `Token migration: Failed to migrate ${pluginId}:${tokenId}:`,
          result.reason
        )
        continue
      }
      if (result.value == null) {
        console.warn(
          `Token migration: Could not fetch token ${pluginId}:${tokenId} from server`
        )
        continue
      }
      const edgeToken = serverTokenToEdgeToken(result.value)
      tokensToAdd.push(edgeToken)
      console.log(
        `Token migration: Migrated ${pluginId}:${tokenId} (${edgeToken.currencyCode})`
      )
    }

    if (tokensToAdd.length > 0) {
      await currencyConfig.addCustomTokens(tokensToAdd)
    }
    migratedCount += tokensToAdd.length
  }

  if (migratedCount > 0) {
    console.log(
      `Token migration: Successfully migrated ${migratedCount} tokens`
    )
  }
}
