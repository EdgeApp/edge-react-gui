import { div, gt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useReorderableDrag } from 'react-native-reorderable-list'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { FIAT_PRECISION, getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber, formatNumberInput } from '../../locales/intl'
import { getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { calculateFiatBalance } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, decimalOrZero, truncateDecimals } from '../../util/utils'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  wallet?: EdgeCurrencyWallet
}

function WalletListSortableRowComponent(props: Props) {
  const { wallet } = props

  const handleDrag = useReorderableDrag()

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const exchangeDenomination = wallet == null ? null : getExchangeDenom(wallet.currencyConfig, null)

  if (wallet == null || exchangeDenomination == null) {
    return (
      <EdgeTouchableOpacity style={styles.container} activeOpacity={0.95}>
        <View style={[styles.rowContainer, styles.loaderContainer]}>
          <ActivityIndicator color={theme.primaryText} size="small" />
        </View>
      </EdgeTouchableOpacity>
    )
  }

  const { currencyCode } = wallet.currencyInfo
  const fiatSymbol = getFiatSymbol(defaultIsoFiat)
  const displayDenomination = dispatch((_, getState) => selectDisplayDenom(getState(), wallet.currencyConfig, null))
  const multiplier = displayDenomination.multiplier
  const name = getWalletName(wallet)
  const symbol = displayDenomination.symbol
  const tokenId = getWalletTokenId(wallet, currencyCode)

  const balance = wallet.balanceMap.get(tokenId) ?? '0'
  const preliminaryCryptoAmount = truncateDecimals(div(balance, multiplier, DECIMAL_PRECISION))
  const finalCryptoAmount = formatNumberInput(decimalOrZero(preliminaryCryptoAmount, 6)) // make it show zero if infinitesimal number
  const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
  const fiatBalance = calculateFiatBalance(wallet, defaultIsoFiat, exchangeDenomination, exchangeRates)
  const fiatBalanceFormat = fiatBalance && gt(fiatBalance, '0.000001') ? fiatBalance : 0
  const fiatBalanceSymbol = showBalance && fiatSymbol ? fiatSymbol : ''
  const fiatBalanceString = showBalance ? formatNumber(fiatBalanceFormat, { toFixed: FIAT_PRECISION }) : ''

  return (
    <View style={[styles.container, styles.rowContainer]}>
      <EdgeTouchableOpacity delayLongPress={1} style={styles.handleContainer} onLongPress={handleDrag}>
        <View style={styles.iconContainer}>
          <Ionicon name="menu" size={theme.rem(1.25)} color={theme.icon} />
        </View>
      </EdgeTouchableOpacity>
      <View style={styles.iconContainer}>
        <CryptoIcon pluginId={wallet.currencyInfo.pluginId} walletId={wallet.id} tokenId={null} />
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
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingHorizontal: theme.rem(1)
  },
  handleContainer: {
    margin: -theme.rem(0.5),
    padding: theme.rem(0.5)
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
