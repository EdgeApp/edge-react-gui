import React, {Component} from 'react'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { bns } from 'biggystring'
import {
  View,
  TouchableHighlight,
  Animated,
  Image
} from 'react-native'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import T from '../../components/FormattedText'
import RowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRow.ui'
import {border as b, cutOffText, truncateDecimals} from '../../../utils'
import {selectWallet} from '../../Wallets/action.js'
import sort from '../../../../assets/images/walletlist/sort.png'

import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'

export const findDenominationSymbol = (denoms, value) => {
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

class SortableWalletListRow extends Component {

  render () {
    const {data} = this.props
    let walletData = data
    let currencyCode = walletData.currencyCode
    console.log('still in walletListRow, currencyCode is : ', currencyCode, ' , walletData is : ', walletData, ' , this.props.index is: ', this.props.index)
    let multiplier = this.props.displayDenomination.multiplier
    let name = walletData.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(walletData.denominations, walletData.currencyCode)
    return (
      <Animated.View style={[{width: this.props.dimensions.deviceDimensions.width}, b()]}>
        <TouchableHighlight
          style={[styles.rowContainer]}
          underlayColor={'#eee'}
          {...this.props.sortHandlers}
          >
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>{truncateDecimals(bns.divf(walletData.primaryNativeBalance, multiplier).toString(), 6)}</T>
              <T style={[styles.rowBalanceDenominationText]}>{walletData.currencyCode}
                ({symbol || ''})</T>
            </View>
            <View style={[styles.rowDragArea, b()]}>
              <Image
                source={sort}
                style={{height: 15, width: 15}}
              />
            </View>
          </View>
        </TouchableHighlight>
      </Animated.View>
    )
  }
}

export const SortableWalletListRowConnect =  connect((state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.currencyCode)
  return {
    dimensions: state.ui.scenes.dimensions,
    displayDenomination,
    exchangeDenomination
  }
})(SortableWalletListRow)

class FullWalletListRow extends Component {

  _onPressSelectWallet = (walletId, currencyCode) => {
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList({ params: 'walletList' })
  }

  render () {
    const {data} = this.props
    let walletData = data.item
    let currencyCode = walletData.currencyCode
    let denomination = this.props.displayDenomination
    let multiplier = denomination.multiplier
    let id = walletData.id
    let name = walletData.name || sprintf(strings.enUS['string_no_name'])
    let symbol = denomination.symbol
    return (
      <Animated.View style={[{width: this.props.dimensions.deviceDimensions.width}, b()]}>
        <TouchableHighlight
          style={[styles.rowContainer]}
          underlayColor={'#eee'}
          {...this.props.sortHandlers}
          onPress={() => this._onPressSelectWallet(id, currencyCode)}
        >
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>
                {truncateDecimals(bns.divf(walletData.primaryNativeBalance, multiplier).toString(), 6)}
              </T>
              <T style={[styles.rowBalanceDenominationText]}>{walletData.currencyCode} ({symbol || ''})</T>
            </View>
            <RowOptions sortableMode={this.props.sortableMode} executeWalletRowOption={walletData.executeWalletRowOption} walletKey={id} archived={walletData.archived} />
          </View>
        </TouchableHighlight>
        {this.renderTokenRow(id, walletData.nativeBalances, this.props.active)}
      </Animated.View>
    )
  }

  renderTokenRow = (parentId, metaTokenBalances) => {
    let tokens = []
    for (let property in metaTokenBalances) {
      if (property !== this.props.data.item.currencyCode) {
        tokens.push(
          <WalletListTokenRow parentId={parentId}
            currencyCode={property} key={property} balance={metaTokenBalances[property]} active={this.props.active} />)
      }
    }
    return tokens
  }
}

export const FullWalletListRowConnect =  connect((state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)

  return {
    dimensions: state.ui.scenes.dimensions,
    displayDenomination,
    exchangeDenomination
  }
})(FullWalletListRow)

export const WalletListTokenRowConnect = connect((state, ownProps) => {
  const walletId = ownProps.parentId
  const currencyCode = ownProps.currencyCode
  const wallet:GUIWallet = UI_SELECTORS.getWallet(state, walletId)
  let denomination:AbcDenomination = {}
  let multiplier:string = '0'
  if (wallet) {
    denomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
    multiplier = denomination.multiplier
  }

  return {denomination, multiplier}
})(WalletListTokenRow)
