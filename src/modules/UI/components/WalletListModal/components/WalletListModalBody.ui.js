// @flow
import React, {Component} from 'react'
import {
  View,
  LayoutAnimation,
  TouchableHighlight
} from 'react-native'
import T from '../../../components/FormattedText'
import styles, {styles as styleRaw} from '../style'
import * as UTILS from '../../../../utils'
import {bns} from 'biggystring'
import type {GuiWallet} from '../../../../../types'

const DIVIDE_PRECISION = 18

/* type Props = {
  type: string,
  walletList: Array<void>,
  settings: Array<void>,
  activeWalletIds: Array<void>,
  selectedWalletId: Array<void>,
  disableWalletListModalVisibility(): void,
  toggleSelectedWalletListModal(): void,
  toggleScanToWalletListModal(): void,
  getTransactions(string, string): void,
  selectWallet(string, string, string): void,
  updateReceiveAddress(string, string): void
} */

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
    let cryptoAmount = bns.div(balance, multiplier, DIVIDE_PRECISION)
    const walletId = parentId
    return (
      <TouchableHighlight style={styles.tokenRowContainer}
        underlayColor={styleRaw.underlay.color}
        key={currencyCode} onPress={() => {
          this.props.getTransactions(parentId, currencyCode)
          this.props.disableWalletListModalVisibility()
          this.props.selectWallet(walletId, currencyCode, this.props.type)
          this.props.updateReceiveAddress(parentId, currencyCode)
        }}>
        <View style={styles.currencyRowContent}>
          <View style={styles.currencyRowNameTextWrap}>
            <T style={styles.currencyRowText}>
              {currencyCode}
            </T>
          </View>
          <View style={styles.currencyRowBalanceTextWrap}>
            <T style={styles.currencyRowText}>
              {cryptoAmount}
            </T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  renderWalletRow = (guiWallet: GuiWallet) => {
    let multiplier
      = guiWallet
      .allDenominations[guiWallet.currencyCode][this.props.settings[guiWallet.currencyCode].denomination]
      .multiplier
    let symbol
      = guiWallet
      .allDenominations[guiWallet.currencyCode][multiplier]
      .symbol
    let denomAmount:string = bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION)
    const walletId = guiWallet.id
    const currencyCode = guiWallet.currencyCode

    // need to crossreference tokensEnabled with nativeBalances
    let enabledNativeBalances = {}
    const enabledTokens = guiWallet.enabledTokens

    for (let prop in guiWallet.nativeBalances) {
      if ((prop !== currencyCode) && (enabledTokens.includes(prop))) {
        enabledNativeBalances[prop] = guiWallet.nativeBalances[prop]
      }
    }

    return (
      <View key={guiWallet.id}>
        <TouchableHighlight style={styles.rowContainer}
          underlayColor={styleRaw.underlay.color}
          onPress={() => {
            this.props.getTransactions(guiWallet.id, guiWallet.currencyCode)
            this.props.disableWalletListModalVisibility()
            this.props.selectWallet(walletId, currencyCode, this.props.type)
            this.props.updateReceiveAddress(guiWallet.id, guiWallet.currencyCode)
          }}>
          <View style={styles.currencyRowContent}>
            <View style={styles.currencyRowNameTextWrap}>
              <T style={styles.currencyRowText}>
                {UTILS.cutOffText(guiWallet.name, 34)}
              </T>
            </View>
            <View style={styles.rowBalanceTextWrap}>
              <T style={styles.currencyRowText}>
                {symbol || ''} {denomAmount}
              </T>
            </View>
          </View>
        </TouchableHighlight>

        {this.renderTokens(guiWallet.id, enabledNativeBalances, guiWallet.currencyCode)}
      </View>
    )
  }

  renderWalletRows () {
    const guiWallets: Array<GuiWallet> = []
    for (const id of this.props.activeWalletIds) {
      if (typeof this.props.walletList[id] !== 'undefined') {
        guiWallets.push(this.props.walletList[id])
      }
    }

    return guiWallets.map(this.renderWalletRow)
  }

  render () {
    // console.log('rendering dropdown', this.props.selectedWalletId)
    return (
      <View>{this.renderWalletRows()}</View>
    )
  }
}
