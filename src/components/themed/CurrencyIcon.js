// @flow
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { memo, useMemo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon, getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { WalletSyncCircle } from './WalletSyncCircle.js'

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
  currencyCode?: string
}

/**
 * If we have a currency code, guess the pluginId and tokenId from that.
 */
const guessFromCurrencyCode = (account: EdgeAccount, { currencyCode, pluginId, tokenId }: { [key: string]: string | void }) => {
  if (currencyCode == null) return { pluginId, tokenId }
  // If you already have a main network code but not a tokenId, check if you are a token and get the right tokenId
  if (pluginId != null && tokenId == null) {
    tokenId = getTokenId(account, pluginId, currencyCode)
  }
  // If we don't have a pluginId, try to get one for a main network first
  if (pluginId == null) {
    pluginId = Object.keys(account.currencyConfig).find(id => account.currencyConfig[id].currencyInfo.currencyCode === currencyCode)
  }
  // If we still don't have a pluginId, try to get a pluginId and tokenId for a token
  if (pluginId == null) {
    pluginId = Object.keys(account.currencyConfig).find(id => {
      tokenId = getTokenId(account, id, currencyCode)
      return tokenId != null
    })
  }
  return { pluginId, tokenId }
}

export const CurrencyIconComponent = (props: Props) => {
  let { pluginId, tokenId } = props
  const { walletId, mono = false, sizeRem, marginRem, currencyCode } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const size = theme.rem(sizeRem ?? 2)

  // Track wallets state from account and update the wallet when ready
  const account = useSelector(state => state.core.account)
  const edgeWallet = walletId != null ? account.currencyWallets[walletId] : null
  // If we have a wallet, get the pluginId from it in case it's missing
  if (edgeWallet != null && pluginId == null) pluginId = edgeWallet.currencyInfo.pluginId

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
    const icon = getCurrencyIcon(pluginId, tokenId)
    const source = { uri: mono ? icon.symbolImageDarkMono : icon.symbolImage }
    // Return Currency logo from the edge server
    return <FastImage style={StyleSheet.absoluteFill} source={source} />
  }, [pluginId, tokenId, mono])

  // Secondary (parent) currency icon (if it's a token)
  const secondaryCurrencyIcon = useMemo(() => {
    // Return null if no plugin id or not a token
    if (pluginId == null || tokenId == null || tokenId === pluginId) return null
    // Get Parent Icon URI
    const icon = getCurrencyIcon(pluginId)
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
      {edgeWallet != null ? <WalletSyncCircle size={size} edgeWallet={edgeWallet} /> : null}
      {primaryCurrencyIcon}
      {secondaryCurrencyIcon}
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

export const CurrencyIcon = memo(CurrencyIconComponent)
