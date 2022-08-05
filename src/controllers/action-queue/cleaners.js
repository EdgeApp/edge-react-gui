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
  message: asString,
  stack: asString
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
        configurable: true,
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

const asSeqActionOp = asObject({
  type: asValue('seq'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asParActionOp = asObject({
  type: asValue('par'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asBroadcastTxActionOp = asObject({
  type: asValue('broadcast-tx'),
  pluginId: asString,
  rawTx: asBase64
})
const asExchangeBuyactionop = asObject({
  type: asValue('exchange-buy'),
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString),
  exchangePluginId: asString
})
const asExchangeSellActionOp = asObject({
  type: asValue('exchange-sell'),
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString),
  exchangePluginId: asString
})
const asLoanBorrowActionOp = asObject({
  type: asValue('loan-borrow'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanDepositActionOp = asObject({
  type: asValue('loan-deposit'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanRepayActionOp = asObject({
  type: asValue('loan-repay'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanWithdrawActionOp = asObject({
  type: asValue('loan-withdraw'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asSwapActionOp = asObject({
  type: asValue('swap'),
  fromWalletId: asString,
  toWalletId: asString,
  fromTokenId: asOptional(asString),
  toTokenId: asOptional(asString),
  nativeAmount: asString,
  amountFor: asValue('from', 'to')
})
const asToastActionOp = asObject({
  type: asValue('toast'),
  message: asString
})
const asDelayActionOp = asObject({
  type: asValue('delay'),
  ms: asNumber
})
export const asActionOp: Cleaner<ActionOp> = asEither(
  asSeqActionOp,
  asParActionOp,
  asBroadcastTxActionOp,
  asExchangeBuyactionop,
  asExchangeSellActionOp,
  asLoanBorrowActionOp,
  asLoanDepositActionOp,
  asLoanRepayActionOp,
  asLoanWithdrawActionOp,
  asSwapActionOp,
  asToastActionOp,
  asDelayActionOp
)

//
// Action Effects
//

const asSeqEffect = asObject({
  type: asValue('seq'),
  opIndex: asNumber,
  childEffect: (raw: any) => asActionEffect(raw)
})
const asParEffect = asObject({
  type: asValue('par'),
  childEffects: asArray(raw => asActionEffect(raw))
})
const asAddressBalanceEffect = asObject({
  type: asValue('address-balance'),
  address: asString,
  aboveAmount: asOptional(asString),
  belowAmount: asOptional(asString),
  walletId: asString,
  tokenId: asOptional(asString)
})
const asTxConfsEffect = asObject({
  type: asValue('tx-confs'),
  txId: asString,
  walletId: asString,
  confirmations: asNumber
})
const asPriceLevelEffect = asObject({
  type: asValue('price-level'),
  currencyPair: asString,
  aboveRate: asOptional(asNumber),
  belowRate: asOptional(asNumber)
})
const asDoneEffect = asObject({
  type: asValue('done'),
  error: asOptional(asError)
})
const asUnixtimeEffect = asObject({
  type: asValue('unixtime'),
  timestamp: asNumber
})
const asNoopEffect = asObject({
  type: asValue('noop')
})
export const asActionEffect: Cleaner<ActionEffect> = asEither(
  asSeqEffect,
  asParEffect,
  asAddressBalanceEffect,
  asTxConfsEffect,
  asPriceLevelEffect,
  asDoneEffect,
  asUnixtimeEffect,
  asNoopEffect
)

//
// Action Program
//

export const asActionProgram: Cleaner<ActionProgram> = asObject({
  programId: asString,
  actionOp: asActionOp
})

export const asActionProgramState: Cleaner<ActionProgramState> = asObject({
  deviceId: asString,
  programId: asString,
  effect: asOptional(asActionEffect)
})
