import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { BorrowEngine } from '../../plugins/borrow-plugins/types'
import { Theme, useTheme } from '../services/ThemeContext'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile'

export const LtvRatioTile = (props: { borrowEngine: BorrowEngine; futureValue: string }) => {
  const theme = useTheme()
  const { borrowEngine, futureValue } = props
  const currentValue = borrowEngine.loanToValue

  // Determine colors
  const currentValueColor = getLtvColorValue(currentValue, theme)
  const futureValueColor = getLtvColorValue(parseFloat(futureValue), theme)

  return (
    <PercentageChangeArrowTile
      title={lstrings.loan_loan_to_value_ratio}
      currentValue={currentValue.toString()}
      currentValueColor={currentValueColor}
      futureValue={futureValue}
      futureValueColor={futureValueColor}
    />
  )
}

export const getLtvColorValue = (ltvValue: number, theme: Theme): string => {
  return ltvValue > 0.7 ? theme.dangerText : ltvValue > 0.6 ? theme.warningText : ltvValue > 0 ? theme.positiveText : theme.deactivatedText
}
