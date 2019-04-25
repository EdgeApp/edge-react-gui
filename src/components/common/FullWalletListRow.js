// @flow

import { bns } from 'biggystring'
import React, { Component } from 'react'
import { ActivityIndicator, Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'

import { getEnabledTokens, selectWallet } from '../../actions/WalletActions.js'
import WalletListTokenRow from '../../connectors/WalletListTokenRowConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import type { State } from '../../modules/ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/index'
import { calculateSettingsFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import styles, { styles as styleRaw } from '../../styles/scenes/WalletListStyle.js'
import type { CustomTokenInfo, GuiDenomination } from '../../types'
import { decimalOrZero, getFiatSymbol, getObjectDiff, truncateDecimals } from '../../util/utils.js'
import WalletListRowOptions from './WalletListRowOptions'

const DIVIDE_PRECISION = 18

export type OwnProps = {
  data: any // TODO: Need to type this
}

export default class FullWalletListRow extends Component<OwnProps> {
  constructor (props: OwnProps) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  shouldComponentUpdate (nextProps: OwnProps) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true,
      item: true
    })
    return !!diffElement
  }

  render () {
    return <View>{this.props.data.item.id ? <FullWalletListRowConnected data={this.props.data} /> : <FullListRowEmptyData />}</View>
  }
}

export type FullWalletListRowLoadedStateProps = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination,
  customTokens: Array<CustomTokenInfo>,
  fiatSymbol: string,
  settings: Object,
  exchangeRates: { [string]: number }
}

export type FullWalletListRowLoadedOwnProps = {
  data: any
}

export type FullWalletListRowLoadedDispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => void,
  getEnabledTokensList: (walletId: string) => void
}

export type FullWalletListRowLoadedComponentProps = FullWalletListRowLoadedStateProps & FullWalletListRowLoadedOwnProps & FullWalletListRowLoadedDispatchProps

class FullWalletListRowLoadedComponent extends Component<FullWalletListRowLoadedComponentProps> {
  _onPressSelectWallet = (walletId, currencyCode, publicAddress) => {
    this.props.selectWallet(walletId, currencyCode)
    // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
    // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
    if (currencyCode !== 'EOS' || (currencyCode === 'EOS' && publicAddress)) {
      Actions[Constants.TRANSACTION_LIST]({ params: 'walletList' })
    }
  }

  shouldComponentUpdate (nextProps) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true,
      item: true
    })
    return !!diffElement
  }

  UNSAFE_componentWillMount () {
    const walletId = this.props.data.item.id
    this.props.getEnabledTokensList(walletId)
  }

  render () {
    const { data, fiatSymbol, settings, exchangeRates } = this.props
    const walletData = data.item
    const currencyCode = walletData.currencyCode
    const denomination = this.props.displayDenomination
    const multiplier = denomination.multiplier
    const id = walletData.id
    const name = walletData.name || s.strings.string_no_name
    const symbol = denomination.symbol
    const symbolImageDarkMono = walletData.symbolImageDarkMono
    const preliminaryCryptoAmount = truncateDecimals(bns.div(walletData.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    // need to crossreference tokensEnabled with nativeBalances
    const enabledNativeBalances = {}
    const enabledTokens = walletData.enabledTokens

    const customTokens = this.props.customTokens
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token

      const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
      if (SYNCED_ACCOUNT_DEFAULTS[token] && walletData.enabledTokens.includes(token)) {
        // if hardcoded token
        isVisible = true // and enabled then make visible (overwrite customToken isVisible flag)
      }
      return isVisible
    })

    for (const prop in walletData.nativeBalances) {
      if (walletData.nativeBalances.hasOwnProperty(prop)) {
        if (prop !== currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
          enabledNativeBalances[prop] = walletData.nativeBalances[prop]
        }
      }
    }
    const fiatBalance = calculateSettingsFiatBalanceWithoutState(walletData, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceString = fiatSymbol + ' ' + fiatBalanceFormat
    return (
      <View style={[{ width: '100%' }]}>
        <View>
          <TouchableHighlight
            style={[styles.rowContainer]}
            underlayColor={styleRaw.walletRowUnderlay.color}
            onPress={() => this._onPressSelectWallet(id, currencyCode, walletData.receiveAddress.publicAddress)}
          >
            <View style={[styles.rowContent]}>
              <View style={styles.rowIconWrap}>
                {symbolImageDarkMono && <Image style={[styles.rowCurrencyLogoAndroid]} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
              </View>
              <View style={[styles.rowNameTextWrapAndroidIos]}>
                <T style={[styles.rowNameText]} numberOfLines={2} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                  {name}
                </T>
              </View>
              <View style={[styles.rowBalanceTextWrap]}>
                <View style={styles.rowBalanceAmount}>
                  <T style={[styles.rowBalanceAmountText]}>
                    {symbol || ''} {finalCryptoAmount}
                  </T>
                  <T style={[styles.rowBalanceAmountText]}>({fiatBalanceString})</T>
                </View>
              </View>
              <View style={styles.rowOptionsWrap}>
                <WalletListRowOptions currencyCode={walletData.currencyCode} executeWalletRowOption={walletData.executeWalletRowOption} walletKey={id} />
              </View>
            </View>
          </TouchableHighlight>
          {this.renderTokenRow(id, enabledNativeBalances)}
        </View>
      </View>
    )
  }

  renderTokenRow = (parentId: string, metaTokenBalances) => {
    const tokens = []
    for (const property in metaTokenBalances) {
      if (metaTokenBalances.hasOwnProperty(property)) {
        if (property !== this.props.data.item.currencyCode) {
          tokens.push(
            <WalletListTokenRow
              parentId={parentId}
              currencyCode={property}
              key={property}
              fiatSymbol={this.props.fiatSymbol}
              balance={metaTokenBalances[property]}
            />
          )
        }
      }
    }
    return tokens
  }
}
const mapStateToProps = (state: State, ownProps: FullWalletListRowLoadedOwnProps): FullWalletListRowLoadedStateProps => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  const settings = state.ui.settings
  const fiatSymbol = getFiatSymbol(settings.defaultFiat) || ''
  const customTokens = settings.customTokens
  return {
    displayDenomination,
    exchangeDenomination,
    customTokens,
    fiatSymbol,
    settings,
    exchangeRates: state.exchangeRates
  }
}
const mapDispatchToProps = dispatch => ({
  selectWallet: (walletId: string, currencyCode): string => dispatch(selectWallet(walletId, currencyCode, Constants.WALLET_LIST_SCENE)),
  getEnabledTokensList: (walletId: string) => dispatch(getEnabledTokens(walletId))
})

// $FlowFixMe
const FullWalletListRowConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(FullWalletListRowLoadedComponent)

class FullListRowEmptyData extends Component<any> {
  render () {
    return (
      <TouchableHighlight style={[styles.rowContainer, styles.emptyRow]} underlayColor={styleRaw.emptyRowUnderlay.color}>
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <ActivityIndicator style={{ height: 18, width: 18 }} />
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
