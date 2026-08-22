import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { engineError } from './errors'

interface WalletTypeAccount {
  currencyConfig: Record<string, { currencyInfo: { walletType: string } }>
}

/**
 * Resolve a wallet id or unique prefix against account.currencyWallets.
 */
export function findWallet(
  account: EdgeAccount,
  prefix: string
): EdgeCurrencyWallet {
  const wallets = account.currencyWallets
  if (wallets[prefix] != null) return wallets[prefix]

  const matches = Object.keys(wallets).filter(id => id.startsWith(prefix))
  if (matches.length === 0) {
    throw engineError(
      'WALLET_NOT_FOUND',
      `No wallet found matching: ${prefix}`,
      404
    )
  }
  if (matches.length > 1) {
    throw engineError(
      'AMBIGUOUS_WALLET_ID',
      `Ambiguous wallet ID "${prefix}"`,
      409,
      { candidates: matches }
    )
  }
  return wallets[matches[0]]
}

/**
 * Resolve an enabled currency plugin id to the wallet type Edge Core expects.
 * Existing wallet type inputs pass through unchanged.
 */
export function resolveWalletType(
  account: WalletTypeAccount,
  walletTypeOrPluginId: string
): string {
  return (
    account.currencyConfig[walletTypeOrPluginId]?.currencyInfo.walletType ??
    walletTypeOrPluginId
  )
}

/**
 * Parse tokenId from path/query. Literal "null" or empty -> null (native).
 */
export function parseTokenId(arg: string | null | undefined): EdgeTokenId {
  if (arg == null || arg === '' || arg === 'null') return null
  return arg
}

export function getCurrencyCode(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string {
  if (tokenId == null) return wallet.currencyInfo.currencyCode
  const token = wallet.currencyConfig.allTokens[tokenId]
  if (token == null) {
    throw engineError('TOKEN_NOT_FOUND', `Unknown token: ${tokenId}`, 404)
  }
  return token.currencyCode
}

export function getMultiplier(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string {
  if (tokenId == null) {
    return wallet.currencyInfo.denominations[0]?.multiplier ?? '1'
  }
  const token = wallet.currencyConfig.allTokens[tokenId]
  if (token == null) {
    throw engineError('TOKEN_NOT_FOUND', `Unknown token: ${tokenId}`, 404)
  }
  return token.denominations[0]?.multiplier ?? '1'
}
