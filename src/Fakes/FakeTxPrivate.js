/* global */

export const FakeTxPrivate = {
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
  }
}
