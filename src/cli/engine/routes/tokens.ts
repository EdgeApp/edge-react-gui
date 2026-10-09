import { asArray, asObject, asString } from 'cleaners'

import { doc } from '../doc'
import { engineError } from '../errors'
import { assertTokenId, findWallet } from '../resolve'
import { route } from '../route'
import {
  asCoreValue,
  asEnabledTokens,
  asRequestTokenId,
  asWalletId
} from '../schemas'
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
  path: '/account/{sessionId}/wallet/tokens',
  cli: 'wallet-tokens',
  query: asObject({ walletId: asWalletId }).withRest,
  returns: asObject({
    allTokens: doc(
      asObject(asCoreValue),
      '`EdgeToken` by tokenId: everything the plugin ships with, plus this account\u2019s own. `builtinTokens` is not returned separately — it is this map minus `customTokens`, and sending both wrote the whole built-in list down the socket twice.'
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
    const wallet = findWallet(getAccount(ctx), ctx.query.valid.walletId)
    return {
      allTokens: wallet.currencyConfig.allTokens,
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
 * @note The command's `--add`, `--remove` and `--disable-all` are
 *   client-side sugar over this one route; the first two cost an extra read
 *   first, to turn a relative change into the absolute set this takes.
 */
export const changeEnabledTokenIds = route({
  core: 'wallet.changeEnabledTokenIds',
  method: 'POST',
  path: '/account/{sessionId}/wallet/change-enabled-token-ids',
  cli: {
    command: 'change-enabled-token-ids',
    custom: true,
    flags: {
      // The hand-written command splits this on commas, so the reference
      // must not publish `'<json>'` for it: the documented spelling came
      // back `404 TOKEN_NOT_FOUND Unknown token: ["…"]`, taken as one
      // literal id, while the command's own `UsageError` printed the real
      // form.
      tokenIds: { valueForm: '<a,b,c>' }
    },
    extra: {
      add: {
        kind: 'repeat',
        doc: 'Read the current set, add this id, write it back.'
      },
      remove: {
        kind: 'repeat',
        doc: 'Read the current set, drop this id, write it back.'
      },
      'disable-all': {
        kind: 'boolean',
        doc: 'Send the empty set, disabling every token on the wallet. A spelling of its own, because an empty flag value is refused everywhere in this CLI — `-d ""` reaching the profile hash as an empty directory is the reason — so there was no way to ask for this.'
      }
    },
    // Four mutually exclusive ways to name the set, which one argument per
    // field cannot say: the assembled line published `--token-ids` as
    // required and the other three as optional extras, which is the one
    // combination the command refuses, and `--disable-all` on its own — the
    // reason the flag exists — was not expressible in it at all. The
    // command's own refusal footer had the real grammar; only the reference
    // did not.
    usage:
      'change-enabled-token-ids --wallet-id=<walletId> (--token-ids=<a,b,c> | --add=<add> … | --remove=<remove> … | --disable-all)'
  },
  body: asObject({
    walletId: asWalletId,
    tokenIds: doc(
      asArray(asRequestTokenId),
      'The complete desired set. Every id must be one the wallet\u2019s plugin knows; an unknown one is a `404`, not a silent omission. `null` \u2014 the chain\u2019s own coin \u2014 is a `400`, because it is always enabled and cannot be in this set.'
    )
  }).withRest,
  returns: asEnabledTokens,
  errors: [
    'BAD_REQUEST',
    'TOKEN_NOT_FOUND',
    'WALLET_NOT_FOUND',
    'AMBIGUOUS_WALLET_ID'
  ],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    // Core ends `changeEnabledTokenIds` with
    // `.filter(tokenId => allTokens[tokenId] != null)`, so it drops what it
    // does not know and answers 200. This was the last route taking a
    // caller-supplied tokenId with no assertion, and the `--add`/`--remove`
    // sugar makes a typo likelier rather than less: the client reads the
    // current set and posts the whole list back, so a bad id is appended to
    // a known-good set and the response is indistinguishable from success —
    // exit 0 for a script that asked for something it did not get.
    const tokenIds: string[] = []
    for (const tokenId of ctx.body.tokenIds) {
      if (tokenId == null) {
        // `asRequestTokenId` admits `null` because most routes use it to
        // mean the chain's own coin. That is not a member of this set: the
        // native asset is always enabled, and core would drop it.
        throw engineError(
          'BAD_REQUEST',
          'tokenIds cannot contain null: the chain\u2019s own coin is ' +
            'always enabled and is not part of the enabled-token set.',
          400
        )
      }
      assertTokenId(wallet, tokenId)
      tokenIds.push(tokenId)
    }
    await wallet.changeEnabledTokenIds(tokenIds)
    return { enabledTokenIds: wallet.enabledTokenIds }
  }
})
