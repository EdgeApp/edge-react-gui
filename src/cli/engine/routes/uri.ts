import { asObject, asOptional, asString } from 'cleaners'

import { errorMessage } from '../../../util/errorMessage'
import { doc } from '../doc'
import { engineError } from '../errors'
import { findWallet } from '../resolve'
import { route } from '../route'
import { asCoreValue, asIntegerString, asWalletId } from '../schemas'
import { getAccount } from './helpers'

/**
 * Turn a plugin's refusal into the `BAD_REQUEST` these routes declare.
 *
 * A currency plugin throws a plain `Error` for an unparseable URI or an
 * address it cannot encode, `mapCoreError` has no arm for a plain `Error`,
 * and `toErrorBody` therefore answered `500 INTERNAL_ERROR` — an engine
 * fault — for a string the caller got wrong, on routes whose declared
 * errors say `BAD_REQUEST`. `spend` wraps the same `parseUri` call this way,
 * so `spend --to=notanaddress` and `parse-uri --uri=notanaddress` used to
 * report differently for identical input.
 */
async function asBadRequest<T>(
  what: string,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run()
  } catch (error: unknown) {
    throw engineError('BAD_REQUEST', `${what}: ${errorMessage(error)}`, 400)
  }
}

const CURRENCY_CODE_DOC = 'Disambiguates on chains that carry several assets.'

/**
 * Parse a payment URI or address.
 *
 * What the GUI address tile does when you paste or scan something.
 *
 * @note `spend` and `make-spend` run their `to` field through this same call,
 *   so parsing separately is only needed to inspect or confirm first.
 */
export const parseUri = route({
  core: 'wallet.parseUri',
  method: 'POST',
  path: '/account/{sessionId}/wallet/parse-uri',
  cli: 'parse-uri',
  body: asObject({
    walletId: asWalletId,
    uri: doc(asString, 'A payment URI or a bare address.'),
    currencyCode: asOptional(doc(asString, CURRENCY_CODE_DOC))
  }).withRest,
  returns: doc(
    asCoreValue,
    '`EdgeParsedUri`: publicAddress, nativeAmount, currencyCode, metadata, paymentProtocolUrl, …'
  ),
  errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    return await asBadRequest(
      'Could not parse URI',
      async () => await wallet.parseUri(ctx.body.uri, ctx.body.currencyCode)
    )
  }
})

/**
 * Build a payment URI.
 *
 * For a receive screen or a QR code.
 *
 * @note Only these five fields are read; a fuller `EdgeEncodeUri` has its
 *   extras ignored.
 */
export const encodeUri = route({
  core: 'wallet.encodeUri',
  method: 'POST',
  path: '/account/{sessionId}/wallet/encode-uri',
  cli: 'encode-uri',
  body: asObject({
    walletId: asWalletId,
    publicAddress: doc(asString, 'Where the payment should go.'),
    nativeAmount: asOptional(
      doc(asIntegerString, 'Amount, in the native unit.')
    ),
    label: asOptional(
      doc(asString, 'BIP21 `label`; becomes `metadata.name` when parsed back.')
    ),
    message: asOptional(
      doc(asString, 'BIP21 `message`; becomes `metadata.notes`.')
    ),
    currencyCode: asOptional(doc(asString, CURRENCY_CODE_DOC))
  }).withRest,
  returns: asObject({
    uri: doc(asString, 'The encoded URI, ready for a QR code.')
  }),
  errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],

  async handler(ctx) {
    const wallet = findWallet(getAccount(ctx), ctx.body.walletId)
    return {
      uri: await asBadRequest(
        'Could not encode URI',
        async () =>
          await wallet.encodeUri({
            publicAddress: ctx.body.publicAddress,
            nativeAmount: ctx.body.nativeAmount,
            label: ctx.body.label,
            message: ctx.body.message,
            currencyCode: ctx.body.currencyCode
          })
      )
    }
  }
})
