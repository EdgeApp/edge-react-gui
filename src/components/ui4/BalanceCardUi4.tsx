import * as React from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils'
import { TransferModal } from '../modals/TransferModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from './ButtonsViewUi4'
import { CardUi4 } from './CardUi4'

interface Props {
  navigation: NavigationBase
}

/**
 * Card that displays balance, deposit/send buttons, and a link to view assets
 */
export const BalanceCardUi4 = (props: Props) => {
  const { navigation } = props

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const isBalanceVisible = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const fiatAmount = useSelector(state => getTotalFiatAmountFromExchangeRates(state, defaultIsoFiat))
  const exchangeRates = useSelector(state => state.exchangeRates)

  const fiatSymbol = defaultIsoFiat ? getSymbolFromCurrency(defaultIsoFiat) : ''
  const fiatCurrencyCode = defaultIsoFiat.replace('iso:', '')
  const formattedFiat = isBalanceVisible ? formatNumber(fiatAmount, { toFixed: 2 }) : '****'

  const textShadow = Platform.OS === 'ios' ? theme.shadowTextIosUi4 : theme.shadowTextAndroidUi4

  const exchangeRatesReady = exchangeRates != null && Object.keys(exchangeRates).length > 0

  const handleToggleAccountBalanceVisibility = useHandler(() => {
    dispatch(toggleAccountBalanceVisibility())
  })

  const handleViewAssets = useHandler(() => {
    navigation.navigate('walletList', {})
  })

  const handleSend = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="send" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const handleDeposit = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="deposit" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  return (
    <CardUi4>
      <TouchableOpacity style={styles.balanceContainer} onPress={handleToggleAccountBalanceVisibility}>
        <View style={styles.titleContainer}>
          <View style={styles.titleSubContainer}>
            <EdgeText style={textShadow}>{lstrings.fragment_wallets_balance_text}</EdgeText>
            <IonIcon
              name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'}
              style={[styles.eyeIcon, textShadow]}
              color={theme.iconTappable}
              size={theme.rem(1)}
            />
          </View>
        </View>
        {!exchangeRatesReady ? (
          <EdgeText style={textShadow}>{lstrings.exchange_rates_loading}</EdgeText>
        ) : (
          <EdgeText style={[styles.balanceText, textShadow]}>
            {fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`}
          </EdgeText>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.chevronContainer} onPress={handleViewAssets}>
        <EdgeText style={[styles.tappableText, textShadow]}>{lstrings.view_assets}</EdgeText>
        <IonIcon size={theme.rem(1.25)} style={[styles.chevronIcon, textShadow]} color={theme.iconTappable} name="chevron-forward-outline" />
      </TouchableOpacity>

      <ButtonsViewUi4
        layout="row"
        secondary={{
          onPress: handleDeposit,
          label: lstrings.loan_fragment_deposit
        }}
        secondary2={{
          onPress: handleSend,
          label: lstrings.fragment_send_subtitle
        }}
      />
    </CardUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balanceContainer: {
    margin: theme.rem(0.5)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleSubContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  chevronContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: theme.rem(1) - 2, // Adjust for chevron's bounding box and left title
    right: theme.rem(1)
  },
  tappableText: {
    fontSize: theme.rem(0.75)
  },

  // These two icons have different bounding boxes. Adjusted to match
  eyeIcon: {
    alignSelf: 'center',
    marginLeft: theme.rem(0.25),
    marginRight: theme.rem(0)
  },
  chevronIcon: {
    alignSelf: 'center',
    marginTop: 2,
    marginRight: -5
  },

  balanceText: {
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1),
    fontSize: theme.rem(1.75),
    fontFamily: theme.fontFaceMedium
  },

  balanceBoxContainer: {
    height: theme.rem(3.25),
    marginTop: theme.rem(0.5)
  },
  balanceHeader: {
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  showBalance: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  }
}))
