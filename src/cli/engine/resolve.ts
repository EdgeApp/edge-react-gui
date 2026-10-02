import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { getExchangeDenom } from '../../util/exchangeDenom'
import { hasOwn } from '../../util/predicates'
import { engineError } from './errors'

/**
 * Resolve a wallet id or unique prefix against account.currencyWallets.
 */
export function findWallet(
  account: EdgeAccount,
  prefix: string
): EdgeCurrencyWallet {
  // Belt and braces with `asWalletId`: `''` is a prefix of every wallet, so
  // on a single-wallet account it would resolve to that wallet rather than
  // reporting a missing field — and this function is what `spend` resolves
  // through.
  if (prefix === '') {
    throw engineError('BAD_REQUEST', 'walletId must not be empty', 400)
  }
  const wallets = account.currencyWallets
  // `hasOwn`, not `wallets[prefix] != null`. `currencyWallets` is a plain
  // object literal, so `wallets['__proto__']` is `Object.prototype` and that
  // test passed: `--wallet-id=__proto__` returned the prototype cast as an
  // `EdgeCurrencyWallet` and the first `wallet.currencyInfo.pluginId` was a
  // `TypeError` — `500 INTERNAL_ERROR` where this function's whole job is to
  // answer `WALLET_NOT_FOUND`. `constructor`, `toString`, `valueOf` and the
  // rest behave the same way.
  if (hasOwn(wallets, prefix)) return wallets[prefix]

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
 * Resolve a wallet id over `allKeys`, not the loaded wallets.
 *
 * `findWallet` searches `account.currencyWallets`, which core builds only
 * from `activeWalletIds` and only for wallets whose api exists — so an
 * archived wallet, or one whose currency plugin this engine did not load, is
 * absent from it. That is right for anything that needs a live
 * `EdgeCurrencyWallet`, and wrong for the calls that only need an id:
 * `getRawPrivateKey`, `getDisplayPrivateKey`, `getRawPublicKey`,
 * `listSplittableWalletTypes` and `changeWalletStates` all work off
 * `allKeys`. Resolving those through the loaded set made key export answer
 * `WALLET_NOT_FOUND` for a wallet `all-keys` had just listed — on the
 * disaster-recovery path a CLI key export exists for.
 *
 * Same prefix contract and same errors as `findWallet`, so a caller cannot
 * tell the two apart except by which wallets they can reach.
 */
export function findWalletId(account: EdgeAccount, prefix: string): string {
  if (prefix === '') {
    throw engineError('BAD_REQUEST', 'walletId must not be empty', 400)
  }
  const ids = account.allKeys.map(info => info.id)
  if (ids.includes(prefix)) return prefix

  const matches = ids.filter(id => id.startsWith(prefix))
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
  return matches[0]
}

/**
 * Refuse a tokenId the wallet's plugin does not know.
 *
 * Over REST a tokenId is free-form caller input, where in the GUI it always
 * came from a real token. Core does not check it: `wallet.getTransactions`,
 * `getNumTransactions` and `getAddresses` all destructure the token's own
 * record and throw a `TypeError` that surfaces as `500 INTERNAL_ERROR` with
 * no field name, outside every error list those routes declare.
 */
export function assertTokenId(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): void {
  if (tokenId == null) return
  // `hasOwn`: `allTokens` is a plain object literal built with a spread, so
  // `allTokens['__proto__'] == null` is **false** and this guard returned
  // without throwing — which defeats the entire function, as the comment
  // above describes.
  if (!hasOwn(wallet.currencyConfig.allTokens, tokenId)) {
    throw engineError('TOKEN_NOT_FOUND', `Unknown token: ${tokenId}`, 404)
  }
}

/**
 * The multiplier an asset reports amounts in.
 *
 * Through `getExchangeDenom`, which this branch added and which already
 * answers exactly this: the hand-rolled `denominations[0]?.multiplier ?? '1'`
 * was written out twice here. The `TOKEN_NOT_FOUND` throw is kept, because
 * `getExchangeDenom`'s own fallback for an unknown token is a multiplier of
 * `1`, which is a silently wrong number rather than an error.
 */
export function getMultiplier(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string {
  assertTokenId(wallet, tokenId)
  return getExchangeDenom(wallet.currencyConfig, tokenId).multiplier
}
