import React, {Component} from 'react'
import {connect} from 'react-redux'
import strings from '../../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  Image,
  ActivityIndicator
} from 'react-native'
import styles from '../../style.js'
import T from '../../../../components/FormattedText'
import {border as b, cutOffText, truncateDecimals} from '../../../../../utils'
import sort from '../../../../../../assets/images/walletlist/sort.png'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'

const findDenominationSymbol = (denoms, value) => {
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
    let multiplier, name, symbol
    // const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, data.currencyCode)
    if (walletData.currencyCode) {
      let displayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(this.props.settings, data.currencyCode)
      multiplier = displayDenomination.multiplier
      name = walletData.name || sprintf(strings.enUS['string_no_name'])
      symbol = findDenominationSymbol(walletData.denominations, walletData.currencyCode)
    }
    console.log('rendering SortableWalletListRow, walletData is: ', walletData, ' this is: ', this)
    return (
      <TouchableHighlight
        style={[b('green'), styles.rowContainer, {width: this.props.dimensions.deviceDimensions.width, height: 50, backgroundColor: 'white', padding: 16, paddingLeft: 20, paddingRight: 20, justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#EEE'}]}
        underlayColor={'#eee'}
        {...this.props.sortHandlers}
      >
          {walletData.currencyCode? (
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
            ) : (
              <View style={[styles.rowContent]}>
                <View style={[styles.rowNameTextWrap]}>
                  <ActivityIndicator style={{height: 18, width: 18}}/>
                </View>
              </View>
          )}
        </TouchableHighlight>
    )
  }
}

export default connect((state) => {
  const settings = state.ui.settings

  return {
    settings
  }
})(SortableWalletListRow)