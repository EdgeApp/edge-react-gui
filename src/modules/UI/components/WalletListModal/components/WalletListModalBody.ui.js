// @flow

import { bns } from 'biggystring'
import _ from 'lodash'
import React, { type Node, Component } from 'react'
import { LayoutAnimation, TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import type { GuiWallet } from '../../../../../types/types.js'
import * as UTILS from '../../../../../util/utils'
import T from '../../../components/FormattedText'
import styles, { styles as styleRaw } from '../style'

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
  selectWallet(string, string, string): void,
  updateReceiveAddress(string, string): void
} */

export default class WalletListModalBody extends Component<$FlowFixMeProps> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  selectFromWallet = () => {
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  selectToWallet = () => {
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  renderTokens = (walletId: string, metaTokenBalances: any, code: any, combinedTokens: Array<any> /* merge between customToken and metaToken */) => {
    const tokens = []
    for (const property in metaTokenBalances) {
      if (property !== code) {
        const index = _.findIndex(combinedTokens, token => token.currencyCode === property)
        if (index !== -1) {
          tokens.push(this.renderTokenRowContent(walletId, property, metaTokenBalances[property]))
        }
      }
    }
    return tokens
  }

  renderTokenRowContent = (parentId: string, currencyCode: string, balance: any) => {
    const denomination = this.props.walletList[parentId].allDenominations[currencyCode]
    let multiplier
    if (denomination) {
      multiplier = denomination[this.props.settings[currencyCode].denomination].multiplier
    } else {
      const customDenom = _.find(this.props.settings.customTokens, item => item.currencyCode === currencyCode)
      if (customDenom && customDenom.denominations && customDenom.denominations[0]) {
        multiplier = customDenom.denominations[0].multiplier
      } else {
        return // let it blow up. It shouldn't be attempting to display
      }
    }
    const cryptoAmount = bns.div(balance, multiplier, DIVIDE_PRECISION)
    const walletId = parentId
    return (
      <TouchableHighlight
        style={styles.tokenRowContainer}
        underlayColor={styleRaw.underlay.color}
        key={currencyCode}
        onPress={() => {
          this.props.disableWalletListModalVisibility()
          this.props.selectWallet(walletId, currencyCode, this.props.type)
          this.props.updateReceiveAddress(parentId, currencyCode)
        }}
      >
        <View style={styles.currencyRowContent}>
          <View style={styles.currencyRowNameTextWrap}>
            <T style={styles.currencyRowText}>{currencyCode}</T>
          </View>
          <View style={styles.currencyRowBalanceTextWrap}>
            <T style={styles.currencyRowText}>{cryptoAmount}</T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  renderWalletRow = (guiWallet: GuiWallet) => {
    const multiplier = guiWallet.allDenominations[guiWallet.currencyCode][this.props.settings[guiWallet.currencyCode].denomination].multiplier
    const symbol = guiWallet.allDenominations[guiWallet.currencyCode][multiplier].symbol
    const denomAmount: string = bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION)
    const walletId = guiWallet.id
    const currencyCode = guiWallet.currencyCode

    // need to crossreference tokensEnabled with nativeBalances
    const enabledNativeBalances = {}
    const enabledTokens = guiWallet.enabledTokens

    for (const prop in guiWallet.nativeBalances) {
      if (prop !== currencyCode && enabledTokens.includes(prop)) {
        enabledNativeBalances[prop] = guiWallet.nativeBalances[prop]
      }
    }

    const combinedTokens = UTILS.mergeTokensRemoveInvisible(guiWallet.metaTokens, this.props.settings.customTokens)

    return (
      <View key={guiWallet.id}>
        <TouchableHighlight
          style={styles.rowContainer}
          underlayColor={styleRaw.underlay.color}
          onPress={() => {
            this.props.disableWalletListModalVisibility()
            this.props.selectWallet(walletId, currencyCode, this.props.type)
            this.props.updateReceiveAddress(guiWallet.id, guiWallet.currencyCode)
          }}
        >
          <View style={styles.currencyRowContent}>
            <View style={styles.currencyRowNameTextWrap}>
              <T style={styles.currencyRowText}>{UTILS.cutOffText(guiWallet.name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap, { flexDirection: 'row' }]}>
              <T style={[styles.currencyRowText, styles.symbol]}>{symbol || ''}</T>
              <T style={styles.currencyRowText}>{denomAmount}</T>
            </View>
          </View>
        </TouchableHighlight>

        {this.renderTokens(guiWallet.id, enabledNativeBalances, guiWallet.currencyCode, combinedTokens)}
      </View>
    )
  }

  renderWalletRows (): Array<Node> {
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
    return <View>{this.renderWalletRows()}</View>
  }
}
