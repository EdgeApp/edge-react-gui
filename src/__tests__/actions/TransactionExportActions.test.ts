import { expect, test } from '@jest/globals'
import { EdgeTransaction } from 'edge-core-js'
import fs from 'fs'

import { exportTransactionsToCSVInner, exportTransactionsToQBOInner } from '../../actions/TransactionExportActions'

const csvResult = fs.readFileSync('./src/__tests__/exportCsvResult.csv', { encoding: 'utf8' })
const qboResult = fs.readFileSync('./src/__tests__/exportQboResult.qbo', { encoding: 'utf8' })

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
      notes: 'Hell yeah! Thanks for the fish <<&&>>',
      amountFiat: 12000.45
    },
    nativeAmount: '123000000',
    networkFee: '1000',
    ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
    parentNetworkFee: '10002',
    signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
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
      notes: 'Hell yeah! Here\'s a fish"',
      amountFiat: 36001.45
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    parentNetworkFee: '20001',
    signedTx: 'fiuwh34f98h3tiuheirgserg',
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
      notes: '',
      amountFiat: 36001.45
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: false,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
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
      notes: '',
      amountFiat: 36001.45
    },
    nativeAmount: '321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: true,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
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
      notes: '',
      amountFiat: 36001.45
    },
    nativeAmount: '-321000000',
    networkFee: '0',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    parentNetworkFee: '20001',
    signedTx: 'fiuwh34f98h3tiuheirgserg',
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
      notes: '',
      amountFiat: 0
    },
    nativeAmount: '-321000000',
    networkFee: '2000',
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    isSend: true,
    signedTx: 'fiuwh34f98h3tiuheirgserg',
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
    ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
    signedTx: 'fiuwh34f98h3tiuheirgserg',
    txid: 'txid6',
    walletId: ''
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
