// @flow

export const imageServerUrl = 'https://developer.airbitz.co/content'
export const InfoServer = 'https://info1.edgesecure.co:8444/v1'

export const FixCurrencyCode = (currencyCode: string): string => {
  switch (currencyCode) {
    case 'BTC':
      return 'BC1'
    case 'DGB':
      return 'DGB1'
    default:
      return currencyCode
  }
}
