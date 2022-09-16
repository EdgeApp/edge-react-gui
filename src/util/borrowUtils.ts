import { add, div, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'

import { BorrowCollateral, BorrowDebt } from '../plugins/borrow-plugins/types'
import { useMemo } from '../types/reactHooks'
import { useSelector } from '../types/reactRedux'
import { mulToPrecision } from './utils'

// @ts-expect-error - Flow doesn't like that BorrowCollateral doesn't have an apr key despite that value not being relevant anywhere in this function. It doesn't even appear in this file.
export const useTotalFiatAmount = (wallet: EdgeCurrencyWallet, borrowArray: BorrowDebt[] | BorrowCollateral[]): string => {
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  const exchangeRates = useSelector(state => state.exchangeRates)

  return useMemo(() => {
    const getExchangeRate = (pair: string) => exchangeRates[pair] ?? '0'
    return borrowArray.reduce((total, obj) => {
      const { currencyCode, denominations } = obj.tokenId == null ? currencyInfo : allTokens[obj.tokenId] ?? {}
      const denom = denominations.find(denom => denom.name === currencyCode)
      const multiplier = denom?.multiplier ?? '1'
      return add(total, mul(div(obj.nativeAmount, multiplier, mulToPrecision(multiplier)), getExchangeRate(`${currencyCode}_${isoFiatCurrencyCode}`)))
    }, '0')
  }, [allTokens, borrowArray, currencyInfo, exchangeRates, isoFiatCurrencyCode])
}
