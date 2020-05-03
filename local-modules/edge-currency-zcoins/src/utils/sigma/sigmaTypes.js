// @flow

import {
  type EdgeTransaction
} from 'edge-core-js/types'

export const SIGMA_ENCRYPTED_FILE = 'mint.json'
export const RESTORE_FILE = 'restore.json'
export const OP_SIGMA_MINT = 'c3'
export const OP_SIGMA_SPEND = 'c4'

export const SIGMA_COIN = 100000000

export const denominations = [5000000, 10000000, 50000000, 100000000, 1000000000, 2500000000, 10000000000]

export type Denomination = 'SIGMA_DENOM_0_05' | 'SIGMA_DENOM_0_1' | 'SIGMA_DENOM_0_5' | 'SIGMA_DENOM_1' | 'SIGMA_DENOM_10' | 'SIGMA_DENOM_25' | 'SIGMA_DENOM_100'

export const DenominationValue = {
  SIGMA_DENOM_0_05: 0.05,
  SIGMA_DENOM_0_1: 0.1,
  SIGMA_DENOM_0_5: 0.5,
  SIGMA_DENOM_1: 1,
  SIGMA_DENOM_10: 10,
  SIGMA_DENOM_25: 25,
  SIGMA_DENOM_100: 100
}

export type PrivateCoin = {
  value: number,
  index: number,
  commitment: string,
  groupId: number,
  isSpend: boolean,
  spendTxId: string;
}

export type MintTransaction = {
  edgeTransaction: EdgeTransaction,
  privateCoins: Array<PrivateCoin>,
}
