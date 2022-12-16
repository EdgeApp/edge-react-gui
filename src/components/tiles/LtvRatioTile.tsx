import { add, div, max, mul } from 'biggystring'
import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { BorrowEngine } from '../../plugins/borrow-plugins/types'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { useTotalFiatAmount } from '../../util/borrowUtils'
import { mulToPrecision, zeroString } from '../../util/utils'
import { Theme, useTheme } from '../services/ThemeContext'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile'

export const LtvRatioTile = (props: {
  borrowEngine: BorrowEngine
  tokenId?: string
  nativeAmount: string
  type: 'debts' | 'collaterals'
  direction: 'increase' | 'decrease'
}) => {
  const theme = useTheme()
  const { borrowEngine, direction, nativeAmount, tokenId, type } = props

  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')

  const { currencyWallet } = borrowEngine
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode
  } = currencyWallet

  const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId]
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${fiatCurrencyCode}`] ?? '0')
  const multiplier = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode).multiplier)

  let totalDebtFiatValue = useTotalFiatAmount(currencyWallet, debts)
  let totalCollateralFiatValue = useTotalFiatAmount(currencyWallet, collaterals)
  const currentValue = zeroString(totalCollateralFiatValue) ? '0' : div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  const changeAmount = mul(mul(div(nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRate), direction === 'increase' ? '1' : '-1')

  if (type === 'debts') {
    totalDebtFiatValue = add(totalDebtFiatValue, changeAmount)
  } else {
    totalCollateralFiatValue = add(totalCollateralFiatValue, changeAmount)
  }

  // Floor the futureValue at '0'
  const futureValue = max('0', zeroString(totalCollateralFiatValue) ? '0' : div(totalDebtFiatValue, totalCollateralFiatValue, 2))

  // Determine colors
  const currentValueColor = getLtvColorValue(parseFloat(currentValue), theme)
  const futureValueColor = getLtvColorValue(parseFloat(futureValue), theme)

  return (
    <PercentageChangeArrowTile
      title={s.strings.loan_loan_to_value_ratio}
      currentValue={currentValue}
      currentValueColor={currentValueColor}
      futureValue={futureValue}
      futureValueColor={futureValueColor}
    />
  )
}

export const getLtvColorValue = (ltvValue: number, theme: Theme): string => {
  return ltvValue > 0.7 ? theme.dangerText : ltvValue > 0.6 ? theme.warningText : ltvValue > 0 ? theme.positiveText : theme.deactivatedText
}
