import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Text, View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { AssetChangeTextUi4 } from './AssetChangeTextUi4'
import { CryptoIconUi4 } from './CryptoIconUi4'
import { SplitRowView } from './SplitRowView'

interface Props {
  nativeAmount?: string
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

/**
 * A view representing the data from a wallet, used for rows, cards, etc.
 */
const CurrencyViewUi4Component = (props: Props) => {
  const { nativeAmount, showRate = false, token, tokenId, wallet } = props
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
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)
  const { denominations } = token != null ? token : currencyInfo
  const [denomination] = denominations

  const icon = <CryptoIconUi4 sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
  const tickerText = showRate && wallet != null ? <AssetChangeTextUi4 wallet={wallet} tokenId={tokenId} style={styles.primaryText} /> : null
  const cryptoText = showBalance ? <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={nativeAmount ?? balance} withSymbol /> : null
  const fiatBalanceText = showBalance ? <FiatText nativeCryptoAmount={nativeAmount ?? balance} tokenId={tokenId} wallet={wallet} /> : null
  const fiatRateText = <FiatText nativeCryptoAmount={denomination.multiplier} tokenId={tokenId} wallet={wallet} />

  let displayCurrencyCode = currencyCode
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = tokenFromId.displayName
  }

  const rows = [
    {
      left: (
        <EdgeText style={styles.titleText} numberOfLines={1}>
          {displayCurrencyCode}
        </EdgeText>
      ),
      right: (
        <EdgeText style={styles.titleText} numberOfLines={1}>
          {cryptoText}
        </EdgeText>
      )
    },
    {
      left: (
        <EdgeText style={styles.primaryText} numberOfLines={1}>
          {fiatRateText}
        </EdgeText>
      ),
      right: (
        <EdgeText style={styles.secondaryText} numberOfLines={1}>
          {fiatBalanceText}
        </EdgeText>
      )
    },
    {
      left: tickerText,
      right: (
        <EdgeText style={styles.secondaryText} numberOfLines={1}>
          {name}
        </EdgeText>
      )
    }
  ]
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.innerContainer}>
        <SplitRowView>{rows}</SplitRowView>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.25),
    flex: 1
  },
  iconContainer: {
    marginRight: theme.rem(1)
  },
  innerContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1
  },
  primaryText: {
    fontSize: theme.rem(0.75)
  },
  secondaryText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  titleText: {
    fontFamily: theme.fontFaceMedium
  }
}))

export const CurrencyViewUi4 = React.memo(CurrencyViewUi4Component)
