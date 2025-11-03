import type { EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useIconColor } from '../../hooks/useIconColor'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { triggerHaptic } from '../../util/haptic'
import { isAssetNativeToChain } from '../../util/isAbstractedAssetChain'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { type CustomAsset, CustomAssetRow } from '../rows/CustomAssetRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { AssetChangeTextUi4 } from '../text/AssetChangeText'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeText } from './EdgeText'

interface Props {
  customAsset?: CustomAsset
  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet

  // Callbacks:
  onLongPress?: () => void
  onPress?: (
    walletId: string,
    tokenId: EdgeTokenId,
    customAsset?: CustomAsset
  ) => Promise<void> | void
}

const WalletListCurrencyRowComponent = (
  props: Props
): React.ReactElement | null => {
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
  // Shared consts (top):
  const userPausedWalletsSet = useSelector(
    state => state.ui.settings.userPausedWalletsSet
  )
  const isPaused = userPausedWalletsSet?.has(wallet.id) ?? false
  const isDisabled = isKeysOnlyPlugin(wallet.currencyInfo.pluginId)
  const { pluginId } = wallet.currencyInfo
  const iconColor = useIconColor({ pluginId, tokenId })
  const primaryColor = iconColor != null ? `${iconColor}30` : 'rgba(0, 0, 0, 0)'

  //
  // Handlers
  //
  const handlePress = useHandler(async () => {
    triggerHaptic('impactLight')
    if (onPress != null) await onPress(wallet.id, tokenId, customAsset)
  })

  const handleLongPress = useHandler(() => {
    triggerHaptic('impactLight')
    if (onLongPress != null) onLongPress()
  })

  // Normal path consts (hooks still top-level):
  const walletName: string = useWalletName(wallet)
  const compromised = useSelector(state => {
    const { modalShown = 0 } =
      state.ui?.settings?.securityCheckedWallets?.[wallet.id] ?? {}
    return modalShown > 0
  })
  const hideBalance = useSelector(
    state => !state.ui.settings.isAccountBalanceVisible
  )
  const nonCustomBalance = useWalletBalance(wallet, tokenId)

  if (customAsset != null) {
    return (
      // TODO: Update to UI4
      <EdgeTouchableOpacity
        accessible={false}
        style={styles.row}
        onLongPress={handleLongPress}
        onPress={handlePress}
      >
        <CustomAssetRow customAsset={customAsset} />
      </EdgeTouchableOpacity>
    )
  }

  // Non-custom (normal) asset
  const { currencyConfig, currencyInfo } = wallet
  const allTokens = currencyConfig.allTokens
  const tokenFromId = token ?? (tokenId == null ? null : allTokens[tokenId])
  const { currencyCode, denominations } = tokenFromId ?? currencyInfo
  const [denomination] = denominations

  // Wallet name and compromised flag:
  const nameNode: React.ReactNode = compromised ? (
    <>
      <UnscaledText style={{ color: theme.warningText }}>
        {lstrings.compromised_key_label + ' '}
      </UnscaledText>
      {walletName}
    </>
  ) : (
    walletName
  )

  // Balance:
  const balance = nonCustomBalance

  // Display texts:
  const tickerText = (
    <AssetChangeTextUi4
      wallet={wallet}
      tokenId={tokenId}
      style={styles.primaryText}
    />
  )
  const cryptoText = (
    <CryptoText
      wallet={wallet}
      tokenId={tokenId}
      nativeAmount={balance}
      withSymbol
      hideBalance={hideBalance}
    />
  )

  let displayCurrencyCode = currencyCode
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = tokenFromId.displayName
  }

  const iconNode = (
    <CryptoIcon
      sizeRem={2}
      tokenId={tokenId}
      pluginId={wallet.currencyInfo.pluginId}
      marginRem={[0, 0.75, 0, 0.25]}
    />
  )

  const firstRow = isAssetNativeToChain(currencyInfo, tokenId) ? (
    <View style={styles.rowContainer}>
      <EdgeText style={styles.titleLeftText}>{displayCurrencyCode}</EdgeText>
      <EdgeText style={styles.titleRightText}>{cryptoText}</EdgeText>
    </View>
  ) : (
    <View style={styles.rowContainer}>
      <EdgeText style={styles.titleLeftText}>{displayCurrencyCode}</EdgeText>
      <View style={styles.rowContainer}>
        <View style={styles.networkContainer}>
          <EdgeText style={styles.networkLabelText}>
            {wallet.currencyInfo.displayName}
          </EdgeText>
        </View>
        <EdgeText style={styles.titleRightText}>{cryptoText}</EdgeText>
      </View>
    </View>
  )

  return (
    <EdgeCard
      icon={iconNode}
      overlay={
        isPaused || isDisabled ? (
          <EdgeText style={styles.overlayLabel}>
            {isPaused
              ? lstrings.fragment_wallets_wallet_paused
              : lstrings.fragment_wallets_wallet_disabled}
          </EdgeText>
        ) : null
      }
      onLongPress={handleLongPress}
      onPress={handlePress}
      paddingRem={0.5}
      gradientBackground={{
        colors: [primaryColor, '#00000000'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 }
      }}
    >
      <View style={styles.textContentContainer}>
        {firstRow}
        <View style={styles.rowContainer}>
          <FiatText
            nativeCryptoAmount={denomination.multiplier}
            tokenId={tokenId}
            currencyConfig={wallet.currencyConfig}
            style={styles.primaryText}
          />
          <FiatText
            nativeCryptoAmount={balance}
            tokenId={tokenId}
            currencyConfig={wallet.currencyConfig}
            hideBalance={hideBalance}
            style={styles.secondaryText}
          />
        </View>
        <View style={styles.rowContainer}>
          {tickerText}
          <EdgeText style={styles.secondaryText}>{nameNode}</EdgeText>
        </View>
      </View>
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
  },
  textContentContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: theme.rem(0.5),
    paddingVertical: theme.rem(0.25)
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
    flexShrink: 10
  },
  networkLabelText: {
    fontSize: theme.rem(0.75),
    flexShrink: 1
  },
  primaryText: {
    fontSize: theme.rem(0.75),
    marginRight: theme.rem(0.25),
    flexGrow: 1
  },
  secondaryText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginLeft: theme.rem(0.5),
    flexShrink: 1
  },
  titleLeftText: {
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    marginRight: theme.rem(0.25)
  },
  titleRightText: {
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    marginLeft: theme.rem(0.25)
  },
  // Inlined IconDataRow styles for customAsset path
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.25),
    marginLeft: theme.rem(0.5)
  },
  rightColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column'
  },
  leftText: {
    fontFamily: theme.fontFaceMedium
  },
  leftSubtext: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  rightSubText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletListCurrencyRow = React.memo(WalletListCurrencyRowComponent)
