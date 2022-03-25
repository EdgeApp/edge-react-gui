// @flow

import { sub } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../constants/WalletAndCurrencyConstants'
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

export const getAvailableBalance = (wallet: EdgeCurrencyWallet, tokenCode?: string): string => {
  const { currencyCode, pluginId } = wallet.currencyInfo
  const cCode = tokenCode ?? currencyCode
  let balance = wallet.balances[cCode] ?? '0'
  if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported) {
    const lockedBalance = wallet.balances[`${cCode}${STAKING_BALANCES.locked}`] ?? '0'
    balance = sub(balance, lockedBalance)
  }
  return balance
}
