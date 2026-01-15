import { mul } from 'biggystring'
import {
  asArray,
  asEither,
  asJSON,
  asNumber,
  asObject,
  asString
} from 'cleaners'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction,
  EdgeTxActionSwap,
  EdgeTxSwap
} from 'edge-core-js'

import { ENV } from '../env'
import { getExchangeDenom } from '../selectors/DenominationSelectors'
import { asEdgeTokenId } from '../types/types'
import { cleanFetch } from './cleanFetch'
import { getCurrencyCode } from './CurrencyInfoHelpers'
import { pickRandom } from './pickRandom'

// Constants
export const REPORTS_SERVERS = ENV.REPORTS_SERVERS ?? [
  'https://reports1.edge.app'
]

// Types
export type ReportsTxInfo = ReturnType<typeof asTxInfo>

// Cleaners
const asAssetInfo = asObject({
  address: asString,
  pluginId: asString,
  tokenId: asEdgeTokenId,
  amount: asNumber
})

const asSwapInfo = asObject({
  orderId: asString,
  pluginId: asString,
  status: asString
})

export const asTxInfo = asObject({
  isoDate: asString,
  swapInfo: asSwapInfo,
  deposit: asAssetInfo,
  payout: asAssetInfo
})

const asGetTxInfoSuccessResponse = asJSON(
  asObject({
    txs: asArray(asTxInfo)
  })
)

const asGetTxInfoFailureResponse = asJSON(
  asObject({
    error: asObject({
      message: asString
    })
  })
)

interface GetTxInfoRequest {
  addressPrefix: string
  startIsoDate: string
  endIsoDate: string
}

type GetTxInfoResponse = ReturnType<typeof asGetTxInfoResponse>
const asGetTxInfoResponse = asEither(
  asGetTxInfoSuccessResponse,
  asGetTxInfoFailureResponse
)

const fetchGetTxInfo = cleanFetch<GetTxInfoRequest, GetTxInfoResponse>({
  resource: input => input.endpoint,
  asResponse: asGetTxInfoResponse
})

/**
 * Fetches transaction information from the reports server for a given wallet
 * and transaction.
 *
 * This function:
 * - Extracts the first receive address from the transaction and truncates it
 *   to the first 5 characters (address prefix).
 * - Sets a time window of 24 hours before and after the transaction date.
 * - Queries the reports server for transactions matching the address prefix and
 *   time window.
 * - Returns the first ReportsTxInfo where the destinationAddress matches the
 *   full address and the destinationAmount (in native units) matches the
 *   transaction's nativeAmount.
 *
 * @param wallet - The EdgeCurrencyWallet containing the transaction.
 * @param transaction - The EdgeTransaction to look up.
 * @returns The matching ReportsTxInfo if found, otherwise undefined.
 * @throws If the reports server returns an error.
 */
export async function queryReportsTxInfo(
  wallet: EdgeCurrencyWallet,
  transaction: EdgeTransaction
): Promise<ReportsTxInfo | null> {
  const transactionDate = new Date(transaction.date * 1000)
  const address = transaction.ourReceiveAddresses?.[0]

  if (address == null) {
    return null
  }

  // Get first 5 characters of the address
  const addressHashfix = hashfix(address)

  // Set time range: 24 hours before and after transaction
  const startDate = new Date(transactionDate)
  startDate.setHours(startDate.getHours() - 24)
  const endDate = new Date(transactionDate)
  endDate.setHours(endDate.getHours() + 24)

  // Convert dates to ISO strings
  const startIsoDate = startDate.toISOString()
  const endIsoDate = endDate.toISOString()

  // Query the reports server:
  const baseUrl = pickRandom(REPORTS_SERVERS)
  const endpoint = new URL(`${baseUrl}/v1/getTxInfo`)
  endpoint.searchParams.set('addressHashfix', addressHashfix.toString())
  endpoint.searchParams.set('startIsoDate', startIsoDate)
  endpoint.searchParams.set('endIsoDate', endIsoDate)
  const response = await fetchGetTxInfo({
    endpoint
  })

  if ('error' in response) {
    throw new Error(response.error.message)
  }

  // Find the first transaction where destinationAddress matches the full address
  const denom = getExchangeDenom(wallet.currencyConfig, transaction.tokenId)
  const matchingTx = response.txs.find(tx => {
    const destinationNativeAmount = mul(tx.payout.amount, denom.multiplier)
    return (
      tx.payout.address === address &&
      destinationNativeAmount === transaction.nativeAmount
    )
  })

  return matchingTx ?? null
}

/**
 * Converts a ReportsTxInfo to an EdgeTxSwap.
 */
export const toEdgeTxSwap = (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  transaction: EdgeTransaction,
  txInfo: ReportsTxInfo
): EdgeTxSwap | undefined => {
  const swapPlugin = account.swapConfig[txInfo.swapInfo.pluginId]
  if (swapPlugin == null) {
    return
  }
  const payoutCurrencyCode = getCurrencyCode(wallet, transaction.tokenId)
  const swapData: EdgeTxSwap = {
    orderId: txInfo.swapInfo.orderId,
    isEstimate: false,

    // The EdgeSwapInfo from the swap plugin:
    plugin: {
      pluginId: swapPlugin.swapInfo.pluginId,
      displayName: swapPlugin.swapInfo.displayName,
      supportEmail: swapPlugin.swapInfo.supportEmail
    },

    // Address information:
    payoutAddress: txInfo.payout.address,
    payoutCurrencyCode,
    payoutNativeAmount: txInfo.payout.amount.toString(),
    payoutWalletId: transaction.walletId
  }
  return swapData
}

export const toEdgeTxActionSwap = (
  account: EdgeAccount,
  transaction: EdgeTransaction,
  txInfo: ReportsTxInfo
): EdgeTxActionSwap | undefined => {
  const swapPlugin = account.swapConfig[txInfo.swapInfo.pluginId]
  if (swapPlugin == null) {
    return
  }
  return {
    actionType: 'swap',
    swapInfo: swapPlugin.swapInfo,
    orderId: txInfo.swapInfo.orderId,
    // orderUri, isEstimate, canBePartial, refundAddress are not available in
    // txInfo, so we leave them undefined.
    fromAsset: {
      pluginId: txInfo.deposit.pluginId,
      tokenId: txInfo.deposit.tokenId,
      nativeAmount: txInfo.deposit.amount.toString()
    },
    toAsset: {
      pluginId: txInfo.payout.pluginId,
      tokenId: txInfo.payout.tokenId,
      nativeAmount: txInfo.payout.amount.toString()
    },
    payoutAddress: txInfo.payout.address,
    payoutWalletId: transaction.walletId
  }
}

/**
 * This will merge reports-server txInfo data into receive transactions which
 * are missing swap metadata.
 */
export async function mergeReportsTxInfo(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  transactions: EdgeTransaction[]
): Promise<void> {
  for (const transaction of transactions) {
    const reportsTxInfo = await queryReportsTxInfo(wallet, transaction)
    if (reportsTxInfo == null) continue
    const swapData = toEdgeTxSwap(account, wallet, transaction, reportsTxInfo)
    const swapAction = toEdgeTxActionSwap(account, transaction, reportsTxInfo)
    if (swapData != null) {
      transaction.swapData = swapData
      transaction.savedAction = swapAction
      wallet.saveTx(transaction).catch((err: unknown) => {
        console.warn(err)
      })
    }
  }
}

/**
 * The hashfix is a 5 byte value that is used to identify the payout address
 * semi-uniquely.
 *
 * It's named hashfix because it's not a prefix or suffix but a _hash_fix.
 */
function hashfix(address: string): number {
  const space = 1099511627776 // 5 bytes of space; 2^40
  const prime = 769 // large prime number
  let hashfix = 0 // the final hashfix
  for (let i = 0; i < address.length; i++) {
    const byte = address.charCodeAt(i)
    hashfix = (hashfix * prime + byte) % space
  }
  return hashfix
}
