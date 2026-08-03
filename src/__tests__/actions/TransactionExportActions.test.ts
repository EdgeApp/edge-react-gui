import { expect, test } from '@jest/globals'
import type { EdgeTransaction } from 'edge-core-js'
import fs from 'fs'

import {
  exportTransactionsToBitwave,
  exportTransactionsToCSVInner,
  exportTransactionsToQBO
} from '../../actions/TransactionExportActions'

const csvResult = fs.readFileSync('./src/__tests__/exportCsvResult.csv', {
  encoding: 'utf8'
})
const qboResult = fs.readFileSync('./src/__tests__/exportQboResult.qbo', {
  encoding: 'utf8'
})
const bitwaveResult = fs.readFileSync(
  './src/__tests__/exportBitwaveResult.csv',
  { encoding: 'utf8' }
)

const BITWAVE_ACCOUNT_ID = 'pgM8cDt7bySnWTzs2MyI'

const edgeTxs: EdgeTransaction[] = [
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524476980,
    deviceDescription: 'iphone12',
    isSend: false,
    memos: [],
    metadata: {
      name: 'Crazy Person',
      category: 'Income:Mo Money',
      exchangeAmount: { 'iso:USD': 12000.45 },
      notes: 'Hell yeah! Thanks for the fish <<&&>>'
    },
    nativeAmount: '123000000',
    networkFee: '1000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
    parentNetworkFee: '10002',
    signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
    tokenId: null,
    txid: 'txid1',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524576980,
    deviceDescription: 'iphone12',
    isSend: true,
    memos: [],
    metadata: {
      name: 'Crazy Person 2',
      category: 'Expense:Less Money',
      exchangeAmount: { 'iso:USD': 36001.45 },
      notes: 'Hell yeah! Here\'s a fish"'
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    parentNetworkFee: '20001',
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: null,
    txid: 'txid2',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524676980,
    deviceDescription: 'iphone12',
    memos: [],
    metadata: {
      name: 'Transfer',
      category: 'Transfer:Edge',
      exchangeAmount: { 'iso:USD': 36001.45 },
      notes: ''
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: false,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: null,
    txid: 'txid3',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524776980,
    deviceDescription: 'iphone12',
    memos: [],
    metadata: {
      name: 'Transfer but actually income',
      category: 'Transfer:Edge',
      exchangeAmount: { 'iso:USD': 36001.45 },
      notes: ''
    },
    nativeAmount: '321000000',
    networkFee: '2000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: true,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: null,
    txid: 'txid4',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'USDC',
    date: 1524876980,
    deviceDescription: 'iphone12',
    isSend: true,
    memos: [],
    metadata: {
      name: 'Transfer but no fee',
      category: 'Transfer:Edge',
      exchangeAmount: { 'iso:USD': 36001.45 },
      notes: ''
    },
    nativeAmount: '-321000000',
    networkFee: '0',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    parentNetworkFee: '20001',
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: 'usdc_contract_address',
    txid: 'txid4',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1524976980,
    deviceDescription: 'iphone12',
    memos: [],
    metadata: {
      name: 'Transfer but no fiat amount',
      category: 'Transfer:Edge',
      exchangeAmount: { 'iso:USD': 0 },
      notes: ''
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: true,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: null,
    txid: 'txid5',
    walletId: ''
  },
  {
    blockHeight: 500000,
    currencyCode: 'BTC',
    date: 1525076980,
    deviceDescription: 'iphone12',
    isSend: true,
    memos: [],
    metadata: undefined,
    nativeAmount: '-321000000',
    networkFee: '2000',
    networkFees: [],
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    tokenId: null,
    txid: 'txid6',
    walletId: ''
  }
]

test('export CSV matches reference data', function () {
  const out = exportTransactionsToCSVInner(
    [...edgeTxs],
    'BTC',
    'iso:USD',
    '100'
  )
  expect(out).toEqual(csvResult)
})

test('export QBO matches reference data', function () {
  const out = exportTransactionsToQBO(
    [...edgeTxs],
    'iso:USD',
    '100',
    1524578071304
  )
  expect(out).toEqual(qboResult)
})

test('export Bitwave matches reference data', async function () {
  const out = await exportTransactionsToBitwave(
    BITWAVE_ACCOUNT_ID,
    [...edgeTxs],
    'BTC',
    '100'
  )
  expect(out).toEqual(bitwaveResult)
})

/**
 * Splits one CSV row into its fields, unwrapping quoted values and their
 * doubled-quote escapes.
 */
function parseCsvRow(row: string): string[] {
  const fields: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (quoted) {
      if (char !== '"') field += char
      else if (row[i + 1] === '"') {
        field += '"'
        i++
      } else quoted = false
    } else if (char === '"') quoted = true
    else if (char === ',') {
      fields.push(field)
      field = ''
    } else field += char
  }
  fields.push(field)
  return fields
}

// Bitwave column letters, as the importer numbers them:
const COLUMN_G_FEE = 6
const COLUMN_H_FEE_TICKER = 7
const COLUMN_I_TIME = 8
const COLUMN_M_ACCOUNT_ID = 12
const COLUMN_R_DESCRIPTION = 17
const COLUMN_W_CUSTOM_METADATA2 = 22

async function exportBitwaveRows(): Promise<string[][]> {
  const out = await exportTransactionsToBitwave(
    BITWAVE_ACCOUNT_ID,
    [...edgeTxs],
    'BTC',
    '100'
  )
  const [header, ...rows] = out.split('\n').filter(row => row !== '')

  // Guard the column letters this suite asserts on, so a reordered row object
  // fails here rather than silently invalidating every assertion below:
  const headerFields = parseCsvRow(header)
  expect(headerFields[COLUMN_G_FEE]).toEqual('fee')
  expect(headerFields[COLUMN_H_FEE_TICKER]).toEqual('feeTicker')
  expect(headerFields[COLUMN_I_TIME]).toEqual('time')
  expect(headerFields[COLUMN_M_ACCOUNT_ID]).toEqual('accountId')
  expect(headerFields[COLUMN_R_DESCRIPTION]).toEqual('description')
  expect(headerFields[COLUMN_W_CUSTOM_METADATA2]).toEqual(
    'metadata:myCustomMetadata2'
  )

  expect(rows.length).toBeGreaterThan(0)
  return rows.map(parseCsvRow)
}

test('export Bitwave leaves the fee columns blank', async function () {
  for (const fields of await exportBitwaveRows()) {
    expect(fields[COLUMN_G_FEE]).toEqual('')
    expect(fields[COLUMN_H_FEE_TICKER]).toEqual('')
  }
})

test('export Bitwave duplicates the description into custom metadata 2', async function () {
  for (const fields of await exportBitwaveRows()) {
    expect(fields[COLUMN_W_CUSTOM_METADATA2]).toEqual(
      fields[COLUMN_R_DESCRIPTION]
    )
  }
})

test('export Bitwave writes ISO 8601 UTC timestamps', async function () {
  const rows = await exportBitwaveRows()
  for (const fields of rows) {
    expect(fields[COLUMN_I_TIME]).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    )
  }
  // The first transaction's date is 1524476980 (2018-04-23T09:49:40Z):
  expect(rows[0][COLUMN_I_TIME]).toEqual('2018-04-23T09:49:40Z')
})

test('export Bitwave preserves the account id exactly', async function () {
  for (const fields of await exportBitwaveRows()) {
    expect(fields[COLUMN_M_ACCOUNT_ID]).toEqual(BITWAVE_ACCOUNT_ID)
  }
})
