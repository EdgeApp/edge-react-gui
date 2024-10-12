import { EdgeWalletInfoFull } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { toLocaleTime } from '../../locales/intl'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { findCurrencyInfo } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  walletInfo: EdgeWalletInfoFull
  onPress: (isSelected: boolean) => void
}

/**
 * A Card representing an archived wallet
 */
export const WalletRestoreCard = (props: Props) => {
  const { walletInfo, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const { currencyCode, displayName, pluginId } = findCurrencyInfo(account, walletInfo.type) ?? {}
  const currencyConfig = pluginId == null ? undefined : account.currencyConfig[pluginId]

  const [isSelected, setIsSelected] = React.useState(false)

  const dateLabel = walletInfo.created == null ? '' : toLocaleTime(walletInfo.created)

  // Primary Currency icon
  const primaryCurrencyIconUrl = React.useMemo(() => {
    if (pluginId == null) return null

    // Get Currency Icon URI
    const icon = getCurrencyIconUris(pluginId, null, SPECIAL_CURRENCY_INFO[pluginId]?.chainIcon ?? false)
    return icon.symbolImageDarkMono
  }, [pluginId])

  const primaryCurrencyIcon = React.useMemo(() => {
    if (primaryCurrencyIconUrl == null) return null

    const source = { uri: primaryCurrencyIconUrl }

    // Return Currency logo from the edge server
    return source
  }, [primaryCurrencyIconUrl])

  const shadowStyle = React.useMemo(
    () => ({
      height: theme.rem(2),
      width: theme.rem(2),
      borderRadius: theme.rem(2) / 2,
      backgroundColor: theme.iconShadow.shadowColor,
      ...theme.iconShadow
    }),
    [theme]
  )

  const handlePress = useHandler(() => {
    onPress(!isSelected)
    setIsSelected(!isSelected)
  })

  // Show the network label if it's a token or an ETH mainnet currency code on
  // non-ethereum networks (i.e. Optimism)
  const firstRow =
    currencyCode !== 'ETH' || pluginId === 'ethereum' ? (
      <EdgeText style={styles.titleLeftText}>{currencyCode}</EdgeText>
    ) : (
      <View style={styles.rowContainer}>
        <EdgeText style={styles.titleLeftText}>{currencyCode}</EdgeText>
        <View style={styles.rowContainer}>
          <View style={styles.networkContainer}>
            <EdgeText style={styles.networkLabelText}>{displayName}</EdgeText>
          </View>
        </View>
      </View>
    )

  return currencyConfig == null ? null : (
    <EdgeCard onPress={handlePress}>
      <View style={styles.outerContainer}>
        <View style={styles.iconContainer}>
          <ShadowedView style={shadowStyle}>
            {primaryCurrencyIcon == null ? null : <FastImage style={StyleSheet.absoluteFill} source={primaryCurrencyIcon} />}
          </ShadowedView>
        </View>
        <View style={styles.textContainer}>
          {firstRow}
          <EdgeText style={styles.secondaryText}>{displayName}</EdgeText>
          <EdgeText style={styles.secondaryText}>{dateLabel}</EdgeText>
        </View>
        <Switch
          ios_backgroundColor={theme.toggleButtonOff}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
          value={isSelected}
          onValueChange={handlePress}
        />
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.25),
    flexGrow: 1,
    flexShrink: 1
  },
  iconContainer: {
    marginRight: theme.rem(1)
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexShrink: 1
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexShrink: 1
  },
  networkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.rem(1),
    paddingHorizontal: theme.rem(0.5),
    marginHorizontal: theme.rem(0.25),
    height: theme.rem(1),
    backgroundColor: theme.cardBaseColor,
    flexShrink: 1
  },

  networkLabelText: {
    fontSize: theme.rem(0.75),
    flexShrink: 1
  },
  secondaryText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    flexShrink: 1
  },
  titleLeftText: {
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    marginRight: theme.rem(0.25)
  }
}))
