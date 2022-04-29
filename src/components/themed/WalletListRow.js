// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'

type Props = {|
  children?: React.Node,
  currencyCode: string,
  exchangeRateText?: string,
  exchangeRateType?: 'neutral' | 'positive' | 'negative',
  walletName: string,

  // Icon currency:
  pluginId?: string,
  tokenId?: string,
  walletId?: string,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: () => void
|}

export const WalletListRowComponent = (props: Props) => {
  const {
    children,
    currencyCode,
    walletName,

    // Icon currency:
    pluginId,
    tokenId,
    walletId,

    // Callbacks:
    onLongPress,
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity style={styles.container} onLongPress={onLongPress} onPress={onPress}>
      <CurrencyIcon currencyCode={currencyCode} marginRem={1} pluginId={pluginId} sizeRem={2} tokenId={tokenId} walletId={walletId} />
      <View style={styles.detailsContainer}>
        <View style={styles.detailsTop}>
          <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
          {props.exchangeRateText != null ? (
            <EdgeText style={[styles.exchangeRateStyle, styles[props.exchangeRateType ?? 'neutral']]}>{props.exchangeRateText}</EdgeText>
          ) : null}
        </View>
        <EdgeText style={styles.detailsName}>{walletName}</EdgeText>
      </View>
      <View style={styles.childrenContainer}>{children}</View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Background
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  // Data containers //
  // Details Container
  detailsContainer: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  // Children (Right part) Container
  childrenContainer: {
    paddingRight: theme.rem(1)
  },
  // Other styles
  detailsTop: {
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
