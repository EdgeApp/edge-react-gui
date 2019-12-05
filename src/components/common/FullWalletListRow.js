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
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/index'
import { calculateSettingsFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import styles, { customWalletListOptionsStyles, styles as styleRaw } from '../../styles/scenes/WalletListStyle.js'
import type { State } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, GuiDenomination } from '../../types/types.js'
import { decimalOrZero, getFiatSymbol, getObjectDiff, getYesterdayDateRoundDownHour, truncateDecimals } from '../../util/utils.js'
import { ProgressPie } from './ProgressPie.js'
import WalletListRowOptions from './WalletListRowOptions'

const DIVIDE_PRECISION = 18

export type OwnProps = {
  data: any, // TODO: Need to type this
  showBalance: boolean | Function
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
    return (
      <View>
        {this.props.data.item.id ? <FullWalletListRowConnected data={this.props.data} showBalance={this.props.showBalance} /> : <FullListRowEmptyData />}
      </View>
    )
  }
}

export type FullWalletListRowLoadedStateProps = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination,
  customTokens: Array<CustomTokenInfo>,
  walletFiatSymbol: string,
  settings: Object,
  exchangeRates: { [string]: number },
  walletsProgress: Object
}

export type FullWalletListRowLoadedOwnProps = {
  data: any,
  showBalance: boolean | Function
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
    const { data, walletFiatSymbol, settings, exchangeRates, showBalance } = this.props
    const progress = this.getProgress()
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
    const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
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
    const rateKey = `${currencyCode}_${walletData.isoFiatCurrencyCode}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null
    // Fiat Balance Formatting
    const fiatBalance = calculateSettingsFiatBalanceWithoutState(walletData, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceString = showBalance && exchangeRate ? `${walletFiatSymbol} ${fiatBalanceFormat}` : ''
    // Exhange Rate Formatting
    const exchangeRateFormat = exchangeRate ? intl.formatNumber(exchangeRate, { toFixed: 2 }) : null
    const exchangeRateString = exchangeRateFormat ? `${walletFiatSymbol} ${exchangeRateFormat}/${currencyCode}` : s.strings.no_exchange_rate
    // Yesterdays Percentage Difference Formatting
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
    const fiatExchangeRate = walletData.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${walletData.isoFiatCurrencyCode}`] : 1
    const yesterdayExchangeRate = yesterdayUsdExchangeRate * fiatExchangeRate
    const differenceYesterday = exchangeRate ? exchangeRate - yesterdayExchangeRate : null
    let differencePercentage = differenceYesterday ? (differenceYesterday / yesterdayExchangeRate) * 100 : null
    if (!yesterdayExchangeRate) {
      differencePercentage = ''
    }
    let differencePercentageString, differencePercentageStringStyle
    if (!exchangeRate || !differencePercentage || isNaN(differencePercentage)) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNeutral
      differencePercentageString = ''
    } else if (exchangeRate && differencePercentage && differencePercentage === 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNeutral
      differencePercentageString = `0.00%`
    } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNegative
      differencePercentageString = `- ${Math.abs(differencePercentage).toFixed(2)}%`
    } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferencePositive
      differencePercentageString = `+ ${Math.abs(differencePercentage).toFixed(2)}%`
    }

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
                <View style={styles.rowCurrencyLogoAndroid}>
                  <ProgressPie size={styles.rowCurrencyOverlaySize} color={'rgba(255, 255, 255, 0.75)'} progress={progress} />
                </View>
              </View>
              <View style={styles.walletDetailsContainer}>
                <View style={styles.walletDetailsRow}>
                  <T style={[styles.walletDetailsRowCurrency]}>{currencyCode}</T>
                  <T style={[styles.walletDetailsRowValue]}>{finalCryptoAmountString}</T>
                </View>
                <View style={styles.walletDetailsRow}>
                  <T style={[styles.walletDetailsRowName]}>{name}</T>
                  <T style={[styles.walletDetailsRowFiat]}>{fiatBalanceString}</T>
                </View>
                <View style={styles.walletDetailsRowLine} />
                <View style={styles.walletDetailsRow}>
                  <T style={[styles.walletDetailsRowExchangeRate]}>{exchangeRateString}</T>
                  <T style={[differencePercentageStringStyle]}>{differencePercentageString}</T>
                </View>
              </View>
              <View style={styles.rowOptionsWrap}>
                <WalletListRowOptions
                  currencyCode={walletData.currencyCode}
                  executeWalletRowOption={walletData.executeWalletRowOption}
                  walletKey={id}
                  customStyles={customWalletListOptionsStyles}
                />
              </View>
            </View>
          </TouchableHighlight>
          {this.renderTokenRow(id, enabledNativeBalances, progress)}
        </View>
      </View>
    )
  }

  renderTokenRow = (parentId: string, metaTokenBalances, progress: number) => {
    const tokens = []
    for (const property in metaTokenBalances) {
      if (metaTokenBalances.hasOwnProperty(property)) {
        if (property !== this.props.data.item.currencyCode) {
          tokens.push(
            <WalletListTokenRow
              parentId={parentId}
              currencyCode={property}
              key={property}
              walletFiatSymbol={this.props.walletFiatSymbol}
              balance={metaTokenBalances[property]}
              showBalance={this.props.showBalance}
              progress={progress}
            />
          )
        }
      }
    }
    return tokens
  }

  getProgress = () => {
    const { data } = this.props
    const walletId = data.item ? data.item.id : null
    const walletProgress = walletId ? this.props.walletsProgress[walletId] : 1

    if (walletProgress === 1) {
      return 1
    }
    if (walletProgress < 0.1) {
      return 0.1
    }
    if (walletProgress > 0.95) {
      return 0.95
    }
    return walletProgress
  }
}
const mapStateToProps = (state: State, ownProps: FullWalletListRowLoadedOwnProps): FullWalletListRowLoadedStateProps => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  const settings = state.ui.settings
  const customTokens = settings.customTokens
  const walletsProgress = state.ui.wallets.walletLoadingProgress

  const data = ownProps.data || null
  const wallet = data ? data.item : null
  const walletFiatSymbol = wallet ? getFiatSymbol(wallet.isoFiatCurrencyCode) : ''
  return {
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    displayDenomination,
    exchangeDenomination,
    customTokens,
    walletFiatSymbol,
    settings,
    exchangeRates: state.exchangeRates,
    walletsProgress
  }
}
const mapDispatchToProps = dispatch => ({
  selectWallet: (walletId: string, currencyCode): string => dispatch(selectWallet(walletId, currencyCode, Constants.WALLET_LIST_SCENE)),
  getEnabledTokensList: (walletId: string) => dispatch(getEnabledTokens(walletId))
})

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
