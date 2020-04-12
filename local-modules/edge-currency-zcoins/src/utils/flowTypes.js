/**
 * Created by Paul Puey 2017/11/09.
 * @flow
 */

// import { type EdgeTransaction } from 'edge-core-js/types'
// import { txLibInfo } from './currencyInfoETH.js'
// export const DATA_STORE_FOLDER = 'txEngineFolder'
// export const DATA_STORE_FILE = 'walletLocalData.json'
// export const PRIMARY_CURRENCY = txLibInfo.currencyInfo.currencyCode

// export type EthereumSettings = {
//   etherscanApiServers:Array<string>,
//   superethServers:Array<string>
// }

// type EthereumFeesGasLimit = {
//   regularTransaction: string,
//   tokenTransaction: string
// }
//
export type BitcoinFees = {
  lowFee: string,
  standardFeeLow: string,
  standardFeeHigh: string,

  // The amount of satoshis which will be charged the standardFeeLow
  standardFeeLowAmount: string,

  // The amount of satoshis which will be charged the standardFeeHigh
  standardFeeHighAmount: string,
  highFee: string,

  // The last time the fees were updated
  timestamp: number
}

export type EarnComFee = {
  minFee: number,
  maxFee: number,
  dayCount: number,
  memCount: number,
  minDelay: number,
  maxDelay: number,
  minMinutes: number,
  maxMinutes: number
}

export type EarnComFees = {
  fees: Array<EarnComFee>
}
