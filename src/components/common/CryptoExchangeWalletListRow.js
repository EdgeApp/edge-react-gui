// @flow
import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import _ from 'lodash'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import { intl } from '../../locales/intl'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { calculateWalletFiatBalance } from '../../modules/UI/selectors.js'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/indexStyles'
import type { State } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { decimalOrZero, getCurrencyAccountFiatBalanceFromWallet, getFiatSymbol, truncateDecimals } from '../../util/utils.js'
import { CryptoExchangeWalletListTokenRow } from './CryptoExchangeWalletListTokenRow.js'

type Props = {
  wallet: GuiWallet,
  onPress(GuiWallet): void,
  excludedCurrencyCode: Array<string>,
  onTokenPress({ id: string, currencyCode: string }): void,
  state: State,
  excludedTokens: Array<string>,
  disableZeroBalance: boolean
}
type LocalState = {
  fiatBalance: string,
  fiatSymbol: string,
  cryptoBalance: string,
  cryptoSymbol: string,
  enabledNativeBalances: Object,
  denomination?: EdgeDenomination
}

const DIVIDE_PRECISION = 18

class CryptoExchangeWalletListRow extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    this.state = {
      fiatBalance: '',
      cryptoBalance: '',
      cryptoSymbol: '',
      enabledNativeBalances: {},
      fiatSymbol: ''
    }
  }
  componentDidMount () {
    this.setUp(this.props)
  }
  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    this.setUp(nextProps)
  }
  setUp = (props: Props) => {
    const denomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenomination(props.state, props.wallet.currencyCode)
    const multiplier = denomination.multiplier
    const preliminaryCryptoAmount = truncateDecimals(bns.div(props.wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const cryptoBalance = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const enabledTokens = props.wallet.enabledTokens
    const wallet = props.wallet

    const customTokens = props.state.ui.settings.customTokens
    const enabledNativeBalances = {}
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token
      const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) {
        isVisible = false
      }
      return isVisible
    })

    for (const prop in props.wallet.nativeBalances) {
      if (props.wallet.nativeBalances.hasOwnProperty(prop)) {
        if (prop !== props.wallet.currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
          enabledNativeBalances[prop] = props.wallet.nativeBalances[prop]
        }
      }
    }
    this.setState({
      denomination,
      fiatBalance: calculateWalletFiatBalance(props.wallet, props.state),
      fiatSymbol: wallet ? getFiatSymbol(wallet.isoFiatCurrencyCode) : '',
      cryptoBalance,
      cryptoSymbol: denomination.symbol,
      enabledNativeBalances
    })
  }
  onPress = () => {
    if (this.props.disableZeroBalance && this.state.cryptoBalance === '0' && this.state.fiatBalance === '0') return
    if (!this.props.excludedCurrencyCode.includes(this.props.wallet.currencyCode)) {
      this.props.onPress(this.props.wallet)
    }
  }
  renderTokens = () => {
    if (this.props.wallet.enabledTokens.length > 0) {
      const tokens = []
      const metaTokenBalances = this.state.enabledNativeBalances
      for (const property in metaTokenBalances) {
        if (metaTokenBalances.hasOwnProperty(property)) {
          if (property !== this.props.wallet.currencyCode) {
            const formattedFiatBalance = getCurrencyAccountFiatBalanceFromWallet(this.props.wallet, property, this.props.state)
            if (!this.state.denomination || !this.state.denomination.multiplier) {
              return []
            }
            const token = this.props.wallet.metaTokens.find(item => item.currencyCode === property)
            const { name } = this.props.wallet
            const tokenImage = token ? token.symbolImage : ''
            const nativeAmount = metaTokenBalances[property]
            const disabled = this.props.excludedCurrencyCode.includes(property) || this.props.disableZeroBalance
            if (property !== this.props.excludedCurrencyCode && !this.props.excludedTokens.includes(property)) {
              tokens.push(
                <CryptoExchangeWalletListTokenRow
                  key={property}
                  parentId={this.props.wallet.id}
                  onPress={this.props.onTokenPress}
                  currencyCode={property}
                  fiatSymbol={this.state.fiatSymbol}
                  fiatBalance={formattedFiatBalance}
                  name={name}
                  image={tokenImage}
                  nativeAmount={nativeAmount}
                  parentCryptoBalance={this.state.cryptoBalance}
                  disabled={disabled}
                />
              )
            }
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
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsRow}>
                <FormattedText style={[styles.walletDetailsRowCurrency]}>{wallet.currencyCode}</FormattedText>
                <FormattedText style={[styles.walletDetailsRowValue]}>
                  {this.state.cryptoSymbol} {this.state.cryptoBalance}
                </FormattedText>
              </View>
              <View style={styles.walletDetailsRow}>
                <FormattedText style={[styles.walletDetailsRowName]}>{wallet.name}</FormattedText>
                <FormattedText style={[styles.walletDetailsRowFiat]}>
                  {this.state.fiatSymbol} {this.state.fiatBalance}
                </FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
        <View styles={styles.rowContainerBottom}>{this.renderTokens()}</View>
      </View>
    )
  }
}

export { CryptoExchangeWalletListRow }
