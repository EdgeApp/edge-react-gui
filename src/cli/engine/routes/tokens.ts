import { asArray, asObject, asString } from 'cleaners'

import { doc } from '../doc'
import { findWallet } from '../resolve'
import { route } from '../route'
import { asCoreValue, asEnabledTokens } from '../schemas'
import { getAccount } from './helpers'

/**
 * List a wallet's tokens.
 *
 * "Enabled" tokens are the ones the wallet syncs balances for; "detected" ones
 * were seen on-chain but are not yet enabled.
 *
 * @coreNote Engine composite of the EdgeCurrencyConfig token maps plus
 *   wallet.enabledTokenIds and wallet.detectedTokenIds.
 */
export const walletTokens = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/wallets/{walletId}/tokens',
  cli: 'wallet-tokens',
  returns: asObject({
    allTokens: doc(
      asObject(asCoreValue),
      'Built-in and custom together, keyed by tokenId. Large on EVM chains.'
    ),
    builtinTokens: doc(
      asObject(asCoreValue),
      '`EdgeToken` by tokenId: everything the plugin ships with.'
    ),
    customTokens: doc(
      asObject(asCoreValue),
      '`EdgeToken` by tokenId: tokens this account added by hand.'
    ),
    enabledTokenIds: doc(
      asArray(asString),
      'Which of the above the wallet is actually tracking.'
    ),
    detectedTokenIds: doc(
      asArray(asString),
      'Seen on-chain but not enabled, so their balances are not synced.'
    )
  }),
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    return {
      allTokens: wallet.currencyConfig.allTokens,
      builtinTokens: wallet.currencyConfig.builtinTokens,
      customTokens: wallet.currencyConfig.customTokens,
      enabledTokenIds: wallet.enabledTokenIds,
      detectedTokenIds: wallet.detectedTokenIds
    }
  }
})

/**
 * Set the enabled token set.
 *
 * Absolute: anything missing from `tokenIds` is disabled. Core has only this
 * setter, so there is no add or remove call.
 *
 * @note The command's `--add` and `--remove` are client-side sugar over this
 *   one route, and cost an extra read first.
 */
export const changeEnabledTokenIds = route({
  core: 'wallet.changeEnabledTokenIds',
  method: 'POST',
  path: '/account/{sessionId}/wallets/{walletId}/change-enabled-token-ids',
  cli: {
    command: 'change-enabled-token-ids',
    custom: true,
    extra: {
      add: {
        kind: 'repeat',
        doc: 'Read the current set, add this id, write it back.'
      },
      remove: {
        kind: 'repeat',
        doc: 'Read the current set, drop this id, write it back.'
      }
    }
  },
  body: asObject({
    tokenIds: doc(asArray(asString), 'The complete desired set.')
  }).withRest,
  returns: asEnabledTokens,
  errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.params.walletId)
    await wallet.changeEnabledTokenIds(ctx.body.tokenIds)
    return { enabledTokenIds: wallet.enabledTokenIds }
  }
})
