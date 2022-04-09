// @flow
/* globals test expect */

import { type EdgeTransaction } from 'edge-core-js'
import fs from 'fs'

import { exportTransactionsToCSVInner, exportTransactionsToQBOInner } from '../actions/TransactionExportActions.js'

const csvResult = fs.readFileSync('./src/__tests__/exportCsvResult.csv', { encoding: 'utf8' })
const qboResult = fs.readFileSync('./src/__tests__/exportQboResult.qbo', { encoding: 'utf8' })

const edgeTxs: EdgeTransaction[] = [
  {
    txid: 'txid1',
    date: 1524476980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '123000000',
    networkFee: '1000',
    ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
    signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
    parentNetworkFee: '10002',
    metadata: {
      name: 'Crazy Person',
      category: 'Income:Mo Money',
      notes: 'Hell yeah! Thanks for the fish <<&&>>',
      amountFiat: 12000.45
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid2',
    date: 1524576980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    parentNetworkFee: '20001',
    metadata: {
      name: 'Crazy Person 2',
      category: 'Expense:Less Money',
      notes: 'Hell yeah! Here\'s a fish"',
      amountFiat: 36001.45
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid3',
    date: 1524676980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    metadata: {
      name: 'Transfer',
      category: 'Transfer:Edge',
      notes: '',
      amountFiat: 36001.45
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid4',
    date: 1524776980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    metadata: {
      name: 'Transfer but actually income',
      category: 'Transfer:Edge',
      notes: '',
      amountFiat: 36001.45
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid4',
    date: 1524876980,
    currencyCode: 'USDC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '0',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    parentNetworkFee: '20001',
    metadata: {
      name: 'Transfer but no fee',
      category: 'Transfer:Edge',
      notes: '',
      amountFiat: 36001.45
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid5',
    date: 1524976980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    metadata: {
      name: 'Transfer but no fiat amount',
      category: 'Transfer:Edge',
      notes: '',
      amountFiat: 0
    },
    deviceDescription: 'iphone12'
  },
  {
    txid: 'txid6',
    date: 1525076980,
    currencyCode: 'BTC',
    blockHeight: 500000,
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    metadata: undefined,
    deviceDescription: 'iphone12'
  }
]

test('export CSV matches reference data', function () {
  const out = exportTransactionsToCSVInner([...edgeTxs], 'BTC', 'USD', '100')
  expect(out).toEqual(csvResult)
})

test('export QBO matches reference data', function () {
  const out = exportTransactionsToQBOInner([...edgeTxs], 'BTC', 'USD', '100', 1524578071304)
  expect(out).toEqual(qboResult)
})
