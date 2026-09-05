import { asObject, asOptional, asString } from 'cleaners'
import type { EdgeEncodeUri } from 'edge-core-js'

import { doc } from '../doc'
import { findWallet } from '../resolve'
import { route } from '../route'
import { asCoreValue, asWalletId } from '../schemas'
import { getAccount } from './helpers'

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
    return await wallet.parseUri(ctx.body.uri, ctx.body.currencyCode)
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
    nativeAmount: asOptional(doc(asString, 'Amount, in the native unit.')),
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
    const obj: EdgeEncodeUri = {
      publicAddress: ctx.body.publicAddress,
      nativeAmount: ctx.body.nativeAmount,
      label: ctx.body.label,
      message: ctx.body.message,
      currencyCode: ctx.body.currencyCode
    }
    const uri = await wallet.encodeUri(obj)
    return { uri }
  }
})
