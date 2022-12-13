//
// Action Operations
//
import { asArray, asBoolean, asEither, asMaybe, asNull, asNumber, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

import { asBase64 } from '../../util/cleaners/asBase64'
import {
  ActionEffect,
  ActionOp,
  ActionProgram,
  ActionProgramCompleteMessage,
  ActionProgramState,
  AddressBalanceEffect,
  BroadcastTxActionOp,
  DoneEffect,
  LeafActionOp,
  LoanBorrowActionOp,
  LoanDepositActionOp,
  LoanRepayActionOp,
  LoanWithdrawActionOp,
  NodeActionOp,
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
export interface CleanError extends Error {
  message: string
  name: string
  stack?: string
  [key: string]: any
}
export const asCleanError = (raw: any): CleanError => {
  const cleanError = asMaybe(
    asObject<CleanError>({
      message: asString,
      name: asString,
      stack: asOptional(asString)
    }).withRest
  )(raw)

  if (cleanError != null) return cleanError

  if (typeof raw === 'string') {
    return { message: raw, name: 'Error' }
  }

  let message: string | undefined
  if ('message' in raw && typeof raw.message === 'string') {
    message = raw.message
  }

  return {
    message: ['Unexpected exception', ...(message ? [message] : [])].join(': '),
    name: 'UnexpectedException',
    ...raw
  }
}

const asSeqActionOp = asObject<SeqActionOp>({
  type: asValue('seq'),
  actions: asArray((raw: any) => asActionOp(raw))
})

const asParActionOp = asObject<ParActionOp>({
  type: asValue('par'),
  actions: asArray((raw: any) => asActionOp(raw)),
  displayKey: (raw: unknown) => asOptional(asParActionOpDisplayKey)(raw)
})
const asParActionOpDisplayKey = asValue('borrow', 'close', 'create', 'swap-deposit-fees')

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
  fromTokenId: asOptional(asString),
  fromWalletId: asString,
  nativeAmount: asString,
  expectedPayoutNativeAmount: asOptional(asString),
  toTokenId: asOptional(asString),
  toWalletId: asString,
  displayKey: (raw: unknown) => asOptional(asSwapActionOpDisplayKey)(raw)
})
const asSwapActionOpDisplayKey = asValue('swap-deposit')

export const asNodeActionOp: Cleaner<NodeActionOp> = asEither(asSeqActionOp, asParActionOp)
export const asLeafActionOp: Cleaner<LeafActionOp> = asEither(
  asBroadcastTxActionOp,
  asWyreBuyActionOp,
  asWyreSellActionOp,
  asLoanBorrowActionOp,
  asLoanDepositActionOp,
  asLoanRepayActionOp,
  asLoanWithdrawActionOp,
  asSwapActionOp
)
export const asActionOp: Cleaner<ActionOp> = asEither(asNodeActionOp, asLeafActionOp)

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
  eventId: asString,
  effect: raw => asOptional(asActionEffect)(raw)
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
  error: asOptional(asCleanError),
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

export const asActionProgramCompleteMessage = asObject<ActionProgramCompleteMessage>({ title: asString, message: asString })
export const asActionProgram = asObject<ActionProgram>({
  programId: asString,
  actionOp: asActionOp,
  mockMode: asOptional(asBoolean),
  completeMessage: asOptional(asActionProgramCompleteMessage)
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
