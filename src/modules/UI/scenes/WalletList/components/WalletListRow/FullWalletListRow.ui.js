// @flow

import { bns } from 'biggystring'
import _ from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Platform, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { intl } from '../../../../../../locales/intl'
import s from '../../../../../../locales/strings.js'
import type { CustomTokenInfo, GuiDenomination } from '../../../../../../types'
import { cutOffText, decimalOrZero, mergeTokensRemoveInvisible, truncateDecimals } from '../../../../../utils.js'
import T from '../../../../components/FormattedText'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import { getEnabledTokens, selectWallet } from '../../../../Wallets/action.js'
import styles, { styles as styleRaw } from '../../style.js'
import RowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRowConnector.js'

const DIVIDE_PRECISION = 18

export type FullWalletRowProps = {
  data: any, // TODO: Need to type this
  sortableMode: boolean,
  customTokens: Array<CustomTokenInfo>,
  sortHandlers: any,
  settings: Object
}

type InternalProps = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination
}

type DispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => any,
  getEnabledTokensList: (walletId: string) => any
}

type Props = FullWalletRowProps & InternalProps & DispatchProps

type State = {
  mergedTokens: Array<any>
}

class FullWalletRow extends Component<Props, State> {
  constructor (props: any) {
    super(props)
    this.state = {
      mergedTokens: []
    }
  }
  render () {
    return (
      <View>
        {this.props.data.item.id ? (
          <FullWalletListRowConnect settings={this.props.settings} data={this.props.data} customTokens={this.props.customTokens} />
        ) : (
          <FullListRowEmptyData />
        )}
      </View>
    )
  }
}

export default FullWalletRow

class FullWalletListRow extends Component<Props, State> {
  _onPressSelectWallet = (walletId, currencyCode) => {
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({ params: 'walletList' })
  }

  componentWillMount () {
    const walletId = this.props.data.item.id
    const walletTokens = this.props.data.item.metaTokens
    const customTokens = this.props.customTokens || []
    const mergedTokens = mergeTokensRemoveInvisible(walletTokens, customTokens)
    this.setState({
      mergedTokens
    })
    this.props.getEnabledTokensList(walletId)
  }

  render () {
    const { data } = this.props
    const walletData = data.item
    const currencyCode = walletData.currencyCode
    const cryptocurrencyName = walletData.currencyNames[currencyCode]
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

    const customTokens = this.props.settings.customTokens
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token
      const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
      return isVisible
    })

    for (const prop in walletData.nativeBalances) {
      if (prop !== currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
        enabledNativeBalances[prop] = walletData.nativeBalances[prop]
      }
    }

    return (
      <View style={[{ width: '100%' }]}>
        <View>
          <TouchableHighlight
            style={[styles.rowContainer]}
            underlayColor={styleRaw.walletRowUnderlay.color}
            {...this.props.sortHandlers}
            onPress={() => this._onPressSelectWallet(id, currencyCode)}
          >
            <View style={[styles.rowContent]}>
              <View style={[styles.rowNameTextWrap]}>
                {Platform.OS === 'ios' && (
                  <View style={[styles.rowNameTextWrapIOS]}>
                    <T style={[styles.rowNameText]} numberOfLines={1}>
                      {symbolImageDarkMono && (
                        <Image style={[styles.rowCurrencyLogoIOS]} transform={[{ translateY: 6 }]} source={{ uri: symbolImageDarkMono }} />
                      )}{' '}
                      {cutOffText(name, 34)}
                    </T>
                  </View>
                )}
                {Platform.OS === 'android' && (
                  <View style={[styles.rowNameTextWrapAndroid]}>
                    {symbolImageDarkMono && <Image style={[styles.rowCurrencyLogoAndroid]} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
                    <T style={[styles.rowNameText]} numberOfLines={1}>
                      {cutOffText(name, 34)}
                    </T>
                  </View>
                )}
              </View>

              <View style={[styles.rowBalanceTextWrap]}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <T style={[styles.rowBalanceAmountText]}>{finalCryptoAmount}</T>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <T style={[styles.rowBalanceDenominationText]}>{cryptocurrencyName} (</T>
                  <T style={[styles.rowBalanceDenominationText, styles.symbol]}>{symbol || ''}</T>
                  <T style={[styles.rowBalanceDenominationText]}>)</T>
                </View>
              </View>

              <RowOptions
                sortableMode={this.props.sortableMode}
                currencyCode={walletData.currencyCode}
                executeWalletRowOption={walletData.executeWalletRowOption}
                walletKey={id}
                archived={walletData.archived}
              />
            </View>
          </TouchableHighlight>
          {this.renderTokenRow(id, enabledNativeBalances)}
        </View>
      </View>
    )
  }

  renderTokenRow = (parentId, metaTokenBalances) => {
    const tokens = []
    for (const property in metaTokenBalances) {
      if (property !== this.props.data.item.currencyCode) {
        tokens.push(<WalletListTokenRow parentId={parentId} currencyCode={property} key={property} balance={metaTokenBalances[property]} />)
      }
    }
    return tokens
  }
}
const mapStateToProps = (state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  const wallets = state.ui.wallets.byId
  const customTokens = state.ui.settings.customTokens
  return {
    displayDenomination,
    exchangeDenomination,
    wallets,
    customTokens
  }
}
const mapDispatchToProps = dispatch => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode)),
  getEnabledTokensList: walletId => dispatch(getEnabledTokens(walletId))
})

// $FlowFixMe
export const FullWalletListRowConnect = connect(mapStateToProps, mapDispatchToProps)(FullWalletListRow)

class FullListRowEmptyData extends Component<any, State> {
  render () {
    return (
      <TouchableHighlight style={[styles.rowContainer, styles.emptyRow]} underlayColor={styleRaw.emptyRowUnderlay.color} {...this.props.sortHandlers}>
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <ActivityIndicator style={{ height: 18, width: 18 }} />
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
