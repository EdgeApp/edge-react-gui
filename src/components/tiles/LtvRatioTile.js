// @flow

import { add, div, mul } from 'biggystring'
import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { type BorrowEngine } from '../../plugins/borrow-plugins/types'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { useTotalFiatAmount } from '../../util/borrowUtils'
import { mulToPrecision, zeroString } from '../../util/utils'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile'

export const LtvRatioTile = (props: {
  borrowEngine: BorrowEngine,
  tokenId?: string,
  nativeAmount: string,
  type: 'debts' | 'collaterals',
  direction: 'increase' | 'decrease'
}) => {
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

  const futureValue = zeroString(totalCollateralFiatValue) ? '0' : div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  return <PercentageChangeArrowTile title={s.strings.loan_loan_to_value_ratio} currentValue={currentValue} futureValue={futureValue} />
}
