import { EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Text, View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { AssetChangeTextUi4 } from '../text/AssetChangeText'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  nativeAmount?: string
  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

/**
 * A view representing the data from a wallet, used for rows, cards, etc.
 */
export const CurrencyView = (props: Props) => {
  const { nativeAmount, token, tokenId, wallet } = props
  const { currencyConfig, currencyInfo } = wallet
  const { pluginId } = currencyInfo
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  const theme = useTheme()
  const styles = getStyles(theme)

  // Currency code for display:
  const { allTokens } = currencyConfig
  const tokenFromId = token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const { currencyCode } = tokenFromId == null ? currencyInfo : tokenFromId

  // Wallet name for display:
  let name: React.ReactNode = useWalletName(wallet)
  const compromised = useSelector(state => {
    const { modalShown = 0 } = state.ui?.settings?.securityCheckedWallets?.[wallet.id] ?? {}
    return modalShown > 0
  })
  if (compromised) {
    name = (
      <>
        <Text style={{ color: theme.warningText }}>{lstrings.compromised_key_label}</Text> {name}
      </>
    )
  }

  // Balance stuff:
  const hideBalance = useSelector(state => !state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)
  const { denominations } = token != null ? token : currencyInfo
  const [denomination] = denominations

  const icon = <CryptoIcon sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
  const tickerText = wallet != null ? <AssetChangeTextUi4 wallet={wallet} tokenId={tokenId} style={styles.primaryText} /> : null
  const cryptoText = <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={nativeAmount ?? balance} withSymbol hideBalance={hideBalance} />
  const fiatBalanceText = <FiatText nativeCryptoAmount={nativeAmount ?? balance} tokenId={tokenId} wallet={wallet} hideBalance={hideBalance} />
  const fiatRateText = <FiatText nativeCryptoAmount={denomination.multiplier} tokenId={tokenId} wallet={wallet} />

  let displayCurrencyCode = currencyCode
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = tokenFromId.displayName
  }

  // Show the network label if it's a token or an ETH mainnet currency code on
  // non-ethereum networks (i.e. Optimism)
  const firstRow =
    tokenFromId == null && (currencyCode !== 'ETH' || currencyInfo.pluginId === 'ethereum') ? (
      <View style={styles.rowContainer}>
        <EdgeText style={styles.titleLeftText}>{displayCurrencyCode}</EdgeText>
        <EdgeText style={styles.titleRightText}>{cryptoText}</EdgeText>
      </View>
    ) : (
      <View style={styles.rowContainer}>
        <EdgeText style={styles.titleLeftText}>{displayCurrencyCode}</EdgeText>
        <View style={styles.rowContainer}>
          <View style={styles.networkContainer}>
            <EdgeText style={styles.networkLabelText}>{wallet.currencyInfo.displayName}</EdgeText>
          </View>
          <EdgeText style={styles.titleRightText}>{cryptoText}</EdgeText>
        </View>
      </View>
    )

  return (
    <View style={styles.outerContainer}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContentContainer}>
        {firstRow}
        <View style={styles.rowContainer}>
          <EdgeText style={styles.primaryText}>{fiatRateText}</EdgeText>
          <EdgeText style={styles.secondaryText}>{fiatBalanceText}</EdgeText>
        </View>
        <View style={styles.rowContainer}>
          {tickerText}
          <EdgeText style={styles.secondaryText}>{name}</EdgeText>
        </View>
      </View>
    </View>
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
  textContentContainer: {
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
  }
}))
