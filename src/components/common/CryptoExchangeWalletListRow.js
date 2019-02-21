// @flow
import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import _ from 'lodash'
import React, { Component } from 'react'
import { Image, Text, TouchableHighlight, View } from 'react-native'

import { intl } from '../../locales/intl'
import type { State } from '../../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { calculateSettingsFiatBalance } from '../../modules/UI/selectors.js'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/indexStyles'
import type { GuiWallet } from '../../types'
import { decimalOrZero, getCurrencyAccountFiatBalanceFromWallet, getFiatSymbol, truncateDecimals } from '../../util/utils.js'
import { CryptoExchangeWalletListTokenRow } from './CryptoExchangeWalletListTokenRow.js'

type Props = {
  wallet: GuiWallet,
  onPress(GuiWallet): void,
  onTokenPress({ id: string, currencyCode: string }): void,
  state: State
}
type LocalState = {
  fiatBalance: string,
  fiatSymbol: string,
  isWalletFiatBalanceVisible: boolean,
  cryptoBalance: string,
  cryptoSymbol: string,
  enabledNativeBalances: Object
}

const DIVIDE_PRECISION = 18

class CryptoExchangeWalletListRow extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    this.state = {
      fiatBalance: '',
      isWalletFiatBalanceVisible: true,
      cryptoBalance: '',
      cryptoSymbol: '',
      enabledNativeBalances: {},
      fiatSymbol: ''
    }
  }
  componentDidMount () {
    const settings = this.props.state.ui.settings
    const denomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenomination(this.props.state, this.props.wallet.currencyCode)
    const multiplier = denomination.multiplier
    const preliminaryCryptoAmount = truncateDecimals(bns.div(this.props.wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const cryptoBalance = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const enabledTokens = this.props.wallet.enabledTokens

    const customTokens = this.props.state.ui.settings.customTokens
    const enabledNativeBalances = {}
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token
      const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
      return isVisible
    })

    for (const prop in this.props.wallet.nativeBalances) {
      if (this.props.wallet.nativeBalances.hasOwnProperty(prop)) {
        if (prop !== this.props.wallet.currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
          enabledNativeBalances[prop] = this.props.wallet.nativeBalances[prop]
        }
      }
    }
    this.setState({
      fiatBalance: calculateSettingsFiatBalance(this.props.wallet, this.props.state),
      fiatSymbol: getFiatSymbol(settings.defaultFiat) || '',
      isWalletFiatBalanceVisible: this.props.state.ui.settings.isWalletFiatBalanceVisible,
      cryptoBalance,
      cryptoSymbol: denomination.symbol,
      enabledNativeBalances
    })
  }

  onPress = () => {
    this.props.onPress(this.props.wallet)
  }
  renderBalances = () => {
    if (this.state.isWalletFiatBalanceVisible) {
      return (
        <View style={styles.containerRight}>
          <View style={styles.holderView}>
            <Text style={styles.balanceTextStyle}>
              {this.state.cryptoBalance} {this.state.cryptoSymbol}
            </Text>
            <Text style={styles.balanceTextStyle}>
              {this.state.fiatSymbol} {this.state.fiatBalance}
            </Text>
          </View>
        </View>
      )
    }
    return <View style={styles.containerRight} />
  }
  renderTokens = () => {
    if (this.props.wallet.enabledTokens.length > 0) {
      const tokens = []
      const metaTokenBalances = this.state.enabledNativeBalances
      for (const property in metaTokenBalances) {
        if (metaTokenBalances.hasOwnProperty(property)) {
          if (property !== this.props.wallet.currencyCode) {
            const formattedFiatBalance = getCurrencyAccountFiatBalanceFromWallet(this.props.wallet, property, this.props.state)
            tokens.push(
              <CryptoExchangeWalletListTokenRow
                key={property}
                parentId={this.props.wallet.id}
                onPress={this.props.onTokenPress}
                currencyCode={property}
                fiatSymbol={this.state.fiatSymbol}
                fiatBalance={formattedFiatBalance}
                cryptoBalance={metaTokenBalances[property]}
                isWalletFiatBalanceVisible={this.state.isWalletFiatBalanceVisible}
              />
            )
          }
        }
      }
      return tokens
    }
    return null
  }
  render () {
    const { wallet } = this.props
    return (
      <View style={styles.container}>
        <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              <Image style={styles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode={'contain'} />
            </View>
            <View style={styles.containerCenter}>
              <FormattedText>
                {wallet.name} ({wallet.currencyCode})
              </FormattedText>
            </View>
            {this.renderBalances()}
          </View>
        </TouchableHighlight>
        <View styles={styles.rowContainerBottom}>{this.renderTokens()}</View>
      </View>
      // enabledTokens
    )
  }
}

export { CryptoExchangeWalletListRow }
