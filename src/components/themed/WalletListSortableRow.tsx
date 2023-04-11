import { div, gt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { FIAT_PRECISION, getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber, formatNumberInput } from '../../locales/intl'
import { getDisplayDenominationFromState, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { calculateFiatBalance } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, decimalOrZero, truncateDecimals } from '../../util/utils'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  wallet?: EdgeCurrencyWallet
  onDrag: () => void
}

function WalletListSortableRowComponent(props: Props) {
  const { wallet, onDrag } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const exchangeDenomination = useSelector(state =>
    wallet == null ? null : getExchangeDenomination(state, wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
  )

  if (wallet == null || exchangeDenomination == null) {
    return (
      <TouchableOpacity style={styles.container} activeOpacity={0.95} onLongPress={onDrag}>
        <View style={[styles.rowContainer, styles.loaderContainer]}>
          <ActivityIndicator color={theme.primaryText} size="small" />
        </View>
      </TouchableOpacity>
    )
  }

  const { currencyCode, pluginId } = wallet.currencyInfo
  const walletFiatSymbol = getSymbolFromCurrency(wallet.fiatCurrencyCode)
  const displayDenomination = dispatch(getDisplayDenominationFromState(pluginId, currencyCode))
  const multiplier = displayDenomination.multiplier
  const name = getWalletName(wallet)
  const symbol = displayDenomination.symbol

  const balance = wallet.balances[currencyCode] ?? '0'
  const preliminaryCryptoAmount = truncateDecimals(div(balance, multiplier, DECIMAL_PRECISION))
  const finalCryptoAmount = formatNumberInput(decimalOrZero(preliminaryCryptoAmount, 6)) // make it show zero if infinitesimal number
  const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
  const fiatBalance = calculateFiatBalance(wallet, exchangeDenomination, exchangeRates)
  const fiatBalanceFormat = fiatBalance && gt(fiatBalance, '0.000001') ? fiatBalance : 0
  const fiatBalanceSymbol = showBalance && walletFiatSymbol ? walletFiatSymbol : ''
  const fiatBalanceString = showBalance ? formatNumber(fiatBalanceFormat, { toFixed: FIAT_PRECISION }) : ''

  return (
    <TouchableOpacity style={styles.container} onLongPress={onDrag}>
      <View style={styles.rowContainer}>
        <View style={styles.iconContainer}>
          <Ionicon name="ios-menu" size={theme.rem(1.25)} color={theme.icon} />
        </View>
        <View style={styles.iconContainer}>
          <CryptoIcon pluginId={wallet.currencyInfo.pluginId} walletId={wallet.id} />
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <EdgeText style={styles.detailsCurrency}>{currencyCode}</EdgeText>
            <EdgeText style={styles.detailsValue}>{finalCryptoAmountString}</EdgeText>
          </View>
          <View style={styles.detailsRow}>
            <EdgeText style={styles.detailsName}>{name}</EdgeText>
            <EdgeText style={styles.detailsFiat}>{fiatBalanceSymbol + fiatBalanceString}</EdgeText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingHorizontal: theme.rem(1)
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(4.25),
    backgroundColor: theme.tileBackground
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(1.25),
    marginRight: theme.rem(1)
  },
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    resizeMode: 'contain'
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsCurrency: {
    flex: 1
  },
  detailsValue: {
    textAlign: 'right'
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detailsFiat: {
    fontSize: theme.rem(0.75),
    textAlign: 'right',
    color: theme.secondaryText
  },
  exchangeRate: {
    flex: 1,
    fontSize: theme.rem(0.75),
    textAlign: 'left'
  },
  percentage: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceMedium
  },
  divider: {
    height: theme.rem(1 / 16),
    borderColor: theme.lineDivider,
    borderBottomWidth: theme.rem(1 / 16),
    marginVertical: theme.rem(0.5)
  }
}))

export const WalletListSortableRow = React.memo(WalletListSortableRowComponent)
