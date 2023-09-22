import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { triggerHaptic } from '../../util/haptic'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { SceneHeader } from './SceneHeader'

interface StateProps {
  showBalance: boolean
  fiatAmount: number
  defaultIsoFiat: string
  exchangeRates: GuiExchangeRates
}

interface DispatchProps {
  toggleAccountBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps & ThemeProps

export class BalanceBox extends React.PureComponent<Props> {
  handleToggleAccountBalanceVisibility = () => {
    triggerHaptic('impactLight')
    this.props.toggleAccountBalanceVisibility()
  }

  render() {
    const { defaultIsoFiat, fiatAmount, showBalance, exchangeRates, theme } = this.props
    const fiatSymbol = defaultIsoFiat ? getSymbolFromCurrency(defaultIsoFiat) : ''
    const fiatCurrencyCode = defaultIsoFiat.replace('iso:', '')
    const formattedFiat = formatNumber(fiatAmount, { toFixed: 2 })
    const styles = getStyles(theme)

    // if there is no exchangeRates object, empty object, or object with zero values

    const summation = (total: number, rate: number) => {
      if (isNaN(rate)) rate = 0
      return total + rate
    }
    // @ts-expect-error
    const noExchangeRates = !Object.keys(exchangeRates).length || !Object.values(exchangeRates).reduce(summation)

    return (
      <SceneHeader underline>
        <TouchableOpacity onPress={this.handleToggleAccountBalanceVisibility} style={styles.balanceBoxContainer}>
          {showBalance && !noExchangeRates ? (
            <>
              <EdgeText style={styles.balanceHeader}>{lstrings.fragment_wallets_balance_text}</EdgeText>
              <EdgeText style={styles.balanceBody}>
                {fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`}
              </EdgeText>
            </>
          ) : (
            <EdgeText style={styles.showBalance}>{noExchangeRates ? lstrings.exchange_rates_loading : lstrings.string_show_balance}</EdgeText>
          )}
        </TouchableOpacity>
      </SceneHeader>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  balanceBoxContainer: {
    height: theme.rem(3.25),
    marginTop: theme.rem(0.5)
  },
  balanceHeader: {
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  balanceBody: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  },
  showBalance: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  }
}))

export const WiredBalanceBox = connect<StateProps, DispatchProps, {}>(
  state => {
    const { defaultIsoFiat } = state.ui.settings
    return {
      showBalance: state.ui.settings.isAccountBalanceVisible,
      fiatAmount: getTotalFiatAmountFromExchangeRates(state, defaultIsoFiat),
      defaultIsoFiat,
      exchangeRates: state.exchangeRates
    }
  },
  dispatch => ({
    toggleAccountBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    }
  })
)(withTheme(BalanceBox))
