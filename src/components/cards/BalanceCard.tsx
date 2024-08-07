import { lt } from 'biggystring'
import * as React from 'react'
import { LayoutChangeEvent, Text, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getTotalFiatAmountFromExchangeRates, removeIsoPrefix, zeroString } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { AnimatedNumber } from '../common/AnimatedNumber'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { TransferModal } from '../modals/TransferModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

// Numbers larger than this are likely to overflow the display width so don't
// use regular Text components which can auto shrink
const MAX_ANIMATED_AMOUNT = '10000000'
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

  const activeWalletIds = useWatch(account, 'activeWalletIds')
  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')

  const exchangeRatesReady = React.useMemo(
    () =>
      activeWalletIds.every(walletId => {
        // Ignore wallets that have crashed:
        if (currencyWalletErrors[walletId]) return true

        // Both the wallet and its rate need to be loaded:
        const wallet = currencyWallets[walletId]
        return wallet != null && exchangeRates[`${wallet.currencyInfo.currencyCode}_${defaultIsoFiat}`] != null
      }),
    [activeWalletIds, currencyWalletErrors, currencyWallets, exchangeRates, defaultIsoFiat]
  )
  const [digitHeight, setDigitHeight] = React.useState(0)

  const fiatSymbol = defaultIsoFiat ? getFiatSymbol(defaultIsoFiat) : ''
  const fiatCurrencyCode = removeIsoPrefix(defaultIsoFiat)
  const formattedFiat = isBalanceVisible ? formatNumber(fiatAmount, { toFixed: 2 }) : lstrings.redacted_placeholder
  const handleToggleAccountBalanceVisibility = useHandler(() => {
    dispatch(toggleAccountBalanceVisibility())
  })

  const handleSend = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="send" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const handleDeposit = useHandler(() => {
    Airship.show(bridge => <TransferModal depositOrSend="deposit" bridge={bridge} account={account} navigation={navigation} />).catch(() => {})
  })

  const handleDigitLayout = useHandler((event: LayoutChangeEvent) => {
    setDigitHeight(event.nativeEvent.layout.height)
  })

  const balanceString = fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`
  const animateNumber = lt(fiatAmount, MAX_ANIMATED_AMOUNT)

  return (
    <EdgeCard>
      {/* For passing to the animated number. Do the measurement here to avoid flicker */}
      <Text style={[styles.balanceText, styles.measuredDigit]} onLayout={handleDigitLayout}>
        0
      </Text>
      <EdgeTouchableOpacity style={styles.balanceContainer} onPress={handleToggleAccountBalanceVisibility}>
        <View style={styles.titleContainer}>
          <EdgeText style={theme.cardTextShadow}>{lstrings.fragment_wallets_balance_text}</EdgeText>
          <IonIcon name={isBalanceVisible ? 'eye-off-outline' : 'eye-outline'} style={styles.eyeIcon} color={theme.iconTappable} size={theme.rem(1)} />
        </View>
        <View style={styles.balanceTextContainer}>
          {!exchangeRatesReady && zeroString(fiatAmount) ? (
            <EdgeText style={styles.balanceText}>{lstrings.loading}</EdgeText>
          ) : animateNumber ? (
            <AnimatedNumber digitHeight={digitHeight} numberString={balanceString} textStyle={styles.balanceText} />
          ) : (
            <EdgeText style={styles.balanceText}>{balanceString}</EdgeText>
          )}
        </View>
      </EdgeTouchableOpacity>
      {onViewAssetsPress == null ? null : (
        <EdgeTouchableOpacity style={styles.rightButtonContainer} onPress={onViewAssetsPress}>
          <EdgeText style={styles.tappableText}>{lstrings.view_assets}</EdgeText>
        </EdgeTouchableOpacity>
      )}

      <ButtonsView
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
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balanceContainer: {
    margin: theme.rem(0.5)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(0.5)
  },

  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    right: 0
  },
  tappableText: {
    fontSize: theme.rem(0.75),
    color: theme.iconTappable,
    margin: theme.rem(1),
    marginTop: theme.rem(1) + 3, // Fudge factor to align with the larger text on the left
    ...theme.cardTextShadow
  },

  eyeIcon: {
    alignSelf: 'center',
    marginLeft: theme.rem(0.25),
    marginRight: theme.rem(0),
    ...theme.cardTextShadow
  },
  balanceText: {
    fontSize: theme.rem(1.75),
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText,
    includeFontPadding: false,
    ...theme.cardTextShadow
  },
  balanceTextContainer: {
    height: theme.rem(2.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  showBalance: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  },
  measuredDigit: { position: 'absolute', top: -999999 }
}))
