// @flow

import slowlog from 'react-native-slowlog'
import { bns } from 'biggystring'
import _ from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Platform, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { intl } from '../../../../../../locales/intl'
import s from '../../../../../../locales/strings.js'
import type { CustomTokenInfo, GuiDenomination } from '../../../../../../types'
import { cutOffText, decimalOrZero, truncateDecimals, getObjectDiff } from '../../../../../utils.js'
import T from '../../../../components/FormattedText'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import { getEnabledTokens, selectWallet } from '../../../../Wallets/action.js'
import styles, { styles as styleRaw } from '../../style.js'
import WalletListRowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRowConnector.js'

const DIVIDE_PRECISION = 18

export type OwnProps = {
  data: any, // TODO: Need to type this
  sortHandlers: any,
  customTokens: Array<CustomTokenInfo>
}

type StateProps = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination
}

type DispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => any,
  getEnabledTokensList: (walletId: string) => any
}

type Props = OwnProps & StateProps & DispatchProps

export default class FullWalletListRow extends Component<OwnProps> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  shouldComponentUpdate (nextProps: OwnProps) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true, item: true
    })
    return !!diffElement
  }

  render () {
    return (
      <View>
        {this.props.data.item.id ? (
          <FullWalletListRowConnected data={this.props.data} customTokens={this.props.customTokens} />
        ) : (
          <FullListRowEmptyData />
        )}
      </View>
    )
  }
}

class FullWalletListRowConnect extends Component<Props> {
  _onPressSelectWallet = (walletId, currencyCode) => {
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({ params: 'walletList' })
  }

  shouldComponentUpdate (nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true, item: true
    })
    return !!diffElement
  }

  componentWillMount () {
    const walletId = this.props.data.item.id
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

    const customTokens = this.props.customTokens
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token
      const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
      return isVisible
    })

    for (const prop in walletData.nativeBalances) {
      if (walletData.nativeBalances.hasOwnProperty(prop)) {
        if (prop !== currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
          enabledNativeBalances[prop] = walletData.nativeBalances[prop]
        }
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

              <WalletListRowOptions
                currencyCode={walletData.currencyCode}
                executeWalletRowOption={walletData.executeWalletRowOption}
                walletKey={id}
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
      if (metaTokenBalances.hasOwnProperty(property)) {
        if (property !== this.props.data.item.currencyCode) {
          tokens.push(<WalletListTokenRow parentId={parentId} currencyCode={property} key={property} balance={metaTokenBalances[property]} />)
        }
      }
    }
    return tokens
  }
}
const mapStateToProps = (state, ownProps): StateProps => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  const customTokens = state.ui.settings.customTokens
  return {
    displayDenomination,
    exchangeDenomination,
    customTokens
  }
}
const mapDispatchToProps = dispatch => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode)),
  getEnabledTokensList: walletId => dispatch(getEnabledTokens(walletId))
})

// $FlowFixMe
const FullWalletListRowConnected = connect(mapStateToProps, mapDispatchToProps)(FullWalletListRowConnect)

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
