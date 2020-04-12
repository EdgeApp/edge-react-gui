// @flow

import {
  electrumFetchHeaderSchema,
  electrumFetchHistorySchema,
  electrumFetchUtxoSchema,
  electrumHeaderSchema,
  electrumSubscribeHeadersSchema,
  electrumSubscribeScriptHashSchema
} from '../utils/jsonSchemas.js'
import { validateObject } from '../utils/utils.js'
import type { OnFailHandler, StratumTask } from './stratumConnection.js'

/**
 * Creates a server ping message.
 */
export function fetchPing (
  onDone: (requestMs: number) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'server.ping',
    params: [],
    onDone (reply: any, requestMs: number) {
      return onDone(requestMs)
    },
    onFail
  }
}

/**
 * Creates a server version query message.
 */
export function fetchVersion (
  onDone: (version: string, requestMs: number) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'server.version',
    params: ['Edge wallet', ['1.1', '1.4']],
    onDone (reply: any, requestMs: number) {
      if (
        Array.isArray(reply) &&
        (typeof reply[1] === 'string' || typeof reply[1] === 'number')
      ) {
        const version = reply[1].toString()
        if (
          version !== '1.1' &&
          version !== '1.2' &&
          version !== '1.3' &&
          version !== '1.4'
        ) {
          throw new Error(`Bad Stratum version ${version}`)
        }
        return onDone(version, requestMs)
      }
      throw new Error(`Bad Stratum version reply ${JSON.stringify(reply)}`)
    },
    onFail
  }
}

/**
 * Creates a height subscription message.
 * @param {*} onDone Called for every height update.
 * @param {*} onFail Called if the subscription fails.
 */
export function subscribeHeight (
  onDone: (height: number) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.headers.subscribe',
    params: [],
    onDone (reply: any) {
      if (validateObject(reply, electrumSubscribeHeadersSchema)) {
        return onDone(reply.params[0].block_height)
      }
      if (validateObject(reply, electrumHeaderSchema)) {
        return onDone(reply.block_height)
      }
      if (reply != null && typeof reply.height === 'number') {
        return onDone(reply.height)
      }
      throw new Error(`Bad Stratum height reply ${JSON.stringify(reply)}`)
    },
    onFail
  }
}

type LegacyBlockHeader = {
  block_height: number,
  version: number,
  prev_block_hash: string,
  merkle_root: string,
  timestamp: number,
  bits: number,
  nonce: number
}

type RawBlockHeader = {
  hex: string,
  timestamp: number
}

export type StratumBlockHeader = LegacyBlockHeader | RawBlockHeader

/**
 * Gets a block header.
 * @param {number} blockNumber Block number to fetch header for
 * @param {*} onDone Called when block header data is available.
 * @param {*} onFail Called if the request fails.
 */
export function fetchBlockHeader (
  blockNumber: number,
  timestampFromHeader: (header: Buffer, height: number) => number,
  onDone: (header: StratumBlockHeader) => void,
  onFail: OnFailHandler,
  stratumVersion: string = '1.4'
): StratumTask {
  // Legacy message format:
  if (stratumVersion < '1.4') {
    return {
      method: 'blockchain.block.get_header',
      params: [blockNumber],
      onDone (reply: any) {
        if (validateObject(reply, electrumFetchHeaderSchema)) {
          return onDone(reply)
        }
        throw new Error(`Bad Stratum get_header reply ${JSON.stringify(reply)}`)
      },
      onFail
    }
  }

  // Modern message format:
  return {
    method: 'blockchain.block.header',
    params: [blockNumber],
    onDone (reply: any) {
      if (typeof reply === 'string') {
        const header = Buffer.from(reply, 'hex')
        return onDone({
          hex: header.toString('hex'),
          timestamp: timestampFromHeader(header, blockNumber)
        })
      } else if (reply != null && typeof reply.header === 'string') {
        const header = Buffer.from(reply.header, 'hex')
        return onDone({
          hex: header.toString('hex'),
          timestamp: timestampFromHeader(header, blockNumber)
        })
      } else {
        throw new Error(`Bad Stratum header reply ${JSON.stringify(reply)}`)
      }
    },
    onFail
  }
}

/**
 * Gets a transaction.
 * @param {string} txid Txid of transaction to fetch
 * @param {*} onDone Called when block header data is available.
 * @param {*} onFail Called if the request fails.
 */
export function fetchTransaction (
  txid: string,
  onDone: (txData: string) => void,
  onFail: OnFailHandler,
  verbose: boolean = false
): StratumTask {
  return {
    method: 'blockchain.transaction.get',
    params: verbose ? [txid, verbose] : [txid],
    onDone (reply: any) {
      if (typeof reply === 'string' || verbose) {
        return onDone(reply)
      }
      throw new Error(
        `Bad Stratum transaction.get reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

/**
 * Subscribes to a script hash (address in script hash format).
 * @param {string} scriptHash Script hash to fetch change hash for
 * @param {*} onDone Called each time the script hash's hash changes.
 * @param {*} onFail Called if the request fails.
 */
export function subscribeScriptHash (
  scriptHash: string,
  onDone: (hash: string | null) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.scripthash.subscribe',
    params: [scriptHash],
    onDone (reply: any) {
      if (reply === null) {
        return onDone(reply)
      }
      if (typeof reply === 'string') {
        return onDone(reply)
      }
      if (validateObject(reply, electrumSubscribeScriptHashSchema)) {
        return onDone(reply.params[1])
      }
      throw new Error(
        `Bad Stratum scripthash.subscribe reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

export type StratumHistoryRow = {
  tx_hash: string,
  height: number,
  fee?: number
}

/**
 * Get tx history of a script hash (address in script hash format).
 * @param {string} scriptHash Script hash to fetch tx history for
 * @param {*} onDone Called when block header data is available.
 * @param {*} onFail Called if the request fails.
 */
export function fetchScriptHashHistory (
  scriptHash: string,
  onDone: (arrayTx: Array<StratumHistoryRow>) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.scripthash.get_history',
    params: [scriptHash],
    onDone (reply: any) {
      if (reply === null) {
        return onDone(reply)
      }
      if (validateObject(reply, electrumFetchHistorySchema)) {
        return onDone(reply)
      }
      throw new Error(
        `Bad Stratum scripthash.get_history reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

export type StratumUtxo = {
  tx_hash: string,
  tx_pos: number,
  value: number,
  height: number
}

/**
 * Get utxo list of a script hash (address in script hash format).
 * @param {string} scriptHash Script hash to fetch uxtos for
 * @param {*} onDone Called when block header data is available.
 * @param {*} onFail Called if the request fails.
 */
export function fetchScriptHashUtxo (
  scriptHash: string,
  onDone: (arrayTx: Array<StratumUtxo>) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.scripthash.listunspent',
    params: [scriptHash],
    onDone (reply: any) {
      if (validateObject(reply, electrumFetchUtxoSchema)) {
        return onDone(reply)
      }
      throw new Error(
        `Bad Stratum scripthash.listunspent reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

export function broadcastTx (
  rawTx: string,
  onDone: (txid: string) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.transaction.broadcast',
    params: [rawTx],
    onDone (reply: any) {
      if (typeof reply === 'string') {
        return onDone(reply)
      }
      throw new Error(
        `Bad Stratum transaction.broadcast reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

export function fetchEstimateFee (
  blocksToBeIncludedIn: string,
  onDone: (fee: number) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'blockchain.estimatefee',
    params: [blocksToBeIncludedIn],
    onDone (reply: any) {
      if (reply != null) {
        return onDone(parseInt(reply))
      }
      throw new Error(
        `Bad Stratum blockchain.estimatefee reply ${JSON.stringify(reply)}`
      )
    },
    onFail
  }
}

export function getMintMetadata (mints: { denom: number, pubcoin: string }[],
  onDone: (result: any) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'sigma.getmintmetadata',
    params: [{ mints }],
    onDone (reply: any) {
      return onDone(reply)
    },
    onFail
  }
}

export function getAnonymitySet (denom: number,
  setId: string,
  onDone: (result: any) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'sigma.getanonymityset',
    params: [denom + '', setId],
    onDone (reply: any) {
      return onDone(reply)
    },
    onFail
  }
}

export function getUsedCoinSerials (
  onDone: (result: any) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'sigma.getusedcoinserials',
    params: [],
    onDone (reply: any) {
      return onDone(reply)
    },
    onFail
  }
}

export function getLatestCoinIds (
  onDone: (result: any) => void,
  onFail: OnFailHandler
): StratumTask {
  return {
    method: 'sigma.getlatestcoinids',
    params: [],
    onDone (reply: any) {
      return onDone(reply)
    },
    onFail
  }
}
