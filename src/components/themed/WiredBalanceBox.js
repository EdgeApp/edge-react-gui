// @flow
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import { type RootState } from '../../types/reduxTypes.js'
import { getFiatSymbol } from '../../util/utils.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import Ticker, { Tick } from "react-native-ticker"

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

function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const currencies = ["$", "¥", "€"];

class BalanceBox extends React.PureComponent<Props> {

  state = {
    currency: currencies[getRandom(0, 2)],
    value: "123.456.848,56"
  };

  componentDidMount() {
    const updateState = this.setState.bind(this);
    const curValue = this.state.value;

    setInterval(() => {
      updateState({
        currency: currencies[getRandom(0, 2)],
        value: "124.436.848,34"
      });
    }, 2000);
  };

  componentDidUpdate() {
    const updateState = this.setState.bind(this);
    const curValue = this.state.value;

    setInterval(() => {
      updateState({
        currency: currencies[getRandom(0, 2)],
        value: "143.496.850,43"
      });
    }, 2000);
  };

  render() {
    const { isoFiatCurrencyCode, fiatAmount, showBalance, exchangeRates, theme } = this.props
    const fiatSymbol = isoFiatCurrencyCode ? getFiatSymbol(isoFiatCurrencyCode) : ''
    const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
    const styles = getStyles(theme);

    // if there is no exchangeRates object, empty object, or object with zero values
    // $FlowFixMe it appears that Object.values may break flow
    const summation = (total: number, rate: number) => {
      if (isNaN(rate)) rate = 0
      return total + rate
    }
    const noExchangeRates = !exchangeRates || !Object.keys(exchangeRates).length || !Object.values(exchangeRates).reduce(summation)

    return (
      <TouchableOpacity onPress={this.props.onPress} >
        <View style={styles.container}>
          {showBalance && !noExchangeRates ? (
            <>
              <EdgeText style={styles.balanceHeader}>{s.strings.fragment_wallets_balance_text}</EdgeText>
              <Ticker textStyle={[styles.balanceBody]}>

                {
                  fiatSymbol.length !== 1 ? `${fiatAmount} ${fiatCurrencyCode}`
                    : `${fiatSymbol} ${this.state.value} ${fiatCurrencyCode}`
                }

              </Ticker>
            </>
          ) : (
              <EdgeText style={styles.showBalance}>{noExchangeRates ? s.strings.exchange_rates_loading : s.strings.string_show_balance}</EdgeText>
            )}
        </View>
      </TouchableOpacity>
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
    height: theme.rem(5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  balanceHeader: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  balanceBody: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.75)
  },
  showBalance: {
    fontSize: theme.rem(1.75)
  }
}))
