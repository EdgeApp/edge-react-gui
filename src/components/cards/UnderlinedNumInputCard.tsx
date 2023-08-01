import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { useLayout } from '../../hooks/useLayout'
import { lstrings } from '../../locales/strings'
import { zeroString } from '../../util/utils'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Card } from './Card'

const UnderlinedNumInputCardComponent = (props: {
  currencyCode: string
  emptyPlaceholder?: string
  formattedAmount: string
  iconUri: string
  onPress?: () => void | Promise<void>
  title: string
}) => {
  const { currencyCode, emptyPlaceholder = lstrings.string_amount, formattedAmount, iconUri, onPress, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [baseTextLayout, handleBaseTextLayout] = useLayout()
  // HACK: EdgeText doesn't seem to work with useLayout, so instead subtract the
  // exponent width from the total valueContainer view width to get the textBase
  // width.
  const [exponentTextWidth, setExponentTextWidth] = React.useState(1)
  const handleExponentLayout = (event: any) => {
    setExponentTextWidth(event.nativeEvent.layout.width)
  }

  const handlePress = useHandler(async () => {
    if (onPress == null) return null
    try {
      await onPress()
    } catch (err) {
      showError(err)
    }
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
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
      </TouchableOpacity>
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

export const UnderlinedNumInputCard = React.memo(UnderlinedNumInputCardComponent)
