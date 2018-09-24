// @flow

// import _ from 'lodash'
import { bns } from 'biggystring'
import _ from 'lodash'
import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import { intl } from '../../../../locales/intl.js'
import type { CustomTokenInfo, GuiDenomination, GuiWallet } from '../../../../types.js'
import {
  DIVIDE_PRECISION,
  cutOffText,
  decimalOrZero,
  getFiatSymbol,
  getSettingsCurrencyMultiplier,
  getWalletDefaultDenomProps,
  mergeTokensRemoveInvisible,
  truncateDecimals
} from '../../../utils.js'
import Text from '../FormattedText'
import { styles, stylesRaw } from './WalletListRowStyle.js'
import { WalletListTokenRowConnector } from './WalletListTokenRowConnector.js'

export type WalletListRowOwnProps = {
  wallet: GuiWallet,
  onSelectWallet: (string, string) => void,
  excludedCurrencyCode?: string
}

export type WalletListRowStateProps = {
  fiatBalance: string,
  settings: Object
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
    const multiplier = getSettingsCurrencyMultiplier(currencyCode, settings, denominations)

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
          tokensToRender.push({
            tokenCode,
            key: tokenCode // add in 'key' to suppress warning
          })
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
        {tokensToRender.map(token => {
          return (
            <WalletListTokenRowConnector
              wallet={wallet}
              currencyCode={token.tokenCode}
              metaTokenBalances={enabledTokenNativeBalances}
              onSelectWallet={onSelectWallet}
              key={token.key}
            />
          )
        })}
      </View>
    )
  }
}
