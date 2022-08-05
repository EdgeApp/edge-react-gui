// @flow
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { memo, useMemo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { guessFromCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { WalletSyncCircle } from '../progress-indicators/WalletSyncCircle.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  // Main props - If non is specified, would just render an empty view
  walletId?: string, // To allow showing the progress ratio sync circle
  pluginId?: string, // Needed when walletId is not supplied and we still want to get an icon
  tokenId?: string, // Needed when it's a token (not the plugin's native currency)
  // Image props
  mono?: boolean, // To use the mono dark icon logo
  // Styling props
  sizeRem?: number,
  marginRem?: number | number[],
  // Deprecated!!! here for backward compatibility instead of pluginId or tokenId wherever it's not yet easily available
  currencyCode?: string,
  hideSecondary?: boolean // Only show the currency icon for token (no secondary icon for the network)
}

const CryptoIconComponent = (props: Props) => {
  let { pluginId, tokenId, hideSecondary } = props
  const { walletId, mono = false, sizeRem, marginRem, currencyCode } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem ?? 2)

  // Track wallets state from account and update the wallet when ready
  const account = useSelector(state => state.core.account)
  const wallet = walletId != null ? account.currencyWallets[walletId] : null
  // If we have a wallet, get the pluginId from it in case it's missing
  if (wallet != null && pluginId == null) pluginId = wallet.currencyInfo.pluginId

  // ---------------------------------------------------------------------
  // HACK to maintain Backward compatibility for now
  // ---------------------------------------------------------------------
  const ids = guessFromCurrencyCode(account, { currencyCode, pluginId, tokenId })
  pluginId = ids.pluginId
  tokenId = ids.tokenId
  // //////////////////////////////////////////////////////////////////////////////// //

  // Primary Currency icon
  const primaryCurrencyIcon = useMemo(() => {
    if (pluginId == null) return null
    // Get Currency Icon URI
    const icon = getCurrencyIconUris(pluginId, tokenId)
    const source = { uri: mono ? icon.symbolImageDarkMono : icon.symbolImage }
    // Return Currency logo from the edge server
    return <FastImage style={StyleSheet.absoluteFill} source={source} />
  }, [pluginId, tokenId, mono])

  // Secondary (parent) currency icon (if it's a token)
  const secondaryCurrencyIcon = useMemo(() => {
    // Return null if no plugin id or not a token
    if (pluginId == null || tokenId == null || tokenId === pluginId) return null
    // Get Parent Icon URI
    const icon = getCurrencyIconUris(pluginId)
    const source = { uri: mono ? icon.symbolImageDarkMono : icon.symbolImage }
    // Return Parent logo from the edge server
    return <FastImage style={styles.parentIcon} source={source} />
  }, [tokenId, pluginId, mono, styles.parentIcon])

  // Main view styling
  const spacingStyle = useMemo(
    () => ({
      ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
      height: size,
      width: size
    }),
    [marginRem, size, theme.rem]
  )

  return (
    <View style={spacingStyle}>
      {wallet != null ? <WalletSyncCircle size={size} wallet={wallet} /> : null}
      {primaryCurrencyIcon}
      {!hideSecondary ? secondaryCurrencyIcon : null}
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

export const CryptoIcon = memo(CryptoIconComponent)
