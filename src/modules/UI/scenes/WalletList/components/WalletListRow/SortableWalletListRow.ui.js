import React, {Component} from 'react'
import strings from '../../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  Animated,
  Image
} from 'react-native'
import styles from '../../style'
import T from '../../../../components/FormattedText/FormattedText.ui'
import * as UTILS from '../../../../../utils'
import sort from '../../../../../../../src/assets/images/walletlist/sort.png'

export const findDenominationSymbol = (denoms, value) => {
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export default class SortableWalletListRow extends Component {
  render () {
    const {data} = this.props
    let walletData = data
    let currencyCode = walletData.currencyCode
    let multiplier = this.props.displayDenomination.multiplier
    let name = walletData.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(walletData.denominations, currencyCode)
    return (
      <Animated.View style={[{width: this.props.dimensions.deviceDimensions.width}]}>
        <TouchableHighlight style={[styles.rowContainer]}
          underlayColor={'#eee'}
          {...this.props.sortHandlers}>
          <View style={[styles.rowContent]}>

            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>
                {UTILS.cutOffText(name, 34)}
              </T>
            </View>

            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>
                {UTILS.truncateDecimals(bns.divf(walletData.primaryNativeBalance, multiplier).toString(), 6)}
              </T>
              <T style={[styles.rowBalanceDenominationText]}>
                {currencyCode} ({symbol || ''})
              </T>
            </View>

            <View style={[styles.rowDragArea]}>
              <Image style={{height: 15, width: 15}} source={sort} />
            </View>

          </View>
        </TouchableHighlight>
      </Animated.View>
    )
  }
}
