// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { Ticker } from 'react-native-ticker'

import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiExchangeRates } from '../../types/types.js'
import { getFiatSymbol, getTotalFiatAmountFromExchangeRates } from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { SceneHeader } from './SceneHeader.js'

type StateProps = {
  showBalance: boolean,
  fiatAmount: number,
  defaultIsoFiat: string,
  exchangeRates: GuiExchangeRates
}

type DispatchProps = {
  toggleAccountBalanceVisibility: () => void
}

type Props = StateProps & DispatchProps & ThemeProps

class BalanceBox extends React.PureComponent<Props> {
  render() {
    const { defaultIsoFiat, fiatAmount, showBalance, exchangeRates, theme } = this.props
    const fiatSymbol = defaultIsoFiat ? getFiatSymbol(defaultIsoFiat) : ''
    const fiatCurrencyCode = defaultIsoFiat.replace('iso:', '')
    const formattedFiat = formatNumber(fiatAmount, { toFixed: 2 })
    const styles = getStyles(theme)

    // if there is no exchangeRates object, empty object, or object with zero values
    // $FlowFixMe it appears that Object.values may break flow
    const summation = (total: number, rate: number) => {
      if (isNaN(rate)) rate = 0
      return total + rate
    }
    const noExchangeRates = !Object.keys(exchangeRates).length || !Object.values(exchangeRates).reduce(summation)

    return (
      <SceneHeader underline>
        <TouchableOpacity onPress={this.props.toggleAccountBalanceVisibility} style={styles.balanceBoxContainer}>
          {showBalance && !noExchangeRates ? (
            <>
              <EdgeText style={styles.balanceHeader}>{s.strings.fragment_wallets_balance_text}</EdgeText>
              <Ticker textStyle={[styles.balanceHeader, styles.balanceTicker]} duration={500}>
                {fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`}
              </Ticker>
            </>
          ) : (
            <EdgeText style={styles.showBalance}>{noExchangeRates ? s.strings.exchange_rates_loading : s.strings.string_show_balance}</EdgeText>
          )}
        </TouchableOpacity>
      </SceneHeader>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  balanceBoxContainer: {
    height: theme.rem(3.25)
  },
  balanceHeader: {
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  balanceTicker: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText
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
