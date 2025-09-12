import { add, div, mul } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import type { LoanManageType } from '../components/scenes/Loans/LoanManageScene'
import { showError } from '../components/services/AirshipInstance'
import type {
  BorrowCollateral,
  BorrowDebt
} from '../plugins/borrow-plugins/types'
import { getExchangeRate } from '../selectors/WalletSelectors'
import { useSelector } from '../types/reactRedux'
import { mulToPrecision } from './utils'

export const useTotalFiatAmount = (
  wallet: EdgeCurrencyWallet,
  borrowArray: BorrowDebt[] | BorrowCollateral[]
): string => {
  const {
    currencyConfig: { allTokens },
    currencyInfo
  } = wallet

  const exchangeRates = useSelector(state => state.exchangeRates)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  return React.useMemo(() => {
    // @ts-expect-error
    return borrowArray.reduce((total, obj) => {
      const { currencyCode, denominations } =
        obj.tokenId == null ? currencyInfo : allTokens[obj.tokenId] ?? {}
      const denom = denominations.find(denom => denom.name === currencyCode)
      const multiplier = denom?.multiplier ?? '1'
      return add(
        total,
        mul(
          div(obj.nativeAmount, multiplier, mulToPrecision(multiplier)),
          getExchangeRate(
            exchangeRates,
            wallet.currencyInfo.pluginId,
            obj.tokenId,
            defaultIsoFiat
          )
        )
      )
    }, '0')
  }, [
    borrowArray,
    currencyInfo,
    allTokens,
    exchangeRates,
    wallet.currencyInfo.pluginId,
    defaultIsoFiat
  ])
}

export const getWalletPickerExcludeWalletIds = (
  wallets: Record<string, EdgeCurrencyWallet>,
  loanManageType: LoanManageType,
  borrowEngineWallet: EdgeCurrencyWallet
): string[] => {
  return Object.keys(wallets).filter(walletId => {
    switch (loanManageType) {
      case 'loan-manage-deposit':
        return (
          walletId !== borrowEngineWallet.id &&
          wallets[walletId].currencyInfo.pluginId !== 'bitcoin'
        )
      case 'loan-manage-borrow':
      case 'loan-manage-repay':
      case 'loan-manage-withdraw':
        return walletId !== borrowEngineWallet.id
      default:
        showError(
          `getWalletPickerExcludeWalletIds unhandled case: ${
            loanManageType as string
          }. Allowing all wallets.`
        )
        return false
    }
  })
}
