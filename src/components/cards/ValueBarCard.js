// @flow

import { div, mul } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { memo, useState } from '../../types/reactHooks'
import { DECIMAL_PRECISION } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { Card } from './Card'

const ValueBarCardComponent = ({
  currencyCode,
  formattedAmount,
  iconUri,
  maxAmount,
  title
}: {
  currencyCode: string,
  formattedAmount: string,
  iconUri: string,
  maxAmount: string,
  title: string
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const [barWidth, setbarWidth] = useState<string>('')
  const handleLayout = (event: any) => {
    setbarWidth(mul(div(formattedAmount, maxAmount, DECIMAL_PRECISION), '100') + '%')
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Card>
        <View style={styles.cardContainer}>
          <View style={styles.leftContainer}>
            <EdgeText style={styles.title}>{title}</EdgeText>
            <View style={styles.valueContainer}>
              <EdgeText style={styles.valueFont}>{formattedAmount}</EdgeText>
              <EdgeText>{currencyCode}</EdgeText>
            </View>
            {barWidth === '' ? null : <View style={[styles.bar, { width: barWidth }]} />}
          </View>
          <FastImage style={styles.icon} source={{ uri: iconUri }} />
        </View>
      </Card>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bar: {
    borderColor: theme.walletProgressIconFill,
    borderTopWidth: theme.thickLineWidth,
    zIndex: 100
  },
  container: {
    margin: theme.rem(0.5)
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
  title: { fontFamily: theme.fontFaceMedium },
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

export const ValueBarCard = memo(ValueBarCardComponent)
