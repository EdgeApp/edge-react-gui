import React, {Component} from 'react'
import PropTypes from 'prop-types'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { bns } from 'biggystring'
import { ABCDenomination, GUIWallet } from '../../../../types.js'
import {
  View,
  TouchableHighlight
} from 'react-native'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import T from '../../components/FormattedText'
import RowOptions from './WalletListRowOptions.ui'
import {border as b, cutOffText} from '../../../utils'
import {selectWallet} from '../../Wallets/action.js'

import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

export const findDenominationSymbol = (denoms, value) => {
  // console.log('in findDenominationSymbol, denoms is: ' , denoms, ' , and value is : ', value)
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

class WalletListRow extends Component {
  _onPressSelectWallet = (walletId, currencyCode) => {
    // console.log('selecting wallet with walletId: ' , walletId, ' and currencyCode: ', currencyCode)
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList({type: 'reset', params: 'walletList'})
  }

  renderTokenRow = (metaTokenBalances) => {
    var tokens = []
    for (var property in metaTokenBalances) {
      if (property !== this.props.data.currencyCode) {
        tokens.push(
          <WalletListTokenRowConnect parentId={this.props.data.id}
            currencyCode={property} key={property} balance={metaTokenBalances[property]} />)
      }
    }
    return tokens
  }

  render () {
    let id = this.props.data.id
    let name = this.props.data.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(this.props.data.denominations, this.props.data.currencyCode)
    const currencyCode = this.props.data.currencyCode
    const multiplier = this.props.multiplier

    return (
      <View>
        <TouchableHighlight style={[styles.rowContainer]} underlayColor={'#eee'} delayLongPress={500} {...this.props.sortHandlers} onPress={() => this._onPressSelectWallet(this.props.data.id, currencyCode)}>
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap, b()]}>
              <T style={[styles.rowBalanceAmountText, b()]}>{
                bns.divf(this.props.data.primaryNativeBalance, multiplier)
              }</T>
              <T style={[styles.rowBalanceDenominationText, b()]}>{this.props.data.currencyCode}
                ({symbol || ''})</T>
            </View>
            <RowOptions walletKey={id} archiveLabel={this.props.archiveLabel} />
          </View>
        </TouchableHighlight>
        {this.renderTokenRow(this.props.wallets[id].nativeBalances)}
      </View>
    )
  }
}

export default connect((state, ownProps) => {
  const wallet = ownProps.data
  const currencyCode = wallet.currencyCode
  const index = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
  const denomination = wallet.allDenominations[currencyCode][index]
  const multiplier = denomination.multiplier

  return {wallets: state.ui.wallets.byId, settings: state.ui.settings, denomination, multiplier}
})(WalletListRow)

class WalletListTokenRow extends Component {
  _onPressSelectWallet = (walletId, currencyCode) => {
    console.log('selecting wallet with walletId: ', walletId, ' and currencyCode: ', currencyCode)
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList({type: 'reset', params: 'walletList'})
  }

  render () {
    return (
      <TouchableHighlight style={[styles.tokenRowContainer]} underlayColor={'#eee'} delayLongPress={500} {...this.props.sortHandlers} onPress={() => this._onPressSelectWallet(this.props.parentId, this.props.currencyCode)}>
        <View style={[styles.tokenRowContent]}>
          <View style={[styles.tokenRowNameTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.currencyCode}</T>
          </View>
          <View style={[styles.tokenRowBalanceTextWrap]}>
            <T style={[styles.tokenRowText]}>{
              bns.divf(this.props.balance, this.props.multiplier) || '0'
            }</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

WalletListTokenRow.propTypes = {
  currencyCode: PropTypes.string,
  balance: PropTypes.string
}

export const WalletListTokenRowConnect = connect((state, ownProps) => {
  const walletId = ownProps.parentId
  const currencyCode = ownProps.currencyCode
  const wallet:GUIWallet = UI_SELECTORS.getWallet(state, walletId)
  let denomination:ABCDenomination = {}
  let multiplier:string = '0'
  if (wallet) {
    const index:string = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
    denomination = wallet.allDenominations[currencyCode][index]
    multiplier = denomination.multiplier
  }

  return {denomination, multiplier}
})(WalletListTokenRow)
