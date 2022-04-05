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
  editIcon?: React.Node,
  gradient?: boolean,
  onPress?: () => void,
  onLongPress?: () => void,
  walletName?: string
}

export const WalletListRowComponent = (props: Props) => {
  const { currencyCode, children, gradient = false, icon, iconUri = '', iconSizeRem, editIcon, onPress, onLongPress, walletName = '' } = props
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
          <View style={styles.rowContainer}>
            <View style={styles.iconContainer}>{iconComponent}</View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailsLeft}>
                <EdgeText style={styles.detailsCurrency} disableFontScaling>
                  {currencyCode}
                </EdgeText>
                {props.exchangeRateText != null ? (
                  <EdgeText style={styles[props.exchangeRateType ?? 'neutral']} disableFontScaling>
                    {props.exchangeRateText}
                  </EdgeText>
                ) : null}
              </View>
              <View style={styles.detailsRight}>{editIcon ? <View style={styles.editIcon}>{editIcon}</View> : null}</View>

              <EdgeText style={styles.detailsName} disableFontScaling>
                {walletName}
              </EdgeText>
            </View>
            {children}
          </View>
        )}
      </TouchableOpacity>
    </WalletRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Row Component
  containerGradient: {
    flex: 1,
    paddingHorizontal: theme.rem(1)
  },
  container: {
    backgroundColor: theme.modal
  },

  // Row Containers
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: theme.rem(1)
  },
  loaderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1.75)
  },

  // Icons
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },
  editIcon: {
    marginLeft: theme.rem(0.75)
  },

  // Details
  detailsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginRight: theme.rem(0.5)
  },
  detailsCurrency: {
    fontFamily: theme.fontFaceMedium,
    marginRight: theme.rem(0.75)
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  detailsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
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
