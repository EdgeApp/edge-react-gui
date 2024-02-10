import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils'
import { AnimatedNumber } from '../common/AnimatedNumber'
import { TransferModal } from '../modals/TransferModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from './ButtonsViewUi4'
import { CardUi4 } from './CardUi4'

// Numbers larger than this are likely to overflow the display width so don't
// use regular Text components which can auto shrink
const MAX_ANIMATED_AMOUNT = 10000000
interface Props {
  navigation: NavigationBase
  onViewAssetsPress?: () => void
}

/**
 * Card that displays balance, deposit/send buttons, and a link to view assets
 */
export const BalanceCardUi4 = (props: Props) => {
  const { navigation, onViewAssetsPress } = props

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
  const formattedFiat = isBalanceVisible ? formatNumber(fiatAmount, { toFixed: 2 }) : lstrings.redacted_placeholder

  const exchangeRatesReady = exchangeRates != null && Object.keys(exchangeRates).length > 0

  const handleToggleAccountBalanceVisibility = useHandler(() => {
    dispatch(toggleAccountBalanceVisibility())
  })

  const handleSend = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="send" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const handleDeposit = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="deposit" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const balanceString = fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`
  const animateNumber = fiatAmount < MAX_ANIMATED_AMOUNT

  return (
    <CardUi4>
      <TouchableOpacity style={styles.balanceContainer} onPress={handleToggleAccountBalanceVisibility}>
        <View style={styles.titleContainer}>
          <EdgeText style={theme.cardTextShadow}>{lstrings.fragment_wallets_balance_text}</EdgeText>
          <IonIcon name={isBalanceVisible ? 'eye-off-outline' : 'eye-outline'} style={styles.eyeIcon} color={theme.iconTappable} size={theme.rem(1)} />
        </View>
        {!exchangeRatesReady ? (
          <View style={styles.balanceTextContainer}>
            <EdgeText style={styles.ratesLoading}>{lstrings.exchange_rates_loading}</EdgeText>
          </View>
        ) : animateNumber ? (
          <View style={styles.balanceTextContainer}>
            <AnimatedNumber numberString={balanceString} style={styles.balanceTextContainer} textStyle={styles.balanceText} />
          </View>
        ) : (
          <View style={styles.balanceTextContainer}>
            <EdgeText style={styles.balanceTextNoAnim}>{balanceString}</EdgeText>
          </View>
        )}
      </TouchableOpacity>
      {onViewAssetsPress == null ? null : (
        <TouchableOpacity style={styles.rightButtonContainer} onPress={onViewAssetsPress}>
          <EdgeText style={styles.tappableText}>{lstrings.view_assets}</EdgeText>
        </TouchableOpacity>
      )}

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

const getStyles = cacheStyles((theme: Theme) => {
  const balanceTextContainer = {
    marginTop: theme.rem(0.25),
    marginBottom: theme.rem(0.5),
    height: theme.rem(2.25)
  }

  const balanceText = {
    fontSize: theme.rem(1.75),
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText,
    includeFontPadding: false,
    ...theme.cardTextShadow
  }

  return {
    balanceContainer: {
      margin: theme.rem(0.5)
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center'
    },

    rightButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: theme.rem(1) + 5, // Fudge factor to align with the larger text on the left
      right: theme.rem(1)
    },
    tappableText: {
      fontSize: theme.rem(0.75),
      color: theme.iconTappable,
      ...theme.cardTextShadow
    },

    // These two icons have different bounding boxes. Adjusted to match
    eyeIcon: {
      alignSelf: 'center',
      marginLeft: theme.rem(0.25),
      marginRight: theme.rem(0),
      ...theme.cardTextShadow
    },
    balanceText,
    balanceTextContainer,
    balanceTextNoAnim: {
      ...balanceTextContainer,
      ...balanceText
    },
    balanceBoxContainer: {
      height: theme.rem(3.25),
      marginTop: theme.rem(0.5)
    },
    balanceHeader: {
      fontSize: theme.rem(1),
      color: theme.secondaryText
    },
    ratesLoading: { ...balanceTextContainer, ...theme.cardTextShadow },
    showBalance: {
      fontSize: theme.rem(1.5),
      fontFamily: theme.fontFaceMedium
    }
  }
})
