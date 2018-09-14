// @flow

import React, { PureComponent } from 'react'
import { TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'

import s from '../../../../../../locales/strings.js'
import { type State } from '../../../../../ReduxTypes.js'
import { getFiatSymbol } from '../../../../../utils.js'
import T from '../../../../components/FormattedText'
import { styles } from './WiredBalanceBoxStyle.js'

type BalanceBoxState = {}

type BalanceBoxProps = {
  showBalance: boolean,
  fiatAmount: number,
  fiatCurrencyCode: string,
  onPress: Function
}

type WiredBalanceBoxOwnProps = {
  showBalance: boolean | Function,
  fiatAmount: number | Function,
  fiatCurrencyCode: string | Function,
  onPress: Function
}

class BalanceBox extends PureComponent<BalanceBoxProps, BalanceBoxState> {
  constructor (props: BalanceBoxProps) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { fiatCurrencyCode, fiatAmount } = this.props
    const fiatSymbol = fiatCurrencyCode ? getFiatSymbol(fiatCurrencyCode) : ''
    let fiatBalanceString = ''
    if (fiatSymbol.length !== 1) {
      fiatBalanceString = fiatAmount + ' ' + fiatCurrencyCode
    } else {
      fiatBalanceString = fiatSymbol + ' ' + fiatAmount + ' ' + fiatCurrencyCode
    }

    return (
      <TouchableOpacity onPress={this.props.onPress}>{this.props.showBalance ? this.balanceBox(fiatBalanceString) : this.hiddenBalanceBox()}</TouchableOpacity>
    )
  }

  balanceBox (fiatBalanceString: string) {
    return (
      <View style={[styles.totalBalanceBox]}>
        <View style={[styles.totalBalanceWrap]}>
          <View style={[styles.totalBalanceHeader]}>
            <T style={[styles.totalBalanceText]}>{s.strings.fragment_wallets_balance_text}</T>
          </View>
          <View style={[styles.currentBalanceBoxDollarsWrap]}>
            <T style={[styles.currentBalanceBoxDollars]}>{fiatBalanceString}</T>
          </View>
        </View>
      </View>
    )
  }

  hiddenBalanceBox () {
    return (
      <View style={[styles.totalBalanceBox]}>
        <View style={[styles.totalBalanceWrap]}>
          <View style={[styles.hiddenBalanceBoxDollarsWrap]}>
            <T style={[styles.currentBalanceBoxDollars]}>{s.strings.string_show_balance}</T>
          </View>
        </View>
      </View>
    )
  }
}

export const WiredBalanceBox = connect(
  (state: State, ownProps: WiredBalanceBoxOwnProps): BalanceBoxProps => ({
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    fiatAmount: typeof ownProps.fiatAmount === 'function' ? ownProps.fiatAmount(state) : ownProps.fiatAmount,
    fiatCurrencyCode: typeof ownProps.fiatCurrencyCode === 'function' ? ownProps.fiatCurrencyCode(state) : ownProps.fiatCurrencyCode,
    onPress: ownProps.onPress
  }),
  null
)(BalanceBox)
