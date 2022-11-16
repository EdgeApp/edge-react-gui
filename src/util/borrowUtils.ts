import { add, div, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { LoanManageType } from '../components/scenes/Loans/LoanManageScene'
import { showError } from '../components/services/AirshipInstance'
import { BorrowCollateral, BorrowDebt } from '../plugins/borrow-plugins/types'
import { useSelector } from '../types/reactRedux'
import { mulToPrecision } from './utils'

export const useTotalFiatAmount = (wallet: EdgeCurrencyWallet, borrowArray: BorrowDebt[] | BorrowCollateral[]): string => {
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  const exchangeRates = useSelector(state => state.exchangeRates)

  return React.useMemo(() => {
    const getExchangeRate = (pair: string) => exchangeRates[pair] ?? '0'
    // @ts-expect-error
    return borrowArray.reduce((total, obj) => {
      const { currencyCode, denominations } = obj.tokenId == null ? currencyInfo : allTokens[obj.tokenId] ?? {}
      const denom = denominations.find(denom => denom.name === currencyCode)
      const multiplier = denom?.multiplier ?? '1'
      return add(total, mul(div(obj.nativeAmount, multiplier, mulToPrecision(multiplier)), getExchangeRate(`${currencyCode}_${isoFiatCurrencyCode}`)))
    }, '0')
  }, [allTokens, borrowArray, currencyInfo, exchangeRates, isoFiatCurrencyCode])
}

export const getWalletPickerExcludeWalletIds = (
  wallets: { [wallet: string]: EdgeCurrencyWallet },
  loanManageType: LoanManageType,
  borrowEngineWallet: EdgeCurrencyWallet
): string[] => {
  return Object.keys(wallets).filter(walletId => {
    switch (loanManageType) {
      case 'loan-manage-deposit':
        return walletId !== borrowEngineWallet.id && wallets[walletId].currencyInfo.pluginId !== 'bitcoin'
      case 'loan-manage-borrow':
      case 'loan-manage-repay':
      case 'loan-manage-withdraw':
        return walletId !== borrowEngineWallet.id
      default:
        showError(`getWalletPickerExcludeWalletIds unhandled case: ${loanManageType}. Allowing all wallets.`)
        return false
    }
  })
}
