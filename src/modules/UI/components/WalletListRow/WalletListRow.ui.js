// @flow

// import _ from 'lodash'
import { bns } from 'biggystring'
import _ from 'lodash'
import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'

import { intl } from '../../../../locales/intl.js'
import type { CustomTokenInfo, GuiDenomination } from '../../../../types.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import {
  DIVIDE_PRECISION,
  calculateFiatFromCryptoCurrency,
  cutOffText,
  decimalOrZero,
  getFiatSymbol,
  getWalletDefaultDenomProps,
  truncateDecimals
} from '../../../utils.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../Settings/selectors.js'
import Text from '../FormattedText'
import { styles, stylesRaw } from './WalletListRowStyle.js'

export type WalletListRowOwnProps = {
  wallet: any,
  onSelectWallet: (string, string) => void  
}

export type WalletListRowStateProps = {
  fiatBalance: string,
  settings: Object
}

export type WalletListRowDispatchProps = {
}

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
    const { wallet, onSelectWallet, settings, fiatBalance } = this.props
    const { currencyCode, name, id /*, enabledTokens, nativeBalances */ } = wallet
    const denomination = wallet.allDenominations[currencyCode]
    // const denomProps = getWalletDefaultDenomProps(wallet, settings, currencyCode)
    let multiplier
    if (denomination) {
      multiplier = denomination[settings[currencyCode].denomination].multiplier
    } else {
      const customDenom = _.find(settings.customTokens, item => item.currencyCode === currencyCode)
      if (customDenom && customDenom.denominations && customDenom.denominations[0]) {
        multiplier = customDenom.denominations[0].multiplier
      } else {
        return // let it blow up. It shouldn't be attempting to display
      }
    }

    // need to crossreference tokensEnabled with nativeBalances
    /* const enabledNativeBalances = {}

    for (const prop in nativeBalances) {
      if (prop !== currencyCode && enabledTokens.includes(prop)) {
        enabledNativeBalances[prop] = nativeBalances[prop]
      }
    } */
    const defaultDenomProps = getWalletDefaultDenomProps(wallet, settings, currencyCode)
    const cryptoSymbol = defaultDenomProps.symbol
    const preliminaryCryptoAmount = truncateDecimals(bns.div(wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const fiatSymbol = getFiatSymbol(settings.defaultFiat) || ''

    return (
      <View style={styles.rowWrapper}>
        <TouchableHighlight style={[styles.rowContainer]} underlayColor={stylesRaw.underlay.color} onPress={() => onSelectWallet(id, currencyCode)}>
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
                <Text style={styles.rowRightFiatText}>{`${fiatSymbol} ${fiatBalance}`}</Text>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const mapStateToProps = (state: State, ownProps: WalletListRowOwnProps): WalletListRowStateProps => {
  const displayDenomination = getDisplayDenomination(state, ownProps.wallet.currencyCode)
  const exchangeDenomination = getExchangeDenomination(state, ownProps.wallet.currencyCode)
  const settings = state.ui.settings
  const fiatBalance = calculateFiatFromCryptoCurrency(ownProps.wallet, state)
  return {
    displayDenomination,
    exchangeDenomination,
    fiatBalance,
    settings
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListRowDispatchProps => {
  return {}
}

export const WalletListRowConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListRowComponent)
