import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { triggerHaptic } from '../../util/haptic'
import { CurrencyRow } from '../data/row/CurrencyRow'
import { CustomAsset, CustomAssetRow } from '../data/row/CustomAssetRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  customAsset?: CustomAsset
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet

  // Callbacks:
  onLongPress?: () => void
  onPress?: (walletId: string, currencyCode: string, tokenId?: string, customAsset?: CustomAsset) => void
}

const WalletListCurrencyRowComponent = (props: Props) => {
  const {
    customAsset,
    showRate = false,
    token,
    tokenId,
    wallet,

    // Callbacks:
    onLongPress,
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const pausedWallets = useSelector(state => state.ui.settings.userPausedWalletsSet)
  const isPaused = (pausedWallets != null && pausedWallets.has(wallet.id)) || isKeysOnlyPlugin(wallet.currencyInfo.pluginId)

  // Currency code and wallet name for display:
  const currencyCode = customAsset?.currencyCode ?? token?.currencyCode ?? wallet.currencyInfo.currencyCode

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    if (onPress != null) onPress(wallet.id, currencyCode, tokenId, customAsset)
  })

  const handleLongPress = useHandler(() => {
    triggerHaptic('impactLight')
    if (onLongPress != null) onLongPress()
  })

  return (
    <TouchableOpacity accessible={false} style={styles.row} onLongPress={handleLongPress} onPress={handlePress}>
      {customAsset != null ? (
        <CustomAssetRow customAsset={customAsset} />
      ) : (
        <CurrencyRow showRate={showRate && !isPaused} token={token} tokenId={tokenId} wallet={wallet} />
      )}
      {isPaused ? (
        <View style={styles.overlayContainer}>
          <EdgeText style={styles.overlayLabel}>{lstrings.fragment_wallets_wallet_paused}</EdgeText>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  overlayLabel: {
    color: theme.overlayDisabledTextColor
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: theme.overlayDisabledColor,
    justifyContent: 'center'
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  }
}))

export const WalletListCurrencyRow = React.memo(WalletListCurrencyRowComponent)
