// @flow
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler.js'
import { useWalletBalance } from '../../hooks/useWalletBalance.js'
import { useWalletName } from '../../hooks/useWalletName.js'
import { memo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText.js'
import { TickerText } from '../text/TickerText.js'
import { EdgeText } from './EdgeText.js'

type Props = {|
  showRate?: boolean,
  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: (walletId: string, currencyCode: string, tokenId?: string) => void
|}

export const WalletListCurrencyRowComponent = (props: Props) => {
  const {
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

  // Currency code and wallet name for display:
  const { currencyCode } = token == null ? wallet.currencyInfo : token
  const name = useWalletName(wallet)

  // Balance stuff:
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)

  const handlePress = useHandler(() => {
    if (onPress != null) onPress(wallet.id, currencyCode, tokenId)
  })

  return (
    <TouchableOpacity style={styles.row} onLongPress={onLongPress} onPress={handlePress}>
      <CryptoIcon marginRem={1} sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
      <View style={styles.nameColumn}>
        <View style={styles.currencyRow}>
          <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
          {showRate && wallet != null ? (
            <EdgeText style={styles.exchangeRateText}>
              <TickerText wallet={wallet} tokenId={tokenId} />
            </EdgeText>
          ) : null}
        </View>
        <EdgeText style={styles.nameText}>{name}</EdgeText>
      </View>
      {showBalance ? (
        <View style={styles.balanceColumn}>
          <EdgeText>
            <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={balance} />
          </EdgeText>
          <EdgeText style={styles.fiatBalanceText}>
            <FiatText nativeCryptoAmount={balance} tokenId={tokenId} wallet={wallet} />
          </EdgeText>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  balanceColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  fiatBalanceText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  exchangeRateText: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
