import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'

import compromisedIcon from '../../assets/images/compromisedIcon.png'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { WalletSyncCircle } from '../progress-indicators/WalletSyncCircle'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  // Main props - If non is specified, would just render an empty view
  pluginId?: string // Needed when walletId is not supplied and we still want to get an icon
  tokenId: EdgeTokenId // Needed when it's a token (not the plugin's native currency)
  walletId?: string // To allow showing the progress ratio sync circle

  // Image props
  hideSecondary?: boolean // Only show the currency icon for token (no secondary icon for the network)
  mono?: boolean // To use the mono dark icon logo

  // Styling props
  marginRem?: number | number[]
  sizeRem?: number
}

export const CryptoIcon = (props: Props) => {
  const { hideSecondary = false, marginRem, mono = false, sizeRem = 2, tokenId, walletId } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem)

  // Track wallets state from account and update the wallet when ready
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = walletId != null ? currencyWallets[walletId] : null

  const compromised = useSelector(state => {
    if (walletId == null) return 0
    const { modalShown = 0 } = state.ui?.settings?.securityCheckedWallets?.[walletId] ?? {}
    return modalShown > 0
  })

  const { pluginId = wallet?.currencyInfo.pluginId } = props
  const useChainIcon = pluginId == null ? false : SPECIAL_CURRENCY_INFO[pluginId]?.chainIcon ?? false

  // Primary Currency icon
  const primaryCurrencyIconUrl = React.useMemo(() => {
    if (pluginId == null) return null

    // Get Currency Icon URI
    const icon = getCurrencyIconUris(pluginId, tokenId, useChainIcon)
    return mono ? icon.symbolImageDarkMono : icon.symbolImage
  }, [pluginId, tokenId, mono, useChainIcon])

  const primaryCurrencyIcon = React.useMemo(() => {
    if (primaryCurrencyIconUrl == null) return null

    const source = { uri: primaryCurrencyIconUrl }

    // Return Currency logo from the edge server
    return source
  }, [primaryCurrencyIconUrl])

  // Secondary (parent) currency icon (if it's a token)
  const secondaryCurrencyIcon = React.useMemo(() => {
    if (compromised) {
      return compromisedIcon
    }

    // Skip if this is not a token:
    if (pluginId == null || (tokenId == null && !useChainIcon) || tokenId === pluginId) {
      return null
    }

    // Get Parent Icon URI
    const icon = getCurrencyIconUris(pluginId, null)
    const source = { uri: mono ? icon.symbolImageDarkMono : icon.symbolImage }

    return source
    // Return Parent logo from the edge server
  }, [compromised, mono, pluginId, tokenId, useChainIcon])

  // Main view styling
  const spacingStyle = React.useMemo(
    () => ({
      ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
      height: size,
      width: size
    }),
    [marginRem, size, theme]
  )

  const shadowStyle = React.useMemo(
    () => ({
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: theme.iconShadow.shadowColor,
      ...theme.iconShadow
    }),
    [size, theme]
  )

  return (
    <View style={spacingStyle}>
      {wallet == null ? null : (
        <WalletSyncCircle
          /* key prevents component from being recycled and shared between wallets */
          key={`${wallet.id}${String(tokenId)}`}
          size={size}
          wallet={wallet}
        />
      )}
      <ShadowedView style={shadowStyle}>
        {primaryCurrencyIcon != null ? <FastImage style={StyleSheet.absoluteFill} source={primaryCurrencyIcon} /> : null}
        {hideSecondary ? null : secondaryCurrencyIcon != null ? <FastImage style={styles.parentIcon} source={secondaryCurrencyIcon} /> : null}
      </ShadowedView>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  parentIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%'
  }
}))
