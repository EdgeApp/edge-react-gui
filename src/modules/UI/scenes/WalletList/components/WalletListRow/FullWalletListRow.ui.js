// @flow

import React, {Component} from 'react'
import strings from '../../../../../../locales/default'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import styles, {styles as styleRaw} from '../../style.js'
import T from '../../../../components/FormattedText'
import RowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRowConnector.js'
import {border as b,
  cutOffText,
  truncateDecimals,
  decimalOrZero,
  mergeTokens
} from '../../../../../utils.js'
import {
  selectWallet,
  getEnabledTokens
} from '../../../../Wallets/action.js'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import platform from '../../../../../../theme/variables/platform.js'
import type {GuiDenomination} from '../../../../../../types'
import type {AbcMetaToken} from 'airbitz-core-types'
const DIVIDE_PRECISION = 18

export type FullWalletRowProps = {
  data: any, // TODO: Need to type this
  sortableMode: boolean,
  customTokens: Array<AbcMetaToken>,
  sortHandlers: any
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
  mergedTokens: Array<AbcMetaToken>
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
          <FullWalletListRowConnect data={this.props.data} customTokens={this.props.customTokens} />
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
    Actions.transactionList({params: 'walletList'})
  }

  componentWillMount () {
    const walletId = this.props.data.item.id
    const walletTokens = this.props.data.item.metaTokens
    const customTokens = this.props.customTokens || []
    const mergedTokens = mergeTokens(walletTokens, customTokens)
    this.setState({
      mergedTokens
    })
    this.props.getEnabledTokensList(walletId)
  }

  render () {
    const {data} = this.props
    const walletData = data.item
    const currencyCode = walletData.currencyCode
    const cryptocurrencyName = walletData.currencyNames[currencyCode]
    const denomination = this.props.displayDenomination
    const multiplier = denomination.multiplier
    const id = walletData.id
    const name = walletData.name || strings.enUS['string_no_name']
    const symbol = denomination.symbol
    let symbolImageDarkMono = walletData.symbolImageDarkMono
    let preliminaryCryptoAmount = truncateDecimals(bns.div(walletData.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    let finalCryptoAmount = decimalOrZero(preliminaryCryptoAmount, 6) // check if infinitesimal (would display as zero), cut off trailing zeroes

    // need to crossreference tokensEnabled with nativeBalances
    let enabledNativeBalances = {}
    const enabledTokens = walletData.enabledTokens

    for (let prop in walletData.nativeBalances) {
      if ((prop !== currencyCode) && (enabledTokens.indexOf(prop) >= 0)) {
        enabledNativeBalances[prop] = walletData.nativeBalances[prop]
      }
    }

    return (
      <View style={[{width: platform.deviceWidth}, b()]}>
          <View>
            <TouchableHighlight
              style={[styles.rowContainer]}
              underlayColor={styleRaw.walletRowUnderlay.color}
              {...this.props.sortHandlers}
              onPress={() => this._onPressSelectWallet(id, currencyCode)}
            >
              <View style={[styles.rowContent]}>
                <View style={[styles.rowNameTextWrap, b()]}>
                {(Platform.OS === 'ios')
                && (
                  <View style={[styles.rowNameTextWrapIOS, b()]}>
                    <T style={[styles.rowNameText, b()]} numberOfLines={1}>
                    {symbolImageDarkMono
                      && <Image style={[styles.rowCurrencyLogoIOS, b()]} transform={[{translateY: 6}]} source={{uri: symbolImageDarkMono}} />
                    }  {cutOffText(name, 34)}</T>
                </View>
                )}
                {(Platform.OS === 'android')
                  && (
                    <View style={[styles.rowNameTextWrapAndroid, b()]}>
                    {symbolImageDarkMono
                      && <Image style={[styles.rowCurrencyLogoAndroid, b()]} source={{uri: symbolImageDarkMono}} />
                    }
                    <T style={[styles.rowNameText, b()]} numberOfLines={1}>
                      {cutOffText(name, 34)}</T>
                    </View>
                  )}
                </View>
                <View style={[styles.rowBalanceTextWrap]}>
                  <T style={[styles.rowBalanceAmountText]}>
                    {finalCryptoAmount}
                  </T>
                  <T style={[styles.rowBalanceDenominationText]}>{cryptocurrencyName} ({symbol || ''})</T>
                </View>
                <RowOptions
                  sortableMode={this.props.sortableMode}
                  currencyCode={walletData.currencyCode}
                  executeWalletRowOption={walletData.executeWalletRowOption}
                  walletKey={id} archived={walletData.archived}
                />
              </View>
            </TouchableHighlight>
            {this.renderTokenRow(id, enabledNativeBalances)}
          </View>
      </View>
    )
  }

  renderTokenRow = (parentId, metaTokenBalances) => {
    let tokens = []
    for (let property in metaTokenBalances) {
      if (property !== this.props.data.item.currencyCode) {
        tokens.push(
          <WalletListTokenRow
            parentId={parentId}
            currencyCode={property}
            key={property}
            balance={metaTokenBalances[property]}
            />)
      }
    }
    return tokens
  }
}
const mapStateToProps = (state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  const wallets = state.ui.wallets.byId
  return {
    displayDenomination,
    exchangeDenomination,
    wallets
  }
}
const mapDispatchToProps = (dispatch) => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode)),
  getEnabledTokensList: (walletId) => dispatch(getEnabledTokens(walletId))
})

// $FlowFixMe
export const FullWalletListRowConnect = connect(mapStateToProps, mapDispatchToProps)(FullWalletListRow)

class FullListRowEmptyData extends Component<any, State> {
  render () {
    return (
      <TouchableHighlight
        style={[
          styles.rowContainer,
          styles.emptyRow
        ]}
        underlayColor={styleRaw.emptyRowUnderlay.color}
        {...this.props.sortHandlers}
      >
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <ActivityIndicator style={{height: 18, width: 18}}/>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
