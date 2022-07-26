// @flow

//
// Action Operations
//
import { type Cleaner, asArray, asCodec, asEither, asMaybe, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'
import { base64 } from 'rfc4648'

import { type ActionEffect, type ActionOp, type ActionProgram, type ActionProgramState } from './types'

const asBase64 = asCodec(
  raw => base64.parse(asString(raw)),
  clean => base64.stringify(clean)
)

// A serializeable error object
const asJsonError = asObject({
  name: asString,
  message: asString
}).withRest

const asError = asCodec(
  (raw: any) => {
    // Handle Error
    if (raw instanceof Error) return raw

    // Handle JsonError
    const jsonError = asMaybe(asJsonError)(raw)
    if (jsonError != null) {
      const error = new Error(jsonError.message)
      Object.defineProperty(error, 'name', {
        value: jsonError.name
      })
      return error
    }

    // Invalid type
    throw new TypeError('Expected Error')
  },
  // Serialize as a JsonError
  asJsonError
)

export const asActionOp: Cleaner<ActionOp> = asEither(
  asObject({
    type: asValue('seq'),
    actions: asArray((raw: any) => asActionOp(raw))
  }),
  asObject({
    type: asValue('par'),
    actions: asArray((raw: any) => asActionOp(raw))
  }),
  asObject({
    type: asValue('broadcast-tx'),
    pluginId: asString,
    rawTx: asBase64
  }),
  asObject({
    type: asValue('exchange-buy'),
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString),
    exchangePluginId: asString
  }),
  asObject({
    type: asValue('exchange-sell'),
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString),
    exchangePluginId: asString
  }),
  asObject({
    type: asValue('loan-borrow'),
    borrowPluginId: asString,
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString)
  }),
  asObject({
    type: asValue('loan-deposit'),
    borrowPluginId: asString,
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString)
  }),
  asObject({
    type: asValue('loan-repay'),
    borrowPluginId: asString,
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString)
  }),
  asObject({
    type: asValue('loan-withdraw'),
    borrowPluginId: asString,
    nativeAmount: asString,
    walletId: asString,
    tokenId: asOptional(asString)
  }),
  asObject({
    type: asValue('swap'),
    fromWalletId: asString,
    toWalletId: asString,
    fromTokenId: asOptional(asString),
    toTokenId: asOptional(asString),
    nativeAmount: asString,
    amountFor: asEither(asValue('from'), asValue('to'))
  }),
  asObject({
    type: asValue('toast'),
    message: asString
  }),
  asObject({
    type: asValue('delay'),
    ms: asNumber
  })
)

//
// Action Effects
//

export const asActionEffect: Cleaner<ActionEffect> = asEither(
  asObject({
    type: asValue('seq'),
    opIndex: asNumber,
    childEffect: (raw: any) => asActionEffect(raw)
  }),
  asObject({
    type: asValue('par'),
    childEffects: asArray(raw => asActionEffect(raw))
  }),
  asObject({
    type: asValue('address-balance'),
    address: asString,
    aboveAmount: asOptional(asString),
    belowAmount: asOptional(asString),
    walletId: asString,
    tokenId: asOptional(asString)
  }),
  asObject({
    type: asValue('tx-confs'),
    txId: asString,
    walletId: asString,
    confirmations: asNumber
  }),
  asObject({
    type: asValue('price-level'),
    currencyPair: asString,
    aboveRate: asOptional(asNumber),
    belowRate: asOptional(asNumber)
  }),
  asObject({
    type: asValue('done'),
    error: asOptional(asError)
  }),
  asObject({
    type: asValue('unixtime'),
    timestamp: asNumber
  })
)

//
// Action Program
//

export const asActionProgram: Cleaner<ActionProgram> = asObject({
  programId: asString,
  actionOp: asActionOp
})

export const asActionProgramState: Cleaner<ActionProgramState> = asObject({
  programId: asString,
  effect: asOptional(asActionEffect)
})
