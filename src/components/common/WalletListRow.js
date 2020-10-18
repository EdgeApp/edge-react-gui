// @flow

import { bns } from 'biggystring'
import * as React from 'react'
import { Image, StyleSheet, Text, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { getEnabledTokens, selectWallet } from '../../actions/WalletActions.js'
import WalletListTokenRow from '../../connectors/WalletListTokenRowConnector.js'
import { getSpecialCurrencyInfo, TRANSACTION_LIST, WALLET_LIST_SCENE } from '../../constants/indexConstants.js'
import { WALLET_LIST_OPTIONS_ICON } from '../../constants/WalletAndCurrencyConstants.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { calculateWalletFiatBalanceWithoutState } from '../../modules/UI/selectors.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type CustomTokenInfo, type GuiDenomination, type GuiWallet } from '../../types/types.js'
import { scale, scaleH } from '../../util/scaling.js'
import { decimalOrZero, getFiatSymbol, getObjectDiff, getYesterdayDateRoundDownHour, truncateDecimals } from '../../util/utils.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { ProgressPie } from './ProgressPie.js'

const DIVIDE_PRECISION = 18

type OwnProps = {
  guiWallet: GuiWallet,
  showBalance: boolean | Function
}
type StateProps = {
  customTokens: CustomTokenInfo[],
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination,
  exchangeRates: { [string]: number },
  settings: Object,
  walletFiatSymbol: string,
  walletsProgress: Object
}
type DispatchProps = {
  getEnabledTokensList(walletId: string): void,
  selectWallet(walletId: string, currencyCode: string): void
}
type Props = OwnProps & StateProps & DispatchProps

class WalletListRowComponent extends React.Component<Props> {
  _onPressSelectWallet = (walletId, currencyCode, publicAddress) => {
    this.props.selectWallet(walletId, currencyCode)
    // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
    // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
    const SPECIAL_CURRENCY_INFO = getSpecialCurrencyInfo(currencyCode)
    if (!SPECIAL_CURRENCY_INFO.isAccountActivationRequired || (SPECIAL_CURRENCY_INFO.isAccountActivationRequired && publicAddress)) {
      Actions[TRANSACTION_LIST]({ params: 'walletList' })
    }
  }

  shouldComponentUpdate(nextProps) {
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true,
      item: true
    })
    return !!diffElement
  }

  componentDidMount() {
    const { guiWallet } = this.props
    this.props.getEnabledTokensList(guiWallet.id)
  }

  openWalletListMenuModal = async () => {
    const { guiWallet } = this.props
    await Airship.show(bridge => (
      <WalletListMenuModal
        bridge={bridge}
        walletId={guiWallet.id}
        walletName={guiWallet.name}
        currencyCode={guiWallet.currencyCode}
        image={guiWallet.symbolImage}
      />
    ))
  }

  render() {
    const { guiWallet, walletFiatSymbol, settings, exchangeRates, showBalance } = this.props
    const progress = this.getProgress()

    const currencyCode = guiWallet.currencyCode
    const denomination = this.props.displayDenomination
    const multiplier = denomination.multiplier
    const id = guiWallet.id
    const name = guiWallet.name || s.strings.string_no_name
    const symbol = denomination.symbol
    const symbolImageDarkMono = guiWallet.symbolImageDarkMono
    const preliminaryCryptoAmount = truncateDecimals(bns.div(guiWallet.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    const finalCryptoAmount = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6)) // check if infinitesimal (would display as zero), cut off trailing zeroes
    const finalCryptoAmountString = showBalance ? `${symbol || ''} ${finalCryptoAmount}` : ''
    // need to crossreference tokensEnabled with nativeBalances
    const enabledNativeBalances = {}
    const enabledTokens = guiWallet.enabledTokens

    const customTokens = this.props.customTokens
    const enabledNotHiddenTokens = enabledTokens.filter(token => {
      let isVisible = true // assume we will enable token

      const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
      // if token is not supposed to be visible, not point in enabling it
      if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
      if (SYNCED_ACCOUNT_DEFAULTS[token] && guiWallet.enabledTokens.includes(token)) {
        // if hardcoded token
        isVisible = true // and enabled then make visible (overwrite customToken isVisible flag)
      }
      return isVisible
    })

    for (const prop in guiWallet.nativeBalances) {
      if (guiWallet.nativeBalances.hasOwnProperty(prop)) {
        if (prop !== currencyCode && enabledNotHiddenTokens.indexOf(prop) >= 0) {
          enabledNativeBalances[prop] = guiWallet.nativeBalances[prop]
        }
      }
    }
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = exchangeRates[rateKey] ? exchangeRates[rateKey] : null
    // Fiat Balance Formatting
    const fiatBalance = calculateWalletFiatBalanceWithoutState(guiWallet, currencyCode, settings, exchangeRates)
    const fiatBalanceFormat = fiatBalance && parseFloat(fiatBalance) > 0.000001 ? fiatBalance : 0
    const fiatBalanceSymbol = showBalance && exchangeRate ? walletFiatSymbol : ''
    const fiatBalanceString = showBalance && exchangeRate ? fiatBalanceFormat : ''
    // Exhange Rate Formatting
    const exchangeRateFormat = exchangeRate ? intl.formatNumber(exchangeRate, { toFixed: 2 }) : null
    const exchangeRateFiatSymbol = exchangeRateFormat ? `${walletFiatSymbol} ` : ''
    const exchangeRateString = exchangeRateFormat ? `${exchangeRateFormat}/${currencyCode}` : s.strings.no_exchange_rate
    // Yesterdays Percentage Difference Formatting
    const yesterdayUsdExchangeRate = exchangeRates[`${currencyCode}_iso:USD_${getYesterdayDateRoundDownHour()}`]
    const fiatExchangeRate = guiWallet.isoFiatCurrencyCode !== 'iso:USD' ? exchangeRates[`iso:USD_${guiWallet.isoFiatCurrencyCode}`] : 1
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
      differencePercentageString = '0.00%'
    } else if (exchangeRate && differencePercentage && differencePercentage < 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferenceNegative
      differencePercentageString = `- ${Math.abs(differencePercentage).toFixed(2)}%`
    } else if (exchangeRate && differencePercentage && differencePercentage > 0) {
      differencePercentageStringStyle = styles.walletDetailsRowDifferencePositive
      differencePercentageString = `+ ${Math.abs(differencePercentage).toFixed(2)}%`
    }

    return (
      <View style={{ width: '100%' }}>
        <View>
          <TouchableHighlight
            style={styles.rowContainer}
            underlayColor={THEME.COLORS.ROW_PRESSED}
            onPress={() => this._onPressSelectWallet(id, currencyCode, guiWallet.receiveAddress.publicAddress)}
          >
            <View style={styles.rowContent}>
              <View style={styles.rowIconWrap}>
                {symbolImageDarkMono && <Image style={styles.rowCurrencyLogoAndroid} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
                <View style={styles.rowCurrencyLogoAndroid}>
                  <ProgressPie size={rowCurrencyOverlaySize} color={THEME.COLORS.OPAQUE_WHITE_2} progress={progress} />
                </View>
              </View>
              <View style={styles.walletDetailsContainer}>
                <View style={styles.walletDetailsRow}>
                  <T style={styles.walletDetailsRowCurrency}>{currencyCode}</T>
                  <T style={styles.walletDetailsRowValue}>{finalCryptoAmountString}</T>
                </View>
                <View style={styles.walletDetailsRow}>
                  <T style={styles.walletDetailsRowName}>{name}</T>
                  <View style={styles.walletDetailsFiatBalanceRow}>
                    <T style={styles.walletDetailsRowFiat}>{fiatBalanceSymbol}</T>
                    <T style={styles.walletDetailsRowFiat}>{fiatBalanceString}</T>
                  </View>
                </View>
                <View style={styles.walletDetailsRowLine} />
                <View style={styles.walletDetailsRow}>
                  <View style={styles.walletDetailsExchangeRow}>
                    <T style={styles.walletDetailsRowExchangeRate}>{exchangeRateFiatSymbol}</T>
                    <T style={styles.walletDetailsRowExchangeRate}>{exchangeRateString}</T>
                  </View>
                  <T style={differencePercentageStringStyle}>{differencePercentageString}</T>
                </View>
              </View>
              <TouchableWithoutFeedback onPress={this.openWalletListMenuModal}>
                <View style={styles.rowOptionsWrap}>
                  <Text style={styles.rowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableHighlight>
          {this.renderTokenRow(id, enabledNativeBalances, progress)}
        </View>
      </View>
    )
  }

  renderTokenRow = (parentId: string, metaTokenBalances, progress: number) => {
    const { guiWallet } = this.props
    const tokens = []
    for (const property in metaTokenBalances) {
      if (metaTokenBalances.hasOwnProperty(property)) {
        if (property !== guiWallet.currencyCode) {
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
    const { guiWallet } = this.props

    const walletProgress = this.props.walletsProgress[guiWallet.id]
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

const rowCurrencyOverlaySize = scale(23.3)
const rawStyles = {
  rowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(106),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  rowIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(36)
  },
  rowCurrencyLogoAndroid: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    height: scale(23),
    width: scale(23),
    marginRight: scale(12),
    marginLeft: scale(3),
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  rowOptionsWrap: {
    width: scaleH(37),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowOptionsIcon: {
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginTop: scale(5)
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowLine: {
    height: 1,
    borderColor: 'rgba(14, 75, 117, 0.5)',
    borderBottomWidth: 1,
    marginTop: scale(12),
    marginBottom: scale(9)
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
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
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowExchangeRate: {
    fontSize: scale(14),
    textAlign: 'left',
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowDifferenceNeutral: {
    fontSize: scale(14),
    textAlign: 'right',
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowDifferencePositive: {
    fontSize: scale(14),
    textAlign: 'right',
    fontWeight: '400',
    color: THEME.COLORS.WALLET_LIST_DIFF_POSITIVE
  },
  walletDetailsRowDifferenceNegative: {
    fontSize: scale(14),
    textAlign: 'right',
    fontWeight: '400',
    color: THEME.COLORS.WALLET_LIST_DIFF_NEGATIVE
  },
  walletDetailsFiatBalanceRow: {
    flexDirection: 'row'
  },
  walletDetailsExchangeRow: {
    flexDirection: 'row',
    flex: 1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const WalletListRow = connect(
  (state: RootState, ownProps: OwnProps): StateProps => ({
    customTokens: state.ui.settings.customTokens,
    displayDenomination: SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.guiWallet.currencyCode),
    exchangeDenomination: SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.guiWallet.currencyCode),
    exchangeRates: state.exchangeRates,
    settings: state.ui.settings,
    showBalance: typeof ownProps.showBalance === 'function' ? ownProps.showBalance(state) : ownProps.showBalance,
    walletFiatSymbol: getFiatSymbol(ownProps.guiWallet.isoFiatCurrencyCode),
    walletsProgress: state.ui.wallets.walletLoadingProgress
  }),
  (dispatch: Dispatch): DispatchProps => ({
    getEnabledTokensList(walletId: string) {
      dispatch(getEnabledTokens(walletId))
    },
    selectWallet(walletId: string, currencyCode) {
      dispatch(selectWallet(walletId, currencyCode, WALLET_LIST_SCENE))
    }
  })
)(WalletListRowComponent)
