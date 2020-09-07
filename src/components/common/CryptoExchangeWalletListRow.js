// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import _ from 'lodash'
import * as React from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'

import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { decimalOrZero, getFiatSymbol, truncateDecimals } from '../../util/utils.js'
import { type TokenSelectObject, CryptoExchangeWalletListTokenRow } from './CryptoExchangeWalletListTokenRow.js'

export type StateProps = {
  denomination: EdgeDenomination,
  customTokens: Array<CustomTokenInfo>,
  settings: Object,
  exchangeRates: { [string]: number },
  headerLabel?: string
}

export type OwnProps = {
  wallet: GuiWallet,
  onPress(GuiWallet): void,
  excludedCurrencyCode: Array<string>,
  onTokenPress(TokenSelectObject): void,
  excludedTokens: Array<string>,
  disableZeroBalance: boolean,
  searchFilter: string,
  currencyCodeFilter: string,
  isMostRecentWallet?: boolean,
  allowedCurrencyCodes?: Array<string>,
  excludeCurrencyCodes?: Array<string>
}

type LocalState = {
  fiatBalance: string,
  fiatSymbol: string,
  cryptoBalance: string,
  cryptoSymbol: string,
  enabledNativeBalances: Object
}

type Props = StateProps & OwnProps

const DIVIDE_PRECISION = 18

export class CryptoExchangeWalletListRow extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      fiatBalance: '',
      cryptoBalance: '',
      cryptoSymbol: '',
      enabledNativeBalances: {},
      fiatSymbol: ''
    }
  }

  componentDidMount() {
    this.setUp(this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    this.setUp(nextProps)
  }

  setUp = (props: Props) => {
    const { denomination, customTokens, settings, exchangeRates } = this.props
    const multiplier = denomination.multiplier
    const preliminaryCryptoAmount = truncateDecimals(bns.div(props.wallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const cryptoBalance = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const enabledTokens = props.wallet.enabledTokens
    const wallet = props.wallet

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
      fiatBalance: calculateWalletFiatBalanceWithoutState(wallet, wallet.currencyCode, settings, exchangeRates),
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
    const { wallet, settings, exchangeRates, searchFilter, isMostRecentWallet, currencyCodeFilter, allowedCurrencyCodes, excludeCurrencyCodes } = this.props
    if (this.props.wallet.enabledTokens.length > 0) {
      const tokens = []
      const metaTokenBalances = this.state.enabledNativeBalances
      for (const property in metaTokenBalances) {
        if (metaTokenBalances.hasOwnProperty(property)) {
          if (property !== this.props.wallet.currencyCode) {
            // Token Filters
            const checkAllowedCurrencyCodes = allowedCurrencyCodes
              ? allowedCurrencyCodes.find(currencyCode => {
                  const [currency, token] = currencyCode.split(':')
                  return currency === property || token === property
                })
              : true
            const checkExcludeCurrencyCodes = excludeCurrencyCodes
              ? excludeCurrencyCodes.find(currencyCode => {
                  const [currency, token] = currencyCode.split(':')
                  return currency === property || token === property
                })
              : false
            const { name } = this.props.wallet
            const standardToken = this.props.wallet.metaTokens.find(item => item.currencyCode === property)
            const customToken = this.props.customTokens.find(item => item.currencyCode === property)
            const token = standardToken || customToken
            const searchFilterLowerCase = searchFilter.toLowerCase()
            const walletNameString = name.toLowerCase()
            const currencyNameString = token ? token.currencyName.toLowerCase() : ''
            const currencyCodeString = token ? token.currencyCode.toLowerCase() : ''
            const basicFilter =
              searchFilterLowerCase === '' ||
              walletNameString.includes(searchFilterLowerCase) ||
              currencyNameString.includes(searchFilterLowerCase) ||
              currencyCodeString.includes(searchFilterLowerCase)
            const excludedCurrencyFilter = property !== this.props.excludedCurrencyCode && !this.props.excludedTokens.includes(property)
            const searchInputFilter = excludedCurrencyFilter && basicFilter
            const mostRecentUsedCheck = isMostRecentWallet ? currencyCodeString === currencyCodeFilter.toLowerCase() : true

            if (searchFilter !== '' ? searchInputFilter : mostRecentUsedCheck && checkAllowedCurrencyCodes && !checkExcludeCurrencyCodes) {
              const formattedFiatBalance = calculateWalletFiatBalanceWithoutState(wallet, property, settings, exchangeRates)
              if (!this.props.denomination || !this.props.denomination.multiplier) {
                return []
              }
              const tokenImage = token && token.symbolImage ? token.symbolImage : ''
              const nativeAmount = metaTokenBalances[property]
              const disabled = this.props.excludedCurrencyCode.includes(property) || this.props.disableZeroBalance
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

  renderWallet = () => {
    const { wallet, searchFilter, isMostRecentWallet, currencyCodeFilter, allowedCurrencyCodes, excludeCurrencyCodes } = this.props
    const checkAllowedCurrencyCodes = allowedCurrencyCodes ? allowedCurrencyCodes.find(currencyCode => currencyCode === wallet.currencyCode) : true
    const checkExcludeCurrencyCodes = excludeCurrencyCodes ? excludeCurrencyCodes.find(currencyCode => currencyCode === wallet.currencyCode) : false
    const searchFilterLowerCase = searchFilter.toLowerCase()
    const nameString = wallet.name.toLowerCase()
    const currencyNameString = wallet.currencyNames[wallet.currencyCode].toLowerCase()
    const currencyCodeString = wallet.currencyCode.toLowerCase()
    const filterMatched =
      searchFilterLowerCase === '' ||
      nameString.includes(searchFilterLowerCase) ||
      currencyNameString.includes(searchFilterLowerCase) ||
      currencyCodeString.includes(searchFilterLowerCase)
    const mostRecentUsedCheck = isMostRecentWallet ? currencyCodeString === currencyCodeFilter.toLowerCase() : true

    if (!checkAllowedCurrencyCodes || checkExcludeCurrencyCodes || !filterMatched || !mostRecentUsedCheck) return null

    return (
      <TouchableHighlight underlayColor={THEME.COLORS.TRANSPARENT} onPress={this.onPress}>
        <View style={styles.rowContainerTop}>
          <View style={styles.containerLeft}>
            <Image style={styles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode="contain" />
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={styles.walletDetailsRowCurrency}>{wallet.currencyCode}</FormattedText>
              <FormattedText style={styles.walletDetailsRowValue}>
                {this.state.cryptoSymbol} {this.state.cryptoBalance}
              </FormattedText>
            </View>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={styles.walletDetailsRowName}>{wallet.name}</FormattedText>
              <FormattedText style={styles.walletDetailsRowFiat}>
                {this.state.fiatSymbol} {this.state.fiatBalance}
              </FormattedText>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        {this.props.headerLabel === 'mostRecentWalletsHeader' && (
          <View style={styles.walletHeaderContainer}>
            <View style={styles.walletHeaderTextContainer}>
              <FormattedText style={styles.walletHeaderText}>{s.strings.wallet_list_modal_header_mru}</FormattedText>
            </View>
          </View>
        )}
        {this.props.headerLabel === 'normalWalletHeader' && (
          <View style={styles.walletHeaderContainer}>
            <View style={styles.walletHeaderTextContainer}>
              <FormattedText style={styles.walletHeaderText}>{s.strings.wallet_list_modal_header_all}</FormattedText>
            </View>
          </View>
        )}
        {this.renderWallet()}
        <View styles={styles.rowContainerBottom}>{this.renderTokens()}</View>
      </View>
    )
  }
}

const rawStyles = {
  container: {
    width: '100%'
  },
  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContainerBottom: {
    width: '100%'
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    width: scale(36)
  },
  imageContainer: {
    height: scale(24),
    width: scale(24)
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
    marginRight: scale(8),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowName: {
    flex: 1,
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowFiat: {
    fontSize: scale(14),
    textAlign: 'right',
    marginRight: scale(8),
    color: THEME.COLORS.SECONDARY
  },
  walletHeaderContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 3,
    padding: scale(3),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  walletHeaderTextContainer: {
    flex: 1
  },
  walletHeaderText: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
