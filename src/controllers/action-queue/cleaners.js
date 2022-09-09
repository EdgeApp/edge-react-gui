// @flow

//
// Action Operations
//
import { type Cleaner, asArray, asBoolean, asCodec, asEither, asMaybe, asNull, asNumber, asObject, asOptional, asString, asValue } from 'cleaners'

import { asBase64 } from '../../util/cleaners/asBase64'
import {
  type ActionEffect,
  type ActionOp,
  type ActionProgram,
  type ActionProgramState,
  type BroadcastTxActionOp,
  type FiatBuyActionOp,
  type FiatSellActionOp,
  type LoanBorrowActionOp,
  type LoanDepositActionOp,
  type LoanRepayActionOp,
  type LoanWithdrawActionOp,
  type ParActionOp,
  type SeqActionOp,
  type SwapActionOp
} from './types'

// A serializable error object
const asJsonError = asObject({
  name: asString,
  message: asString,
  stack: asString
}).withRest

const asError = asCodec(
  (raw: any) => {
    // Handle Error
    if (raw instanceof Error) return raw

    if (typeof raw === 'string') {
      const error = new Error(raw)
      return error
    }
    // Handle JsonError
    const jsonError = asMaybe(asJsonError)(raw)
    if (jsonError != null) {
      const error = new Error(jsonError.message)
      Object.defineProperty(error, 'name', {
        configurable: true,
        value: jsonError.name
      })
      // TODO: Copy stack trace
      return error
    }

    // Invalid type
    throw new TypeError('Expected Error')
  },
  // Serialize as a JsonError
  asJsonError
)

const asSeqActionOp: Cleaner<SeqActionOp> = asObject({
  type: asValue('seq'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asParActionOp: Cleaner<ParActionOp> = asObject({
  type: asValue('par'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asBroadcastTxActionOp: Cleaner<BroadcastTxActionOp> = asObject({
  type: asValue('broadcast-tx'),
  pluginId: asString,
  rawTx: asBase64
})
const asFiatBuyActionOp: Cleaner<FiatBuyActionOp> = asObject({
  type: asValue('fiat-buy'),
  fiatPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asFiatSellActionOp: Cleaner<FiatSellActionOp> = asObject({
  type: asValue('fiat-sell'),
  fiatPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanBorrowActionOp: Cleaner<LoanBorrowActionOp> = asObject({
  type: asValue('loan-borrow'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanDepositActionOp: Cleaner<LoanDepositActionOp> = asObject({
  type: asValue('loan-deposit'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanRepayActionOp: Cleaner<LoanRepayActionOp> = asObject({
  type: asValue('loan-repay'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanWithdrawActionOp: Cleaner<LoanWithdrawActionOp> = asObject({
  type: asValue('loan-withdraw'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asSwapActionOp: Cleaner<SwapActionOp> = asObject({
  type: asValue('swap'),
  fromWalletId: asString,
  toWalletId: asString,
  fromTokenId: asOptional(asString),
  toTokenId: asOptional(asString),
  nativeAmount: asString,
  amountFor: asValue('from', 'to')
})
export const asActionOp: Cleaner<ActionOp> = asEither(
  asSeqActionOp,
  asParActionOp,
  asBroadcastTxActionOp,
  asFiatBuyActionOp,
  asFiatSellActionOp,
  asLoanBorrowActionOp,
  asLoanDepositActionOp,
  asLoanRepayActionOp,
  asLoanWithdrawActionOp,
  asSwapActionOp
)

//
// Action Effects
//

const asSeqEffect = asObject({
  type: asValue('seq'),
  opIndex: asNumber,
  childEffects: asArray(asEither((raw: any) => asActionEffect(raw), asNull))
})
const asParEffect = asObject({
  type: asValue('par'),
  childEffects: asArray(asEither((raw: any) => asActionEffect(raw), asNull))
})
const asAddressBalanceEffect = asObject({
  type: asValue('address-balance'),
  address: asString,
  aboveAmount: asOptional(asString),
  belowAmount: asOptional(asString),
  walletId: asString,
  tokenId: asOptional(asString)
})
const asPushEventEffect = asObject({
  type: asValue('push-event'),
  eventId: asString
})
const asPriceLevelEffect = asObject({
  type: asValue('price-level'),
  currencyPair: asString,
  aboveRate: asOptional(asNumber),
  belowRate: asOptional(asNumber)
})
const asTxConfsEffect = asObject({
  type: asValue('tx-confs'),
  txId: asString,
  walletId: asString,
  confirmations: asNumber
})
const asDoneEffect = asObject({
  type: asValue('done'),
  error: asOptional(asError)
})
export const asActionEffect: Cleaner<ActionEffect> = asEither(
  asSeqEffect,
  asParEffect,
  asAddressBalanceEffect,
  asTxConfsEffect,
  asPushEventEffect,
  asPriceLevelEffect,
  asDoneEffect
)

//
// Action Program
//

export const asActionProgram: Cleaner<ActionProgram> = asObject({
  programId: asString,
  actionOp: asActionOp,
  mockMode: asOptional(asBoolean)
})

export const asActionProgramState: Cleaner<ActionProgramState> = asObject({
  clientId: asString,
  programId: asString,
  effect: asOptional(asActionEffect),
  effective: asOptional(asBoolean, false),
  executing: asOptional(asBoolean, false),
  lastExecutionTime: asOptional(asNumber, 0),
  nextExecutionTime: asOptional(asNumber, 0)
})
