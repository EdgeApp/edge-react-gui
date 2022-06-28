// @flow

import { add, div, mul } from 'biggystring'
import * as React from 'react'

import s from '../../locales/strings.js'
import type { BorrowEngine } from '../../plugins/borrow-plugins/types.js'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { memo } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux.js'
import { mulToPrecision } from '../../util/utils.js'
import { TotalFiatAmount } from '../cards/LoanDebtsAndCollateralComponents.js'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile.js'

type Props = {
  borrowEngine: BorrowEngine,
  tokenId?: string,
  nativeAmount: string,
  type: 'debts' | 'collaterals',
  direction: 'increase' | 'decrease'
}

const LoanToValueTileComponent = (props: Props) => {
  const { borrowEngine, direction, nativeAmount, tokenId, type } = props
  const { currencyWallet } = borrowEngine
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode
  } = currencyWallet

  const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId]
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${fiatCurrencyCode}`] ?? '0')
  const multiplier = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode).multiplier)

  let totalDebtFiatValue = TotalFiatAmount(currencyWallet, borrowEngine.debts)
  let totalCollateralFiatValue = TotalFiatAmount(currencyWallet, borrowEngine.collaterals)
  const currentValue = div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  const changeAmount = mul(mul(div(nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRate), direction === 'increase' ? '1' : '-1')

  if (type === 'debts') {
    totalDebtFiatValue = add(totalDebtFiatValue, changeAmount)
  } else {
    totalCollateralFiatValue = add(totalCollateralFiatValue, changeAmount)
  }

  const futureValue = div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  return <PercentageChangeArrowTile title={s.strings.loan_loan_to_value_ratio} currentValue={currentValue} futureValue={futureValue} />
}

export const LoanToValueTile = memo(LoanToValueTileComponent)
