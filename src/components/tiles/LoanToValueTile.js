// @flow

import { add, div, gt, lt, mul, toFixed } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'

import s from '../../locales/strings.js'
import type { BorrowEngine } from '../../plugins/borrow-plugins/types.js'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { memo } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux.js'
import { mulToPrecision } from '../../util/utils.js'
import { Card } from '../cards/Card'
import { TotalFiatAmount } from '../cards/LoanDebtsAndCollateralComponents.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile.js'

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
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId]
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${fiatCurrencyCode}`] ?? '0')
  const multiplier = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode).multiplier)

  let totalDebtFiatValue = TotalFiatAmount(currencyWallet, borrowEngine.debts)
  let totalCollateralFiatValue = TotalFiatAmount(currencyWallet, borrowEngine.collaterals)
  const currentLTV = div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  const changeAmount = mul(mul(div(nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRate), direction === 'add' ? '1' : '-1')

  if (type === 'debts') {
    totalDebtFiatValue = add(totalDebtFiatValue, changeAmount)
  } else {
    totalCollateralFiatValue = add(totalCollateralFiatValue, changeAmount)
  }

  const futureLTV = div(totalDebtFiatValue, totalCollateralFiatValue, 2)

  const futureLTVcolor = gt(currentLTV, futureLTV) ? theme.positiveText : lt(currentLTV, futureLTV) ? theme.negativeText : theme.primaryText

  const currentLTVString = `${toFixed(mul(currentLTV, '100'), 1)}%`
  const futureLTVString = `${toFixed(mul(futureLTV, '100'), 1)}%`

  const renderArrow = () => {
    return (
      <View style={styles.arrowContainer}>
        <View style={styles.arrowTopLine} />
        <View style={styles.arrowBase} />
        <View style={styles.arrowBottomLine} />
      </View>
    )
  }

  return (
    <Tile type="static" title={s.strings.loan_loan_to_value_ratio}>
      <Card marginRem={[0, 1, 0, 1]} paddingRem={[0.5, 1, 0.5, 1]}>
        <View style={styles.container}>
          <EdgeText>{currentLTVString}</EdgeText>
          {renderArrow()}
          <EdgeText style={{ color: futureLTVcolor }}>{futureLTVString}</EdgeText>
        </View>
      </Card>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonArrow = {
    position: 'absolute',
    width: theme.thinLineWidth * 2,
    height: theme.rem(0.625),
    right: 0 + theme.thinLineWidth * 1.5,
    borderRadius: theme.thinLineWidth,
    backgroundColor: theme.icon
  }
  return {
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.rem(0.5)
    },
    arrowContainer: {
      flexDirection: 'row'
    },
    arrowBase: {
      width: theme.rem(3),
      height: theme.thinLineWidth * 2,
      borderRadius: theme.thinLineWidth,
      backgroundColor: theme.icon
    },
    arrowTopLine: {
      ...commonArrow,
      bottom: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '-45deg' }]
    },
    arrowBottomLine: {
      ...commonArrow,
      top: 0 - theme.thinLineWidth * 1.325,
      transform: [{ rotateZ: '45deg' }]
    }
  }
})

export const LoanToValueTile = memo(LoanToValueTileComponent)
