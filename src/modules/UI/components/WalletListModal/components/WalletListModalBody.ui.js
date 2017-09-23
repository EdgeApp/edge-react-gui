// @flow
import React, {Component} from 'react'
import {
  View,
  LayoutAnimation,
  TouchableOpacity
} from 'react-native'
import T from '../../../components/FormattedText'
import styles from '../style'
import * as UTILS from '../../../../utils'
import {bns} from 'biggystring'

export default class WalletListModalBody extends Component<$FlowFixMeProps> {
  selectFromWallet = () => {
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  selectToWallet = () => {
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  renderTokens = (walletId: string, metaTokenBalances: any, code: any) => {
    let tokens = []
    for (let property in metaTokenBalances) {
      if (property !== code) {
        tokens.push(this.renderTokenRowContent(walletId, property, metaTokenBalances[property]))
      }
    }
    return tokens
  }

  renderTokenRowContent = (parentId: string, currencyCode: string, balance: any) => {
    let multiplier
      = this.props.walletList[parentId]
      .allDenominations[currencyCode][this.props.settings[currencyCode].denomination]
      .multiplier
    let cryptoAmount = bns.divf(balance, multiplier)
    const walletId = parentId
    return (
      <TouchableOpacity style={[styles.tokenRowContainer]}
        key={currencyCode} onPress={() => {
          this.props.getTransactions(parentId, currencyCode)
          this.props.disableWalletListModalVisibility()
          this.props.selectWallet(walletId, currencyCode)
          this.props.updateReceiveAddress(parentId, currencyCode)
        }}>
        <View style={[styles.currencyRowContent]}>
          <View style={[styles.currencyRowNameTextWrap]}>
            <T style={[styles.currencyRowText]}>
              {currencyCode}
            </T>
          </View>
          <View style={[styles.currencyRowBalanceTextWrap]}>
            <T style={[styles.currencyRowText]}>
              {cryptoAmount}
            </T>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  renderWalletRow = (guiWallet: any, i: number) => {
    let multiplier
      = guiWallet
      .allDenominations[guiWallet.currencyCode][this.props.settings[guiWallet.currencyCode].denomination]
      .multiplier
    let symbol
      = guiWallet
      .allDenominations[guiWallet.currencyCode][multiplier]
      .symbol
    let denomAmount = bns.divf(guiWallet.primaryNativeBalance, multiplier)
    const walletId = guiWallet.id
    const currencyCode = guiWallet.currencyCode
    return (
      <View key={i}>
        <TouchableOpacity style={[styles.rowContainer]}
          onPress={() => {
            this.props.getTransactions(guiWallet.id, guiWallet.currencyCode)
            this.props.disableWalletListModalVisibility()
            this.props.selectWallet(walletId, currencyCode)
            this.props.updateReceiveAddress(guiWallet.id, guiWallet.currencyCode)
          }}>
          <View style={[styles.currencyRowContent]}>
            <View style={[styles.currencyRowNameTextWrap]}>
              <T style={[styles.currencyRowText]}>
                {UTILS.cutOffText(guiWallet.name, 34)}
              </T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.currencyRowText]}>
                {symbol || ''} {denomAmount}
              </T>
            </View>
          </View>
        </TouchableOpacity>

        {this.renderTokens(guiWallet.id, guiWallet.nativeBalances, guiWallet.currencyCode)}
      </View>
    )
  }

  renderWalletRows () {
    let i = -1
    let rows = []
    for (const n in this.props.walletList) {
      i = i + 1
      const guiWallet = this.props.walletList[n]
      if (typeof guiWallet.id !== 'undefined' && this.props.activeWalletIds.includes(guiWallet.id)) {
        rows.push(this.renderWalletRow(guiWallet, i))
      }
    }
    return rows
  }

  render () {
    // console.log('rendering dropdown', this.props.selectedWalletId)
    return (
      <View>{this.renderWalletRows()}</View>
    )
  }
}
