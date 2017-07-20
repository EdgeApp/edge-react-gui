import React, { Component } from 'react'
import PropTypes from 'prop-types'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated, Picker } from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import T from '../../components/FormattedText'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import {executeWalletRowOption} from './action'
import RowOptions from './WalletListRowOptions.ui'
import {border as b, cutOffText} from '../../../utils'
import { selectWallet } from '../../Wallets/action.js'

import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

export const findDenominationSymbol = (denoms, value) => {
  console.log('in findDenominationSymbol, denoms is: ' , denoms, ' , and value is : ', value)
  for(v of denoms) {
    if(v.name === value) {
      return v.symbol
    }
  }
}

class WalletListRow extends Component {
  _onPressSelectWallet = (walletId, currencyCode) => {
    console.log('selecting wallet with walletId: ' , walletId, ' and currencyCode: ', currencyCode)
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList()
  }

  render () {
    console.log('rendering WalletListRow, this.props is: ', this.props)
    let id = this.props.data.id
    let name = this.props.data.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(this.props.data.denominations, this.props.data.currencyCode )
    const currencyCode = this.props.data.currencyCode
    const multiplier = 1000
    // const multiplier = this.props.data.denominations[this.props.settings[this.props.data.currencyCode].denomination - 1].multiplier

    return (
      <View>
        <TouchableHighlight style={[styles.rowContainer]}
          underlayColor={'#eee'}
          delayLongPress={500}
          {...this.props.sortHandlers}
          onPress={() => this._onPressSelectWallet(this.props.data.id, currencyCode)}
          >
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>{this.props.data.balance / multiplier}</T>
              <T style={[styles.rowBalanceDenominationText]}>{this.props.data.currencyCode} ({symbol || ''})</T>
            </View>
            <RowOptions walletKey={id} archiveLabel={this.props.archiveLabel} />
          </View>
        </TouchableHighlight>
        {this.props.wallets[id].metaTokens.map((x, i) => (
          <WalletListTokenRowConnect metaToken={x} key={x.currencyCode} balance={x.balance} currencyCode={x.currencyCode} parentWallet={this.props.data.id} />
        ))}
      </View>
    )
  }
}

export default connect((state, ownProps) => {
  const wallet = ownProps.data
  const walletId = wallet.id
  const currencyCode = wallet.currencyCode
  const index = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
  const denomination = wallet.allDenominations[currencyCode][index]
  const multiplier = denomination.multiplier

  return {
    wallets: state.ui.wallets.byId,
    settings: state.ui.settings,
    denomination,
    multiplier
  }
})(WalletListRow)

class WalletListTokenRow extends Component {
  constructor(props) {
    super(props)
  }

  _onPressSelectWallet = (walletId, currencyCode) => {
    console.log('selecting wallet with walletId: ' , walletId, ' and currencyCode: ', currencyCode )
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList()
  }

  render () {
    return (
      <TouchableHighlight style={[styles.tokenRowContainer]}
        underlayColor={'#eee'}
        delayLongPress={500}
        {...this.props.sortHandlers}
        onPress={() => this._onPressSelectWallet(this.props.parentWallet, this.props.currencyCode)}>
        <View style={[styles.tokenRowContent]}>
          <View style={[styles.tokenRowNameTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.currencyCode}</T>
          </View>
          <View style={[styles.tokenRowBalanceTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.balance}</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

WalletListTokenRow.propTypes = {
  currencyCode: PropTypes.string,
  balance: PropTypes.number
}

export const WalletListTokenRowConnect = connect((state, ownProps) => {
  const walletId = ownProps.parentWallet
  const currencyCode = ownProps.currencyCode
  const wallet = UI_SELECTORS.getWallet(state, walletId)
  const index = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
  const denomination = wallet.allDenominations[currencyCode][index]
  const multiplier = denomination.multiplier

  return {
    denomination,
    multiplier
  }
})(WalletListTokenRow)
