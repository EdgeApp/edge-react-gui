// @flow
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { useWalletName } from '../../hooks/useWalletName.js'
import { useWatchAccount, useWatchWallet } from '../../hooks/useWatch'
import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { memo, useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText.js'
import { TickerText } from '../text/TickerText.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'

type Props = {|
  showRate?: boolean,
  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet,

  // Callbacks:
  onLongPress?: () => void,
  onPress?: (walletId: string, currencyCode: string) => void
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
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Crypto & Fiat Texts
  const name = useWalletName(wallet)
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)

  const balances = useWatchWallet(wallet, 'balances')
  const fiatCurrencyCode = useWatchWallet(wallet, 'fiatCurrencyCode')
  const account = useSelector(state => state.core.account)
  const currencyConfigMap = useWatchAccount(account, 'currencyConfig')

  const { currencyInfo } = wallet
  const { currencyCode } = token == null ? wallet.currencyInfo : token
  const balance = balances[currencyCode] ?? '0'
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, currencyCode))
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const cryptoExchangeMultiplier = exchangeDenomination.multiplier

  const handlePress = useMemo(() => (onPress != null ? () => onPress(wallet.id, currencyCode) : () => {}), [currencyCode, onPress, wallet])

  return (
    <TouchableOpacity style={styles.row} onLongPress={onLongPress} onPress={handlePress}>
      <CurrencyIcon marginRem={1} sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
      <View style={styles.nameColumn}>
        <View style={styles.currencyRow}>
          <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
          {showRate && wallet != null ? (
            <EdgeText style={styles.exchangeRateText}>
              <TickerText currencyConfigMap={currencyConfigMap} wallet={wallet} tokenId={tokenId} />
            </EdgeText>
          ) : null}
        </View>
        <EdgeText style={styles.nameText}>{name}</EdgeText>
      </View>
      {showBalance ? (
        <View style={styles.balanceColumn}>
          <EdgeText>
            <CryptoText currencyConfigMap={currencyConfigMap} wallet={wallet} tokenId={tokenId} nativeAmount={balance} />
          </EdgeText>
          <EdgeText style={styles.fiatBalanceText}>
            <FiatText
              wallet={wallet}
              nativeCryptoAmount={balance}
              currencyCode={currencyCode}
              isoFiatCurrencyCode={isoFiatCurrencyCode}
              cryptoExchangeMultiplier={cryptoExchangeMultiplier}
            />
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
  },

  // Difference Percentage Styles
  neutral: {
    color: theme.secondaryText
  },
  positive: {
    color: theme.positiveText
  },
  negative: {
    color: theme.negativeText
  }
}))

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
