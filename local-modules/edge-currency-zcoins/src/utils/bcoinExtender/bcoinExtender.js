// @flow

import bcoin from 'bcoin'

import { patchPbkdf2, patchSecp256k1 } from './patchCrypto.js'
import { patchTransaction } from './replayProtection.js'

export type BcoinCurrencyInfo = {
  type: string,
  magic: number,
  formats: Array<string>,
  forks?: Array<string>,
  keyPrefix: {
    privkey: number,
    xpubkey: number,
    xprivkey: number,
    xpubkey58: string,
    xprivkey58: string,
    coinType: number
  },
  addressPrefix: {
    pubkeyhash: number,
    scripthash: number,
    cashAddress?: string,
    pubkeyhashLegacy?: number,
    scripthashLegacy?: number,
    witnesspubkeyhash?: number,
    witnessscripthash?: number,
    bech32?: string
  },
  replayProtection?: {
    SIGHASH_FORKID: number,
    forcedMinVersion: number,
    forkId: number
  }
}

let cryptoReplaced = false
patchTransaction(bcoin)

export const addNetwork = (bcoinInfo: BcoinCurrencyInfo) => {
  const type = bcoinInfo.type

  if (bcoin.networks.types.indexOf(type) === -1) {
    bcoin.networks.types.push(type)
    bcoin.networks[type] = { ...bcoin.networks.main, ...bcoinInfo }
  }
}

export const patchCrypto = (secp256k1?: any = null, pbkdf2?: any = null) => {
  if (!cryptoReplaced) {
    if (secp256k1) {
      patchSecp256k1(bcoin, secp256k1)
      cryptoReplaced = true
    }
    if (pbkdf2) {
      patchPbkdf2(bcoin, pbkdf2)
      cryptoReplaced = true
    }
  }
}
