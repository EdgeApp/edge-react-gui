import React, {Component} from 'react'
import PropTypes from 'prop-types'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {
  View,
  TouchableHighlight,
  Animated,
  Platform,
  Easing
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
  constructor (props) {
    super(props)

    this._active = new Animated.Value(0)

    this._style = {
      ...Platform.select({
        ios: {
          transform: [{
            scale: this._active.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.1]
            })
          }],
          shadowRadius: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 10]
          })
        },

        android: {
          transform: [{
            scale: this._active.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.07]
            })
          }],
          elevation: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6]
          })
        }
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.active !== nextProps.active) {
      Animated.timing(this._active, {
        duration: 300,
        easing: Easing.bounce,
        toValue: Number(nextProps.active)
      }).start()
    }
  }

  _onPressSelectWallet = (walletId, currencyCode) => {
    // console.log('selecting wallet with walletId: ' , walletId, ' and currencyCode: ', currencyCode)
    this.props.dispatch(selectWallet(walletId, currencyCode))
    Actions.transactionList({type: 'reset', params: 'walletList'})
  }

  render () {
    console.log('about to render, this is: ', this)
    const {datae} = this.props
    let walletData = data
    let id = walletData.id
    let name = walletData.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(walletData.denominations, walletData.currencyCode)
    const currencyCode = walletData.currencyCode
    const multiplier = walletData.multiplier
    console.log('walletData is: ', walletData, ' , name is: ', name)
    return (
      <Animated.View style={[{width: this.props.dimensions.deviceDimensions.width}, b()]}>
        <TouchableHighlight style={[styles.rowContainer]} underlayColor={'#eee'} {...this.props.sortHandlers} onPress={() => this._onPressSelectWallet(id, currencyCode)}>
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>{walletData.balance / multiplier}</T>
              <T style={[styles.rowBalanceDenominationText]}>{walletData.currencyCode}
                ({symbol || ''})</T>
            </View>
            <RowOptions walletKey={id} archiveLabel={this.props.archiveLabel} />
          </View>
        </TouchableHighlight>
        {this.renderTokenRow(walletData.balances)}
      </Animated.View>
    )
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
}

export default connect(state => ({
  dimensions: state.ui.scenes.dimensions
}))(WalletListRow)

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
            <T style={[styles.tokenRowText]}>{(this.props.balance / this.props.multiplier) || 0}</T>
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
  const walletId = ownProps.parentId
  const currencyCode = ownProps.currencyCode
  const wallet = UI_SELECTORS.getWallet(state, walletId)
  let denomination = {}
  let multiplier = 0
  if (wallet) {
    const index = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
    denomination = wallet.allDenominations[currencyCode][index]
    multiplier = denomination.multiplier
  }

  return {denomination, multiplier}
})(WalletListTokenRow)
