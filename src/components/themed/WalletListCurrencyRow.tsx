import { EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { triggerHaptic } from '../../util/haptic'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CurrencyView } from '../layout/CurrencyView'
import { CustomAsset, CustomAssetRow } from '../rows/CustomAssetRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  customAsset?: CustomAsset
  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet

  // Callbacks:
  onLongPress?: () => void
  onPress?: (walletId: string, tokenId: EdgeTokenId, customAsset?: CustomAsset) => void
}

const WalletListCurrencyRowComponent = (props: Props) => {
  const {
    customAsset,
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
  const isPaused = pausedWallets != null && pausedWallets.has(wallet.id)
  const isDisabled = isKeysOnlyPlugin(wallet.currencyInfo.pluginId)
  const { pluginId } = wallet.currencyInfo

  //
  // State
  //
  const iconColor = useIconColor({ pluginId, tokenId })
  const primaryColor = iconColor != null ? `${iconColor}30` : 'rgba(0, 0, 0, 0)'

  //
  // Handlers
  //
  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    if (onPress != null) onPress(wallet.id, tokenId, customAsset)
  })

  const handleLongPress = useHandler(() => {
    triggerHaptic('impactLight')
    if (onLongPress != null) onLongPress()
  })

  return customAsset != null ? (
    // TODO: Update to UI4
    <EdgeTouchableOpacity accessible={false} style={styles.row} onLongPress={handleLongPress} onPress={handlePress}>
      <CustomAssetRow customAsset={customAsset} />
    </EdgeTouchableOpacity>
  ) : (
    <EdgeCard
      overlay={
        isPaused || isDisabled ? (
          <EdgeText style={styles.overlayLabel}>{isPaused ? lstrings.fragment_wallets_wallet_paused : lstrings.fragment_wallets_wallet_disabled}</EdgeText>
        ) : null
      }
      onLongPress={handleLongPress}
      onPress={handlePress}
      gradientBackground={{ colors: [primaryColor, '#00000000'], start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }}
    >
      <CurrencyView token={token} tokenId={tokenId} wallet={wallet} />
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  overlayLabel: {
    color: theme.overlayDisabledTextColor
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  }
}))

export const WalletListCurrencyRow = React.memo(WalletListCurrencyRowComponent)
