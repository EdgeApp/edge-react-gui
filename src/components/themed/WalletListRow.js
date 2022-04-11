// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  currencyCode: string,
  exchangeRateText?: string,
  exchangeRateType?: 'neutral' | 'positive' | 'negative',
  children?: React.Node,
  icon?: React.Node,
  iconUri?: string,
  iconSizeRem?: number,
  gradient?: boolean,
  onPress?: () => void,
  onLongPress?: () => void,
  walletName?: string
}

export const WalletListRowComponent = (props: Props) => {
  const { currencyCode, children, gradient = false, icon, iconUri = '', iconSizeRem, onPress, onLongPress, walletName = '' } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const iconSizeStyle = iconSizeRem != null ? { width: theme.rem(iconSizeRem), height: theme.rem(iconSizeRem) } : styles.iconSize
  const iconComponent = icon == null ? <FastImage style={iconSizeStyle} source={{ uri: iconUri }} /> : icon

  const WalletRow = ({ children }) =>
    gradient ? <Gradient style={styles.containerGradient}>{children}</Gradient> : <View style={styles.container}>{children}</View>

  return (
    <WalletRow gradient={gradient}>
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
        {currencyCode === '' ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={theme.primaryText} size="large" />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>{iconComponent}</View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailsTop}>
                <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
                {props.exchangeRateText != null ? (
                  <EdgeText style={[styles.exchangeRateStyle, styles[props.exchangeRateType ?? 'neutral']]}>{props.exchangeRateText}</EdgeText>
                ) : null}
              </View>
              <View style={styles.detailsBottom}>
                <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
              </View>
            </View>
            <View style={styles.childrenContainer}>{children}</View>
          </View>
        )}
      </TouchableOpacity>
    </WalletRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Background
  containerGradient: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  container: {
    backgroundColor: theme.modal
  },
  // Top level Containers
  contentContainer: {
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  loaderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1.75)
  },
  // Data containers //
  // Icon Container
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  // Details Container
  detailsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginRight: theme.rem(0.5)
  },
  // Children (Right part) Container
  childrenContainer: {
    flex: 0
  },
  // Other styles
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },
  detailsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  detailsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  detailsCurrency: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  exchangeRateStyle: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  detailsName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  // Difference Percentage Styles
  neutral: {
    color: theme.secondaryText
  },
  positive: {
    color: theme.positiveText
  },
  negative: {
    color: theme.negativeText
  }
}))

export const WalletListRow = memo(WalletListRowComponent)
