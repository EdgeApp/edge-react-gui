// @flow

import { div, mul } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { DECIMAL_PRECISION } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { Card } from './Card'

export const BorrowAmountCard = ({
  dAppIcon,
  fiatCode,
  formattedAmount,
  maxAmount,
  title
}: {
  dAppIcon: string,
  fiatCode: string,
  formattedAmount: string,
  maxAmount: string,
  title: string
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Card>
      <View style={styles.cardContainer}>
        <View style={styles.leftContainer}>
          <EdgeText style={{ fontFamily: theme.fontFaceMedium }}>{title}</EdgeText>
          <View style={styles.valueContainer}>
            <EdgeText style={styles.valueFont}>{formattedAmount}</EdgeText>
            <EdgeText>{fiatCode}</EdgeText>
          </View>
          <View style={[styles.bar, { width: mul(div(formattedAmount, maxAmount, DECIMAL_PRECISION), '100') + '%' }]} />
        </View>
        <FastImage style={styles.icon} source={{ uri: dAppIcon }} />
      </View>
    </Card>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bar: {
    borderColor: theme.walletProgressIconFill,
    borderTopWidth: theme.thickLineWidth,
    zIndex: 100
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'column',
    alignSelf: 'flex-start'
  },
  icon: {
    height: theme.rem(4),
    width: theme.rem(4)
  },
  valueContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start'
  },
  valueFont: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2),
    marginRight: theme.rem(0.5)
  }
}))
