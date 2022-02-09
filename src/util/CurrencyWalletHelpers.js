// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import s from '../locales/strings.js'

/**
 * Safely get a wallet name, returning a fallback when the name is null.
 */
export function getWalletName(wallet: EdgeCurrencyWallet): string {
  const { name } = wallet
  if (name == null) return s.strings.string_no_name
  return name
}

export function getWalletFiat(wallet: EdgeCurrencyWallet): { fiatCurrencyCode: string, isoFiatCurrencyCode: string } {
  const { fiatCurrencyCode } = wallet
  return { fiatCurrencyCode: fiatCurrencyCode.replace('iso:', ''), isoFiatCurrencyCode: fiatCurrencyCode }
}

export function getCurrencyNames(wallet: EdgeCurrencyWallet) {
  const { currencyCode, displayName, metaTokens } = wallet.currencyInfo
  return metaTokens.reduce(
    (currencyNames, token) => {
      currencyNames[token.currencyCode] = token.currencyName
      return currencyNames
    },
    { [currencyCode]: displayName }
  )
}
