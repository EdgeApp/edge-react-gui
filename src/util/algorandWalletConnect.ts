import {
  asArray,
  asBoolean,
  asObject,
  asOptional,
  asString,
  asTuple,
  asValue
} from 'cleaners'
import type { EdgeCurrencyConfig } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatNumber } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { getExchangeDenom } from '../selectors/DenominationSelectors'
import { convertNativeToDenomination, truncateString } from './utils'

type AlgoWcTransactionType = ['pay', 'axfer', 'appl', 'acfg', 'afrz', 'keyreg']

/**
 * One transaction of an `algo_signTxn` request, as the Algorand currency
 * plugin summarizes it.
 */
export const asAlgoWcTransaction = asObject({
  type: asValue<AlgoWcTransactionType>(
    'pay',
    'axfer',
    'appl',
    'acfg',
    'afrz',
    'keyreg'
  ),
  // False for a transaction the dapp only sent for information:
  willSign: asBoolean,
  // Transactions that share a group ID form one atomic group:
  groupId: asOptional(asString),
  sender: asString,
  networkFee: asString,

  // Payments and asset transfers:
  recipient: asOptional(asString),
  nativeAmount: asOptional(asString),
  assetId: asOptional(asString),
  clawbackFrom: asOptional(asString),

  // Application calls:
  appId: asOptional(asString),

  // Fields that hand over the account or empty it:
  rekeyTo: asOptional(asString),
  closeRemainderTo: asOptional(asString)
})
export type AlgoWcTransaction = ReturnType<typeof asAlgoWcTransaction>

export const asAlgoPayloadMethod = asValue('algo_signTxn')
export const asAlgoWcRpcPayload = asObject({
  method: asAlgoPayloadMethod,
  params: asTuple(
    asArray(
      asObject({
        txn: asString,
        // An empty array marks a transaction the wallet must not sign:
        signers: asOptional(asArray(asString)),
        stxn: asOptional(asString),
        message: asOptional(asString)
      })
    )
  )
})

/**
 * Signs an `algo_signTxn` request.
 *
 * ARC-0001 wants one result per transaction. A transaction the dapp marked
 * as not ours to sign comes back as the signature the dapp supplied for it,
 * or `null`.
 */
export async function signAlgoWcTransactions(
  payload: unknown,
  signTxn: (txn: string) => Promise<string>
): Promise<Array<string | null>> {
  const [txns] = asAlgoWcRpcPayload(payload).params
  return await Promise.all(
    txns.map(async ({ signers, stxn, txn }) => {
      if (signers != null && signers.length === 0) return stxn ?? null
      return await signTxn(txn)
    })
  )
}

/**
 * Splits a request into its atomic groups, keeping the dapp's order.
 * A transaction without a group ID stands alone.
 */
export function groupAlgoWcTransactions(
  transactions: AlgoWcTransaction[]
): AlgoWcTransaction[][] {
  const out: AlgoWcTransaction[][] = []
  for (const tx of transactions) {
    const last = out[out.length - 1]
    if (last != null && tx.groupId != null && last[0].groupId === tx.groupId) {
      last.push(tx)
    } else {
      out.push([tx])
    }
  }
  return out
}

/**
 * Explains each field that lets a request take over the account or empty
 * it. Transactions the wallet does not sign are somebody else's risk.
 */
export function getAlgoWcDangers(
  transactions: AlgoWcTransaction[],
  currencyConfig: EdgeCurrencyConfig
): string[] {
  const out: string[] = []
  transactions.forEach((tx, index) => {
    if (!tx.willSign) return
    const position = String(index + 1)
    if (tx.rekeyTo != null) {
      out.push(
        sprintf(
          lstrings.wc_algo_danger_rekey_2s,
          position,
          shortAddress(tx.rekeyTo)
        )
      )
    }
    if (tx.closeRemainderTo != null) {
      out.push(
        sprintf(
          lstrings.wc_algo_danger_close_3s,
          position,
          getAssetName(currencyConfig, tx.assetId),
          shortAddress(tx.closeRemainderTo)
        )
      )
    }
  })
  return out
}

/**
 * Describes one transaction of a request as a row title and body.
 */
export function describeAlgoWcTransaction(
  tx: AlgoWcTransaction,
  currencyConfig: EdgeCurrencyConfig,
  walletAddress: string | undefined
): { title: string; body: string | undefined } {
  const { nativeAmount = '0', recipient, sender } = tx
  const name = (address: string): string =>
    address === walletAddress
      ? lstrings.wc_algo_this_wallet
      : shortAddress(address)

  const isOptIn =
    tx.type === 'axfer' &&
    recipient === sender &&
    nativeAmount === '0' &&
    tx.clawbackFrom == null &&
    tx.closeRemainderTo == null

  const lines: string[] = []
  if (isOptIn) {
    lines.push(getAssetName(currencyConfig, tx.assetId))
  } else if (recipient != null) {
    const amount = getAmountText(currencyConfig, nativeAmount, tx.assetId)
    const source = tx.clawbackFrom ?? sender
    lines.push(
      source === walletAddress
        ? sprintf(lstrings.wc_algo_amount_to_2s, amount, name(recipient))
        : sprintf(
            lstrings.wc_algo_amount_from_to_3s,
            amount,
            name(source),
            name(recipient)
          )
    )
  } else if (tx.appId != null) {
    lines.push(
      tx.appId === '0'
        ? lstrings.wc_algo_app_create
        : sprintf(lstrings.wc_algo_app_id_1s, tx.appId)
    )
  }
  if (tx.rekeyTo != null) {
    lines.push(sprintf(lstrings.wc_algo_rekey_1s, shortAddress(tx.rekeyTo)))
  }
  if (tx.closeRemainderTo != null) {
    lines.push(
      sprintf(lstrings.wc_algo_close_1s, shortAddress(tx.closeRemainderTo))
    )
  }

  const typeName = isOptIn ? lstrings.wc_algo_type_opt_in : getTypeName(tx.type)
  return {
    title: tx.willSign
      ? typeName
      : sprintf(lstrings.wc_algo_not_signed_1s, typeName),
    body: lines.length > 0 ? lines.join('\n') : undefined
  }
}

/**
 * The wallet only signs transactions it sends,
 * so any signed transaction names the wallet's address.
 */
export const getAlgoWcWalletAddress = (
  transactions: AlgoWcTransaction[]
): string | undefined => transactions.find(tx => tx.willSign)?.sender

function getTypeName(type: AlgoWcTransaction['type']): string {
  switch (type) {
    case 'pay':
      return lstrings.wc_algo_type_pay
    case 'axfer':
      return lstrings.wc_algo_type_axfer
    case 'appl':
      return lstrings.wc_algo_type_appl
    case 'acfg':
      return lstrings.wc_algo_type_acfg
    case 'afrz':
      return lstrings.wc_algo_type_afrz
    case 'keyreg':
      return lstrings.wc_algo_type_keyreg
  }
}

const shortAddress = (address: string): string =>
  truncateString(address, 12, true)

function getAssetName(
  currencyConfig: EdgeCurrencyConfig,
  assetId: string | undefined
): string {
  if (assetId == null) return currencyConfig.currencyInfo.currencyCode
  const token = currencyConfig.allTokens[assetId]
  return token != null
    ? token.currencyCode
    : sprintf(lstrings.wc_algo_asset_id_1s, assetId)
}

function getAmountText(
  currencyConfig: EdgeCurrencyConfig,
  nativeAmount: string,
  assetId: string | undefined
): string {
  // Without the token we do not know the decimals, so show the raw amount:
  if (assetId != null && currencyConfig.allTokens[assetId] == null) {
    return sprintf(
      lstrings.wc_algo_unknown_asset_amount_2s,
      formatNumber(nativeAmount),
      assetId
    )
  }
  const { multiplier, name } = getExchangeDenom(currencyConfig, assetId ?? null)
  const amount = convertNativeToDenomination(multiplier)(nativeAmount)
  return `${formatNumber(amount)} ${name}`
}
