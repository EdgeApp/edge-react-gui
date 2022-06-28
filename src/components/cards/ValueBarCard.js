// @flow

import * as React from 'react'
import { TouchableHighlight, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useLayout } from '../../hooks/useLayout'
import s from '../../locales/strings'
import { memo, useState } from '../../types/reactHooks'
import { zeroString } from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { Card } from './Card'

const ValueBarCardComponent = (props: {
  currencyCode: string,
  emptyPlaceholder?: string,
  formattedAmount: string,
  iconUri: string,
  onPress?: any => void | (any => Promise<void>),
  title: string
}) => {
  const { currencyCode, emptyPlaceholder = s.strings.string_amount, formattedAmount, iconUri, onPress, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [baseTextLayout, handleBaseTextLayout] = useLayout()
  // HACK: EdgeText doesn't seem to work with useLayout, so instead subtract the
  // exponent width from the total valueContainer view width to get the textBase
  // width.
  const [exponentTextWidth, setExponentTextWidth] = useState(1)
  const handleExponentLayout = (event: any) => {
    setExponentTextWidth(event.nativeEvent.layout.width)
  }

  return (
    <View style={styles.container}>
      <TouchableHighlight onPress={onPress} underlayColor={theme.backgroundGradientColors[0]}>
        <Card>
          <View style={styles.cardContainer}>
            <View style={styles.leftContainer}>
              <EdgeText style={styles.textTitle}>{title}</EdgeText>
              <View style={styles.valueContainer} onLayout={handleBaseTextLayout}>
                {zeroString(formattedAmount) ? (
                  <>
                    <EdgeText style={styles.textBaseSecondary}>{emptyPlaceholder}</EdgeText>
                    <EdgeText style={styles.textExponentSecondary} onLayout={handleExponentLayout}>
                      {currencyCode}
                    </EdgeText>
                  </>
                ) : (
                  <>
                    <EdgeText style={styles.textBasePrimary}>{formattedAmount}</EdgeText>
                    <EdgeText style={styles.textExponentPrimary} onLayout={handleExponentLayout}>
                      {currencyCode}
                    </EdgeText>
                  </>
                )}
              </View>
              <View style={[styles.bar, { width: baseTextLayout.width - exponentTextWidth }]} />
            </View>
            <FastImage style={styles.icon} source={{ uri: iconUri }} />
          </View>
        </Card>
      </TouchableHighlight>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bar: {
    borderColor: theme.walletProgressIconFill,
    borderRadius: 1.5,
    borderTopWidth: 3,
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
  textTitle: { fontFamily: theme.fontFaceMedium },
  textBasePrimary: {
    alignSelf: 'flex-end',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2),
    marginRight: theme.rem(0.25)
  },
  textBaseSecondary: {
    color: theme.deactivatedText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2),
    marginRight: theme.rem(0.25)
  },
  textExponentPrimary: {
    marginTop: theme.rem(0.25)
  },
  textExponentSecondary: {
    color: theme.deactivatedText
  },
  icon: {
    height: theme.rem(4),
    width: theme.rem(4)
  },
  valueContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    flex: 1,
    marginRight: theme.rem(0.25)
  }
}))

export const ValueBarCard = memo(ValueBarCardComponent)
