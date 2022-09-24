//
// Action Operations
//
import { asArray, asBoolean, asCodec, asEither, asMaybe, asNull, asNumber, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

import { asBase64 } from '../../util/cleaners/asBase64'
import {
  ActionEffect,
  ActionOp,
  ActionProgram,
  ActionProgramState,
  AddressBalanceEffect,
  BroadcastTxActionOp,
  DoneEffect,
  LoanBorrowActionOp,
  LoanDepositActionOp,
  LoanRepayActionOp,
  LoanWithdrawActionOp,
  ParActionOp,
  ParEffect,
  PriceLevelEffect,
  PushEventEffect,
  SeqActionOp,
  SeqEffect,
  SwapActionOp,
  TxConfsEffect,
  WyreBuyActionOp,
  WyreSellActionOp
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

const asSeqActionOp = asObject<SeqActionOp>({
  type: asValue('seq'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asParActionOp = asObject<ParActionOp>({
  type: asValue('par'),
  actions: asArray((raw: any) => asActionOp(raw))
})
const asBroadcastTxActionOp = asObject<BroadcastTxActionOp>({
  type: asValue('broadcast-tx'),
  pluginId: asString,
  rawTx: asBase64
})
const asWyreBuyActionOp = asObject<WyreBuyActionOp>({
  type: asValue('wyre-buy'),
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asWyreSellActionOp = asObject<WyreSellActionOp>({
  type: asValue('wyre-sell'),
  wyreAccountId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanBorrowActionOp = asObject<LoanBorrowActionOp>({
  type: asValue('loan-borrow'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanDepositActionOp = asObject<LoanDepositActionOp>({
  type: asValue('loan-deposit'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanRepayActionOp = asObject<LoanRepayActionOp>({
  type: asValue('loan-repay'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asLoanWithdrawActionOp = asObject<LoanWithdrawActionOp>({
  type: asValue('loan-withdraw'),
  borrowPluginId: asString,
  nativeAmount: asString,
  walletId: asString,
  tokenId: asOptional(asString)
})
const asSwapActionOp = asObject<SwapActionOp>({
  type: asValue('swap'),
  amountFor: asValue('from', 'to'),
  walletId: asString,
  fromTokenId: asOptional(asString),
  fromWalletId: asString,
  nativeAmount: asString,
  toTokenId: asOptional(asString),
  toWalletId: asString
})
export const asActionOp: Cleaner<ActionOp> = asEither(
  asSeqActionOp,
  asParActionOp,
  asBroadcastTxActionOp,
  asWyreBuyActionOp,
  asWyreSellActionOp,
  asLoanBorrowActionOp,
  asLoanDepositActionOp,
  asLoanRepayActionOp,
  asLoanWithdrawActionOp,
  asSwapActionOp
)

//
// Action Effects
//

const asSeqEffect = asObject<SeqEffect>({
  type: asValue('seq'),
  opIndex: asNumber,
  childEffects: asArray(asEither((raw: any) => asActionEffect(raw), asNull))
})
const asParEffect = asObject<ParEffect>({
  type: asValue('par'),
  childEffects: asArray(asEither((raw: any) => asActionEffect(raw), asNull))
})
const asAddressBalanceEffect = asObject<AddressBalanceEffect>({
  type: asValue('address-balance'),
  address: asString,
  aboveAmount: asOptional(asString),
  belowAmount: asOptional(asString),
  walletId: asString,
  tokenId: asOptional(asString)
})
const asPushEventEffect = asObject<PushEventEffect>({
  type: asValue('push-event'),
  eventId: asString
})
const asPriceLevelEffect = asObject<PriceLevelEffect>({
  type: asValue('price-level'),
  currencyPair: asString,
  aboveRate: asOptional(asNumber),
  belowRate: asOptional(asNumber)
})
const asTxConfsEffect = asObject<TxConfsEffect>({
  type: asValue('tx-confs'),
  txId: asString,
  walletId: asString,
  confirmations: asNumber
})
const asDoneEffect = asObject<DoneEffect>({
  type: asValue('done'),
  error: asOptional(asError),
  cancelled: asOptional(asBoolean)
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

export const asActionProgram = asObject<ActionProgram>({
  programId: asString,
  actionOp: asActionOp,
  mockMode: asOptional(asBoolean)
})

export const asActionProgramState = asObject<ActionProgramState>({
  clientId: asString,
  programId: asString,
  effect: asOptional(asActionEffect),
  effective: asOptional(asBoolean, false),
  executing: asOptional(asBoolean, false),
  lastExecutionTime: asOptional(asNumber, 0),
  nextExecutionTime: asOptional(asNumber, 0)
})
