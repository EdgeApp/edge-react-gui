// @flow

// import _ from 'lodash'
import { bns } from 'biggystring'
import _ from 'lodash'
import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'

import { intl } from '../../../../locales/intl.js'
import type { CurrencyConverter, CustomTokenInfo, GuiDenomination, GuiWallet } from '../../../../types.js'
import { getCurrencyConverter } from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import {
  DIVIDE_PRECISION,
  calculateWalletFiatFromCrypto,
  cutOffText,
  decimalOrZero,
  getFiatSymbol,
  getSetCurrencyMultiplier,
  getSetTokenMultiplier,
  getWalletDefaultDenomProps,
  mergeTokensRemoveInvisible,
  truncateDecimals
} from '../../../utils.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../Settings/selectors.js'
import Text from '../FormattedText'
import { styles, stylesRaw } from './WalletListRowStyle.js'

export type WalletListRowOwnProps = {
  wallet: GuiWallet,
  onSelectWallet: (string, string) => void,
  excludedCurrencyCode?: string
}

export type WalletListRowStateProps = {
  fiatBalance: string,
  settings: Object,
  currencyConverter: CurrencyConverter
}

export type WalletListRowDispatchProps = {}

export type WalletListRowProps = WalletListRowOwnProps & WalletListRowStateProps & WalletListRowDispatchProps

export type WalletListRowState = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination,
  customTokens: Array<CustomTokenInfo>,
  fiatSymbol: string,
  isWalletFiatBalanceVisible: boolean,
  fiatBalance: string
}

export class WalletListRowComponent extends Component<WalletListRowProps, WalletListRowState> {
  constructor (props: WalletListRowProps) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { wallet, onSelectWallet, settings, fiatBalance, excludedCurrencyCode } = this.props
    const { currencyCode, name, id, enabledTokens, nativeBalances, metaTokens } = wallet
    const denominations = wallet.allDenominations[currencyCode]
    const multiplier = getSetCurrencyMultiplier(currencyCode, settings, denominations)

    const defaultDenomProps = getWalletDefaultDenomProps(wallet, settings, currencyCode)
    const cryptoSymbol = defaultDenomProps.symbol
    const preliminaryCryptoAmount = truncateDecimals(bns.div(wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const fiatSymbol = getFiatSymbol(wallet.isoFiatCurrencyCode) || ''
    // determine tokens to render
    const enabledTokenNativeBalances = {}
    for (const currency in nativeBalances) {
      if (currency !== currencyCode && enabledTokens.includes(currency)) {
        enabledTokenNativeBalances[currency] = nativeBalances[currency]
      }
    }

    const combinedTokens = mergeTokensRemoveInvisible(metaTokens, settings.customTokens)
    const tokensToRender = []
    for (const tokenCode in enabledTokenNativeBalances) {
      if (tokenCode !== currencyCode) {
        const index = _.findIndex(combinedTokens, token => token.currencyCode === tokenCode)
        if (index >= 0) {
          tokensToRender.push(tokenCode)
        }
      }
    }
    // remove wallet options that are illogical!
    let disabled = false
    if (excludedCurrencyCode) {
      // if wallets need to be excluded
      if (currencyCode === 'ETH') {
        // if it may have tokens
        if (currencyCode === excludedCurrencyCode) {
          // if Ethereum should be disabled
          if (enabledTokens.length === 0) {
            // if ETH is excluded but has no tokens
            return null // don't show it
          } else {
            // if ETH is excluded but DOES have tokens
            disabled = true
          }
        } else {
          // if a token should be disabled
          const excludedItemIndex = tokensToRender.indexOf(excludedCurrencyCode)
          if (excludedItemIndex > -1) tokensToRender.splice(excludedItemIndex, 1)
        }
      } else {
        // if it does not have tokens
        if (currencyCode === excludedCurrencyCode) return null
      }
    }
    return (
      <View style={styles.rowWrapper}>
        <TouchableHighlight
          style={[styles.rowContainer]}
          disabled={disabled}
          underlayColor={stylesRaw.underlay.color}
          onPress={() => onSelectWallet(id, currencyCode)}
        >
          <View style={styles.rowInfo}>
            <View style={[styles.rowLeft]}>
              <Text style={[styles.rowNameText]} numberOfLines={1}>
                {cutOffText(name, 34)}
              </Text>
            </View>
            <View style={[styles.rowRight]}>
              <View style={[styles.rowRightCryptoWrap]}>
                <Text style={[styles.rowRightCryptoText]}>
                  {finalCryptoAmount} {cryptoSymbol || ''}
                </Text>
              </View>
              <View style={[styles.rowRightFiatWrap]}>
                <Text style={styles.rowRightFiatText}>
                  {fiatSymbol} {fiatBalance}
                </Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
        {tokensToRender.map(tokenCode => this.renderTokenRow(tokenCode, enabledTokenNativeBalances))}
      </View>
    )
  }

  renderTokenRow = (currencyCode: string, metaTokenBalances: Object) => {
    const { settings, wallet, currencyConverter, onSelectWallet } = this.props
    const denomination = wallet.allDenominations[currencyCode]
    const multiplier = getSetTokenMultiplier(currencyCode, settings, denomination)
    const nativeBalance = metaTokenBalances[currencyCode]
    const cryptoAmount = bns.div(nativeBalance, multiplier, DIVIDE_PRECISION)
    const parentId = wallet.id
    let fiatValue = 0
    fiatValue = currencyConverter.convertCurrency(currencyCode, wallet.isoFiatCurrencyCode, cryptoAmount)
    const fiatBalance = intl.formatNumber(fiatValue, { toFixed: 2 }) || '0'
    const fiatSymbol = getFiatSymbol(wallet.isoFiatCurrencyCode) || ''
    return (
      <TouchableHighlight
        style={[styles.tokenRowContainer]}
        underlayColor={stylesRaw.underlay.color}
        key={currencyCode}
        onPress={() => onSelectWallet(parentId, currencyCode)}
      >
        <View style={styles.currencyRowContent}>
          <View style={styles.currencyRowNameTextWrap}>
            <Text style={styles.currencyRowText}>{currencyCode}</Text>
          </View>
          <View style={[styles.rowRight]}>
            <View style={[styles.rowRightCryptoWrap]}>
              <Text style={[styles.rowRightCryptoText]}>{cryptoAmount}</Text>
            </View>
            <View style={[styles.rowRightFiatWrap]}>
              <Text style={styles.rowRightFiatText}>
                {fiatSymbol} {fiatBalance}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

const mapStateToProps = (state: State, ownProps: WalletListRowOwnProps): WalletListRowStateProps => {
  const displayDenomination = getDisplayDenomination(state, ownProps.wallet.currencyCode)
  const exchangeDenomination = getExchangeDenomination(state, ownProps.wallet.currencyCode)
  const settings = state.ui.settings
  const fiatBalance = calculateWalletFiatFromCrypto(ownProps.wallet, state)
  const currencyConverter = getCurrencyConverter(state)
  return {
    displayDenomination,
    exchangeDenomination,
    fiatBalance,
    settings,
    currencyConverter
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListRowDispatchProps => {
  return {}
}

export const WalletListRowConnector = connect(mapStateToProps, mapDispatchToProps)(WalletListRowComponent)
