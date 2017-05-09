/* global */

const faker = require('faker')

export const FakeTxEnginePrivate = {
  initOptions: undefined,
  masterPrivateKey: undefined, // PRIVATEgjXJSvjNRSLic2xvcep9AP9n1UKwC2CwmXb3Y5sSNspyr
  masterPublicKey: undefined, // PUBLICDgjXJSvjNRSLic2xvcep9AP9n1UKwC2CwmXb3Y5sSNspyr
  abcTxLibAccess: undefined,
  callbacks: undefined,
  tokensStatus: false,
  supportedTokens: ['XCP', 'TATIANACOIN'],
  enabledTokens: [],
  transactionFees: {
    high: 15,
    standard: 10,
    low: 5
  },
  addresses: {
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {currentBalance: 58, isUsed: true},
    '1this_is_a_fresh_address1111111111': {currentBalance: 0, isUsed: false},
    '1this is a used address11111111111': {currentBalance: 0, isUsed: true}
  },
  blockHeight: 1,
  transactions: [
    { // 00
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Income:Block Reward',
        notes: 'Some notes about this transaction',
        amountFiat: 5,
        bizId: undefined,
        miscJson: ''
      },
      txid: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      date: '2009-01-03 18:15:05',
      blockHeight: 0, // 0 means unconfirmed, 1-based
      amountSatoshi: 50,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 50,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 01
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '3387418aaddb4927209c5032f515aa442a6587d6e54677f08a03b8fa7789e688',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 51,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 02
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '4574958d135e66a53abf9c61950aba340e9e140be50efeea9456aa9f92bf40b5',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 52,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 03
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '8b960c87f9f1a6e6910e214fcf5f9c69b60319ba58a39c61f299548412f5a1c6',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 53,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 04
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: 'f1db8d2c1ed576bc22f73016b3cbc1496797c442c7df9bbbe7649df2460c78aa',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 54,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 05
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '60ff2dfdf67917040139903a0141f7525a7d152365b371b35fd1cf83f1d7f704',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 55,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 06
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '8f6b63012753005236b1b76e4884e4dee7415e05ab96604d353001662cde6b53',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 56,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 07
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '495167f5b9d55519717cb171208a98ffd347410169f258b598b1b65447d8e078',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 57,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    },
    { // 08
      abcWalletTransaction: '',
      metadata: {
        payeeName: 'Satoshi Nakamoto',
        category: 'Tips',
        notes: 'Thanks for the free parking',
        amountFiat: 1,
        bizId: undefined,
        miscJson: ''
      },
      txid: '1b703ca32b2da08cf896081a96c48f6433641e2c7d805fd170a31b0cbfb900df',
      date: '2009-01-03 18:15:05',
      blockHeight: 0,
      amountSatoshi: 1,
      providerFee: 0,
      networkFee: 0,
      runningBalance: 58,
      signedTx: true,
      otherParams: {
        isReplaceByFee: false,
        isDoubleSpend: false,
        inputOutputList: []
      }
    }
  ],

  getInfo: { // Details of supported currency
    currencyCode: 'BTC', // The 3 character code for the currency
    denominations: [ // An array of Objects of the possible denominations for this currency
      {
        name: 'bits', // The human readable string to describe the denomination
        multiplier: 100, // The value to multiply the smallest unit of currency to get to the denomination
        symbol: 'ƀ' // The human readable 1-3 character symbol of the currency, e.g “Ƀ”
      },
      {
        name: 'mBTC',
        multiplier: 100000,
        symbol: 'mɃ'
      },
      {
        name: 'BTC',
        multiplier: 100000000,
        symbol: 'Ƀ'
      }
    ],
    symbolImage: 'qq/2iuhfiu1/3iufhlq249r8yq34tiuhq4giuhaiwughiuaergih/rg', // Base64 encoded png or jpg image of the currency symbol (optional)
    metaTokens: [ // Array of objects describing the supported metatokens
      {
        currencyCode: 'XCP',
        denominations: [{
          name: 'XCP',
          multiplier: 1
        }],
        symbolImage: 'fe/3fthfiu1/3iufhlq249r8yq34tiuhqggiuhaiwughiuaergih/ef'
      },
      {
        currencyCode: 'TATIANACOIN',
        denominations: [{
          name: 'TATIANACOIN',
          multiplier: 1
        }],
        symbolImage: 'qe/3fthfi2fg1/3iufhlq249r8yq34tiuhqggiuhaiwughiuaergih/ef'
      }
    ]
  },

  init: function (abcTxLibAccess, options, callbacks) {
    this.setABCTxLibAccess(abcTxLibAccess)
    this.setCallbacks(callbacks)
    this.setKeys(options)
    // check all address for funds, then call abcWalletTxAddressesChecked aka logging into the app
    const progressRatio = 1
    this.callbacks.abcWalletTxAddressesChecked(this.abcWalletTx, progressRatio)

    return true
  },

  setKeys: function (keys) {
    const {
      masterPrivateKey,
      masterPublicKey
    } = keys

    this.setMasterPrivateKey(masterPrivateKey)
    this.setMasterPublicKey(masterPublicKey)
  },

  setMasterPrivateKey: function (masterPrivateKey) {
    this.masterPrivateKey = masterPrivateKey

    return true
  },

  setMasterPublicKey: function (masterPublicKey) {
    this.masterPublicKey = masterPublicKey

    return true
  },

  getMasterPrivateKey: function () {
    return this.masterPrivateKey
  },

  getMasterPublicKey: function () {
    return this.masterPublicKey
  },

  setCallbacks: function (callbacks) {
    this.callbacks = callbacks

    return true
  },

  getCallbacks: function () {
    return this.callbacks
  },

  setABCTxLibAccess: function (ABCTxLibAccess) {
    this.ABCTxLibAccess = ABCTxLibAccess

    return true
  },

  enableTokens: function (options = {}) {
    const {
      tokens
    } = options
    const desiredTokens = tokens.filter((token) => {
      return this.supportedTokens.includes(token)
    })

    this.enabledTokens = this.enabledTokens.concat(desiredTokens).filter((elem, index, self) => {
      return index === self.indexOf(elem)
    })
    this.tokensStatus = true

    return this.enabledTokens
  },

  getTokensStatus: function () {
    return this.tokensStatus
  },

  getBalance: function (options) {
    const addresses = Object.values(this.addresses)
    const balance =
      addresses.reduce((acc, address) => {
        return acc + address.currentBalance
      }, 0)

    return balance
  },

  getNumTransactions: function (options = {}) {
    const transactions = this.transactions
    const numTransactions = transactions.length

    return numTransactions
  },

  getTransactions: function (options = {}) {
    const {
      startIndex, // The starting index into the list of transactions. 0 specifies the newest transaction
      numEntries // The number of entries to return. If there aren’t enough transactions to return numEntries, then the TxLib should return the maximum possible
    } = options
    const endIndex = (startIndex + numEntries) || undefined // if user doesn't supply a startIndex or numEntries, return undefined instead of NaN

    const transactions = this.transactions.slice(startIndex, endIndex)

    return transactions
  },

  getFreshAddress: function (options = {}) {
    const addressList = Object.entries(this.addresses)
    const address = addressList.find((address) => {
      return address[1].isUsed === false
    })

    return address[0]
  },

  isAddressUsed: function (address) {
    const targetAddress = this.addresses[address]
    const isUsed = targetAddress.isUsed

    return isUsed
  },

  addGapLimitAddresses: function (options = {}) {
    return true
  },

  makeSpend: function (abcSpendInfo) {
    const {
      currencyCode
    } = abcSpendInfo

    if (!this.validCurrencyCode(currencyCode)) {
      return new Error('Invalid currencyCode')
    }

    const amountSatoshi = abcSpendInfo.spendTargets.reduce((acc, target) => {
      return acc + target.amountSatoshi
    }, 0)

    const newTransaction = this.getNewTransaction({amountSatoshi})

    return newTransaction
  },

  validCurrencyCode: function (currencyCode) {
    const validCurrencyCodes = this.supportedTokens.concat([undefined, null, 'BTC'])
    const isCurrencyCodeValid = validCurrencyCodes.includes(currencyCode)

    return isCurrencyCodeValid
  },

  getBlockHeight: function () {
    return this.blockHeight
  },

  addNewTransactions: function (abcTransactions) {
    abcTransactions.forEach((abcTransaction) => {
      this.transactions.push(abcTransaction)
      Object.entries(this.addresses)[0][1].currentBalance += abcTransaction.amountSatoshi

      this.callbacks.abcWalletTxTransactionsChanged([abcTransaction])
    })

    return abcTransactions.length
  },

  addNewTransaction: function (abcTransactions) {
    const newTransaction = this.getNewTransaction()
    this.transactions.push(newTransaction)
    Object.entries(this.addresses)[0][1].currentBalance += newTransaction.amountSatoshi

    this.callbacks.abcWalletTxTransactionsChanged([newTransaction])

    return newTransaction
  },

  addNewBlock: function () {
    this.blockHeight += 1

    this.callbacks.abcWalletTxBlockHeightChanged()

    return this.blockHeight
  },

  getNewTransaction: function (options = {}) {
    const {
      abcWalletTransaction,
      txid,
      date,
      blockHeight,
      amountSatoshi,
      providerFee,
      networkFee,
      runningBalance,
      signedTx,
      otherParams
    } = options

    const newTransaction = {
      abcWalletTransaction: abcWalletTransaction || '',
      txid: txid || '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      date: date || faker.date.past(),
      blockHeight: blockHeight || faker.random.number(100000),
      amountSatoshi: amountSatoshi || faker.random.number(10),
      providerFee: providerFee || faker.random.arrayElement([undefined, faker.random.number(1)]),
      networkFee: networkFee || faker.random.number(100),
      runningBalance: runningBalance || faker.random.number(100),
      signedTx: signedTx || faker.random.arrayElement([undefined, '1234567890123456789012345678901234567890123456789012345678901234']),
      otherParams: otherParams || {
        isReplaceByFee: faker.random.boolean(),
        isDoubleSpend: faker.random.boolean(),
        inputOutputList: []
      }
    }

    return newTransaction
  },

  signTx: function (newAbcTx) {
    newAbcTx.signedTx = '1234567890123456789012345678901234567890123456789012345678901234'

    return newAbcTx
  }
}
