// @flow
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { type RootState } from '../../types/reduxTypes.js'
import { getFiatSymbol } from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { ThemedTicker } from './ThemedTicker.js'

type StateProps = {
  showBalance: boolean,
  fiatAmount: number,
  isoFiatCurrencyCode: string,
  onPress: Function,
  exchangeRates?: { [string]: number }
}

type OwnProps = {
  showBalance: boolean | Function,
  fiatAmount: number | Function,
  isoFiatCurrencyCode: string | Function,
  onPress: Function,
  exchangeRates?: { [string]: number }
}

type Props = StateProps & OwnProps & ThemeProps
class BalanceBox extends React.PureComponent<Props> {
  render() {
    const { isoFiatCurrencyCode, fiatAmount, showBalance, exchangeRates, theme } = this.props
    const fiatSymbol = isoFiatCurrencyCode ? getFiatSymbol(isoFiatCurrencyCode) : ''
    const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
    const formattedFiat = formatNumber(fiatAmount, { toFixed: 2 })
    const styles = getStyles(theme)

    // if there is no exchangeRates object, empty object, or object with zero values
    // $FlowFixMe it appears that Object.values may break flow
    const summation = (total: number, rate: number) => {
      if (isNaN(rate)) rate = 0
      return total + rate
    }
    const noExchangeRates = !exchangeRates || !Object.keys(exchangeRates).length || !Object.values(exchangeRates).reduce(summation)

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.props.onPress} style={styles.balanceBoxContainer}>
          {showBalance && !noExchangeRates ? (
            <>
              <EdgeText style={styles.balanceHeader}>{s.strings.fragment_wallets_balance_text}</EdgeText>
              <ThemedTicker style={styles.balanceBody}>
                {fiatSymbol.length !== 1 ? `${formattedFiat} ${fiatCurrencyCode}` : `${fiatSymbol} ${formattedFiat} ${fiatCurrencyCode}`}
              </ThemedTicker>
            </>
          ) : (
            <EdgeText style={styles.showBalance}>{noExchangeRates ? s.strings.exchange_rates_loading : s.strings.string_show_balance}</EdgeText>
          )}
        </TouchableOpacity>
      </View>
    )
  }
}

export const WiredBalanceBox = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const isoFiatCurrencyCode = typeof ownProps.isoFiatCurrencyCode === 'function' ? ownProps.isoFiatCurrencyCode(state) : ownProps.isoFiatCurrencyCode
  return {
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    fiatAmount: typeof ownProps.fiatAmount === 'function' ? ownProps.fiatAmount(state, isoFiatCurrencyCode) : ownProps.fiatAmount,
    onPress: ownProps.onPress,
    isoFiatCurrencyCode,
    exchangeRates: ownProps.exchangeRates
  }
}, null)(withTheme(BalanceBox))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginLeft: theme.rem(2),
    paddingBottom: theme.rem(1),
    marginBottom: theme.rem(1),
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  balanceBoxContainer: {
    height: theme.rem(3.25)
  },
  balanceHeader: {
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  balanceBody: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceBold
  },
  showBalance: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceBold
  }
}))
