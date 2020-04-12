/**
 * Created by Paul Puey 2017/11/09.
 * @flow
 */

export const InfoServerFeesSchema = {
  type: 'object',
  properties: {
    lowFee: { type: 'string' },
    standardFeeLow: { type: 'string' },
    standardFeeHigh: { type: 'string' },
    standardFeeLowAmount: { type: 'string' },
    standardFeeHighAmount: { type: 'string' },
    highFee: { type: 'string' }
  },
  required: [
    'lowFee',
    'standardFeeLow',
    'standardFeeHigh',
    'standardFeeLowAmount',
    'standardFeeHighAmount',
    'highFee'
  ]
}

export const EarnComFeesSchema = {
  type: 'object',
  properties: {
    fees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          minFee: { type: 'number' },
          maxFee: { type: 'number' },
          dayCount: { type: 'number' },
          memCount: { type: 'number' },
          minDelay: { type: 'number' },
          maxDelay: { type: 'number' },
          minMinutes: { type: 'number' },
          maxMinutes: { type: 'number' }
        },
        required: [
          'minFee',
          'maxFee',
          'dayCount',
          'memCount',
          'minDelay',
          'maxDelay',
          'minMinutes',
          'maxMinutes'
        ]
      }
    }
  },
  required: ['fees']
}

export const electrumHeaderSchema = {
  type: 'object',
  properties: {
    block_height: { type: 'number' },
    version: { type: 'number' },
    prev_block_hash: { type: 'string' },
    merkle_root: { type: 'string' },
    timestamp: { type: 'number' },
    bits: { type: 'number' },
    nonce: { type: ['number', 'string'] }
  },
  required: ['block_height', 'timestamp']
}

export const electrumSubscribeHeadersSchema = {
  type: 'object',
  properties: {
    method: { type: 'string' },
    params: {
      type: 'array',
      items: electrumHeaderSchema,
      minItems: 1,
      maxItems: 1
    }
  },
  required: ['method', 'params']
}

export const electrumSubscribeScriptHashSchema = {
  type: 'object',
  properties: {
    method: {
      const: 'blockchain.scripthash.subscribe'
    },
    params: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['method', 'params']
}

export const electrumFetchHeaderSchema = {
  type: 'object',
  properties: {
    block_height: { type: 'number' },
    version: { type: 'number' },
    prev_block_hash: { type: 'string' },
    merkle_root: { type: 'string' },
    timestamp: { type: 'number' },
    bits: { type: 'number' },
    nonce: { type: ['number', 'string'] }
  },
  required: [
    'block_height',
    'version',
    'prev_block_hash',
    'merkle_root',
    'timestamp',
    'bits',
    'nonce'
  ]
}

export const electrumFetchHistorySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      tx_hash: { type: 'string' },
      height: { type: 'number' },
      fee: { type: 'number' }
    },
    required: ['height', 'tx_hash']
  }
}

export const electrumFetchUtxoSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      tx_hash: { type: 'string' },
      tx_pos: { type: 'number' },
      height: { type: 'number' },
      value: { type: 'number' }
    },
    required: ['height', 'tx_hash', 'tx_pos', 'value']
  }
}
