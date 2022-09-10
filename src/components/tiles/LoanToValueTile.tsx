import { add, div, mul } from 'biggystring'
import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { BorrowEngine } from '../../plugins/borrow-plugins/types'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { memo } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { mulToPrecision } from '../../util/utils'
import { TotalFiatAmount } from '../cards/LoanDebtsAndCollateralComponents'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile'

type Props = {
  borrowEngine: BorrowEngine
  tokenId?: string
  nativeAmount: string
  type: 'debts' | 'collaterals'
  direction: 'increase' | 'decrease'
}

const LoanToValueTileComponent = (props: Props) => {
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

  let totalDebtFiatValue = TotalFiatAmount(currencyWallet, debts)
  let totalCollateralFiatValue = TotalFiatAmount(currencyWallet, collaterals)
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
