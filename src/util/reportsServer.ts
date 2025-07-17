import {
  asArray,
  asEither,
  asJSON,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import { EdgeTokenId, EdgeTransaction } from 'edge-core-js'

import { ENV } from '../env'
import { cleanFetch } from './cleanFetch'

// Constants
export const REPORTS_SERVER_URI =
  ENV.REPORTS_SERVER ?? 'https://reports1.edge.app'

// Types
export interface ReportsTxInfo {
  providerId: string
  orderId: string
  isoDate: string
  sourceAmount: number // exchangeAmount units
  sourceCurrencyCode: string
  sourcePluginId?: string
  sourceTokenId?: EdgeTokenId
  status: string
  destinationAddress?: string
  destinationAmount: number // exchangeAmount units
  destinationPluginId?: string
  destinationTokenId?: EdgeTokenId
}

// Cleaners
export const asTxInfo = asObject({
  providerId: asString,
  orderId: asString,
  isoDate: asString,
  sourceAmount: asNumber,
  sourceCurrencyCode: asString,
  sourcePluginId: asOptional(asString),
  sourceTokenId: asOptional(asString),
  status: asString,
  destinationAddress: asOptional(asString),
  destinationAmount: asNumber,
  destinationPluginId: asOptional(asString),
  destinationTokenId: asOptional(asString)
})

const asGetTxInfoResponse = asJSON(
  asObject({
    txs: asArray(asTxInfo)
  })
)

const asErrorResponse = asJSON(
  asObject({
    error: asObject({
      message: asString
    })
  })
)

const fetchGetTxInfoBase = cleanFetch({
  resource: (input: { endpoint?: string }) => input.endpoint,
  asResponse: asEither(asErrorResponse, asGetTxInfoResponse)
})

/**
 * Accepts a full address (internally truncated to 5 characters before sent as a query),
 * a time range (startDate and endDate). It returns the first TxInfo where the destinationAddress === address.
 */
export async function fetchGetTxInfo(
  transaction: EdgeTransaction
): Promise<ReportsTxInfo | undefined> {
  const transactionDate = new Date(transaction.date * 1000)
  const address = transaction.ourReceiveAddresses?.[0]

  if (address == null) {
    return
  }

  // Get first 5 characters of the address
  const addressPrefix = address.slice(0, 5)

  // Set time range: 24 hours before and after transaction
  const startDate = new Date(transactionDate)
  startDate.setHours(startDate.getHours() - 24)
  const endDate = new Date(transactionDate)
  endDate.setHours(endDate.getHours() + 24)

  // Convert dates to ISO strings
  const startIsoDate = startDate.toISOString()
  const endIsoDate = endDate.toISOString()

  // Build query URL
  const queryParams = new URLSearchParams({
    addressPrefix,
    startIsoDate,
    endIsoDate
  })
  const endpoint = `${REPORTS_SERVER_URI}/v1/getTxInfo?${String(queryParams)}`

  const response = await fetchGetTxInfoBase({ endpoint })

  if ('error' in response) {
    throw new Error(response.error.message)
  }

  // Find the first transaction where destinationAddress matches the full address
  const matchingTx = response.txs.find(tx => tx.destinationAddress === address)

  return matchingTx
}
