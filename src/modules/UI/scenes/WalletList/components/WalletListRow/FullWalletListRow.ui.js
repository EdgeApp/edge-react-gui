import React, {Component} from 'react'
import strings from '../../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  Animated,
} from 'react-native'
import {Actions} from 'react-native-router-flux'
import styles from '../../style'
import T from '../../../../components/FormattedText/FormattedText.ui'
import RowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRowConnector'
import * as UTILS from '../../../../../utils'

export default class FullWalletListRow extends Component {
  _onPressSelectWallet = (walletId, currencyCode) => {
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({params: 'walletList'})
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
      <Animated.View style={[{width: this.props.dimensions.deviceDimensions.width}]}>
        <TouchableHighlight
          style={[styles.rowContainer]}
          underlayColor={'#eee'}
          {...this.props.sortHandlers}
          onPress={() => this._onPressSelectWallet(id, currencyCode)}>
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{UTILS.cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>
                {UTILS.truncateDecimals(bns.divf(walletData.primaryNativeBalance, multiplier).toString(), 6)}
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
