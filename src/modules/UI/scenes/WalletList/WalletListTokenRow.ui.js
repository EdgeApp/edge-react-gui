import React, {Component} from 'react'
import PropTypes from 'prop-types'
import type { AbcDenomination } from 'airbitz-core-js'
import {
  View,
  TouchableHighlight
} from 'react-native'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import T from '../../components/FormattedText'
import { selectWallet } from '../../Wallets/action.js'

import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils.js'

class WalletListTokenRow extends Component {
  _onPressSelectWallet = (walletId, currencyCode) => {
    this.props.dispatch(selectWallet({ walletId, currencyCode }))
    Actions.transactionList({params: 'walletList'})
  }

  render () {
    return (
      <TouchableHighlight style={[styles.tokenRowContainer, (this.props.active && styles.activeOpacity)]} underlayColor={'#eee'} delayLongPress={500} {...this.props.sortHandlers} onPress={() => this._onPressSelectWallet(this.props.parentId, this.props.currencyCode)}>
        <View style={[styles.tokenRowContent]}>
          <View style={[styles.tokenRowNameTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.currencyCode}</T>
          </View>
          <View style={[styles.tokenRowBalanceTextWrap]}>
            <T style={[styles.tokenRowText]}>{
              UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balance) || '0'
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

export default connect((state, ownProps) => {
  const currencyCode:string = ownProps.currencyCode
  const displayDenomination:AbcDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)

  return { displayDenomination }
})(WalletListTokenRow)
