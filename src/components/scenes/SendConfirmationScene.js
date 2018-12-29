// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeDenomination, EdgeMetadata } from 'edge-core-js'
import React, { Component } from 'react'
import { TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { UniqueIdentifierModalConnect as UniqueIdentifierModal } from '../../connectors/UniqueIdentifierModalConnector.js'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import { ExchangedFlipInput } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2.js'
import Text from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { PinInput } from '../../modules/UI/components/PinInput/PinInput.ui.js'
import Recipient from '../../modules/UI/components/Recipient/index.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { convertCurrencyFromExchangeRates } from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import styles, { rawStyles } from '../../styles/scenes/SendConfirmationStyle.js'
import type { GuiCurrencyInfo, GuiDenomination } from '../../types'
import { convertNativeToDisplay, convertNativeToExchange, decimalOrZero, getDenomFromIsoCode } from '../../util/utils.js'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  fiatCurrencyCode: string,
  currencyCode: string,
  nativeAmount: string,
  parentNetworkFee: string | null,
  networkFee: string | null,
  pending: boolean,
  keyboardIsVisible: boolean,
  balanceInCrypto: string,
  balanceInFiat: number,
  parentDisplayDenomination: EdgeDenomination,
  parentExchangeDenomination: GuiDenomination,
  primaryDisplayDenomination: EdgeDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryExchangeCurrencyCode: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  resetSlider: boolean,
  forceUpdateGuiCounter: number,
  uniqueIdentifier?: string,
  transactionMetadata: EdgeMetadata | null,
  isEditable: boolean,
  authRequired: 'pin' | 'none',
  address: string,
  exchangeRates: { [string]: number }
}

export type SendConfirmationDispatchProps = {
  updateSpendPending: boolean => any,
  signBroadcastAndSave: () => any,
  reset: () => any,
  updateAmount: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => any,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo) => any,
  onChangePin: (pin: string) => mixed,
  uniqueIdentifierButtonPressed: () => void
}

type SendConfirmationRouterParams = {
  guiMakeSpendInfo: GuiMakeSpendInfo
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps & SendConfirmationRouterParams

type State = {|
  secondaryDisplayDenomination: GuiDenomination,
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  keyboardVisible: boolean,
  showSpinner: boolean,
  isFiatOnTop: boolean,
  isFocus: boolean
|}

export class SendConfirmation extends Component<Props, State> {
  pinInput: any

  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)

    const { guiMakeSpendInfo } = props
    // Flow Errors when checking the index - muted the flow error
    // Test errors also on guiMakeSpendInfo
    const spendTarget = guiMakeSpendInfo.spendTargets[0]
    const nativeAmount = spendTarget.nativeAmount

    // Checks for native amount
    const checkNativeAmount = () => {
      if (nativeAmount) {
        if (!bns.eq(nativeAmount, '0')) {
          return false
        }
        return true
      }
      return true
    }

    // State init
    this.state = {
      secondaryDisplayDenomination: {
        name: '',
        multiplier: '1',
        symbol: ''
      },
      overridePrimaryExchangeAmount: '',
      keyboardVisible: false,
      forceUpdateGuiCounter: 0,
      nativeAmount: props.nativeAmount,
      showSpinner: false,
      isFiatOnTop: checkNativeAmount(),
      isFocus: checkNativeAmount()
    }
  }

  componentDidMount () {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)
    const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
    const guiMakeSpendInfo = this.props.guiMakeSpendInfo
    let keyboardVisible = true
    //
    // Do not show the keyboard if the caller passed in an amount
    if (guiMakeSpendInfo.nativeAmount) {
      if (!bns.eq(guiMakeSpendInfo.nativeAmount, '0')) {
        keyboardVisible = false
      }
    } else if (guiMakeSpendInfo.spendTargets && guiMakeSpendInfo.spendTargets.length) {
      keyboardVisible = false
    }

    this.props.sendConfirmationUpdateTx(this.props.guiMakeSpendInfo)
    this.setState({ secondaryDisplayDenomination, overridePrimaryExchangeAmount, keyboardVisible })
  }

  componentDidUpdate (prevProps: Props) {
    if (!prevProps.transactionMetadata && this.props.transactionMetadata && this.props.authRequired !== 'none' && this.props.nativeAmount !== '0') {
      this.pinInput.focus()
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    const newState = {}
    if (nextProps.forceUpdateGuiCounter !== this.state.forceUpdateGuiCounter) {
      const overridePrimaryExchangeAmount = bns.div(nextProps.nativeAmount, nextProps.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
      newState.overridePrimaryExchangeAmount = overridePrimaryExchangeAmount
      newState.forceUpdateGuiCounter = nextProps.forceUpdateGuiCounter
    }
    if (nextProps.fiatCurrencyCode !== this.props.fiatCurrencyCode) {
      newState.secondaryDisplayDenomination = getDenomFromIsoCode(nextProps.fiatCurrencyCode)
    }

    const feeCalculated = !!nextProps.networkFee || !!nextProps.parentNetworkFee
    if (feeCalculated || nextProps.errorMsg || nextProps.nativeAmount === '0') {
      newState.showSpinner = false
    }

    this.setState(newState)
  }

  componentWillUnmount () {
    this.props.reset()
  }

  render () {
    const primaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.currencyCode,
      displayDenomination: this.props.primaryDisplayDenomination,
      exchangeCurrencyCode: this.props.primaryExchangeDenomination.name,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    let exchangeCurrencyCode = this.props.secondaryExchangeCurrencyCode

    if (this.props.secondaryExchangeCurrencyCode === '') {
      if (this.state.secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = this.state.secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    const cryptoBalanceAmount: string = convertNativeToDisplay(primaryInfo.displayDenomination.multiplier)(this.props.balanceInCrypto) // convert to correct denomination
    const cryptoBalanceAmountString = cryptoBalanceAmount ? intl.formatNumber(decimalOrZero(bns.toFixed(cryptoBalanceAmount, 0, 6), 6)) : '0' // limit decimals and check if infitesimal, also cut off trailing zeroes (to right of significant figures)
    const balanceInFiatString = intl.formatNumber(this.props.balanceInFiat || 0, { toFixed: 2 })

    const { address, authRequired, currencyCode, transactionMetadata, uniqueIdentifier } = this.props
    const destination = transactionMetadata ? transactionMetadata.name : ''
    const DESTINATION_TEXT = sprintf(s.strings.send_confirmation_to, destination)
    const ADDRESS_TEXT = sprintf(s.strings.send_confirmation_address, address)

    const feeCalculated = !!this.props.networkFee || !!this.props.parentNetworkFee
    const sliderDisabled = this.props.sliderDisabled || !feeCalculated || this.props.nativeAmount === '0'

    const isTaggableCurrency = !!(currencyCode === 'XRP' || currencyCode === 'XMR' || currencyCode === 'XLM')

    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <Gradient style={styles.gradient} />

          <View style={styles.mainScrollView}>
            <View style={[styles.balanceContainer, styles.error]}>
              <Text style={styles.balanceText}>
                {s.strings.send_confirmation_balance} {cryptoBalanceAmountString} {primaryInfo.displayDenomination.name} (
                {secondaryInfo.displayDenomination.symbol} {balanceInFiatString})
              </Text>
            </View>

            <View style={[styles.exchangeRateContainer, styles.error]}>
              {this.props.errorMsg ? (
                <Text style={[styles.error, styles.errorText]} numberOfLines={3}>
                  {this.props.errorMsg}
                </Text>
              ) : (
                <ExchangeRate secondaryDisplayAmount={this.props.fiatPerCrypto} primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} />
              )}
            </View>

            <View style={styles.main}>
              <ExchangedFlipInput
                primaryCurrencyInfo={{ ...primaryInfo }}
                secondaryCurrencyInfo={{ ...secondaryInfo }}
                exchangeSecondaryToPrimaryRatio={this.props.fiatPerCrypto}
                overridePrimaryExchangeAmount={this.state.overridePrimaryExchangeAmount}
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
                keyboardVisible={this.state.keyboardVisible}
                isEditable={this.props.isEditable}
                isFiatOnTop={this.state.isFiatOnTop}
                isFocus={this.state.isFocus}
              />

              <Scene.Padding style={{ paddingHorizontal: 54 }}>
                <Scene.Item style={{ alignItems: 'center', flex: -1 }}>
                  {feeCalculated && (
                    <Scene.Row style={{ paddingVertical: 4 }}>
                      <Text style={[styles.feeAreaText]}>{this.networkFeeSyntax()}</Text>
                    </Scene.Row>
                  )}

                  {!!destination && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <Recipient.Text style={{}}>
                        <Text>{DESTINATION_TEXT}</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}

                  {!!address && (
                    <Scene.Row style={{ paddingVertical: 4 }}>
                      <Recipient.Text style={{}}>
                        <Text>{ADDRESS_TEXT}</Text>
                      </Recipient.Text>
                    </Scene.Row>
                  )}

                  {isTaggableCurrency && (
                    <Scene.Row style={{ paddingVertical: 10 }}>
                      <TouchableOpacity
                        activeOpacity={rawStyles.activeOpacity}
                        style={styles.addUniqueIDButton}
                        onPress={this.props.uniqueIdentifierButtonPressed}
                      >
                        <Text style={styles.addUniqueIDButtonText} ellipsizeMode={'tail'}>
                          {uniqueIdentifierText(currencyCode, uniqueIdentifier)}
                        </Text>
                      </TouchableOpacity>
                    </Scene.Row>
                  )}

                  {authRequired === 'pin' && (
                    <Scene.Row style={{ paddingVertical: 10, width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <Text style={styles.rowText}>{s.strings.four_digit_pin}</Text>

                      <View style={styles.pinInputSpacer} />

                      <View style={styles.pinInputContainer}>
                        <PinInput ref={ref => (this.pinInput = ref)} onChangePin={this.handleChangePin} returnKeyType="done" />
                      </View>
                    </Scene.Row>
                  )}
                </Scene.Item>
              </Scene.Padding>
            </View>
            <Scene.Footer style={[styles.footer, isTaggableCurrency && styles.footerWithPaymentId]}>
              <ABSlider
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                resetSlider={this.props.resetSlider}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.props.signBroadcastAndSave}
                sliderDisabled={sliderDisabled}
                showSpinner={this.state.showSpinner || this.props.pending}
              />
            </Scene.Footer>
          </View>
        </Gradient>

        {isTaggableCurrency && <UniqueIdentifierModal onConfirm={this.props.sendConfirmationUpdateTx} currencyCode={currencyCode} />}
      </SafeAreaView>
    )
  }

  handleChangePin = (pin: string) => {
    this.props.onChangePin(pin)
    if (pin.length >= 4) {
      this.pinInput.blur()
    }
  }

  onExchangeAmountChanged = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    this.setState({
      showSpinner: true
    })

    this.props.updateAmount(nativeAmount, exchangeAmount, this.props.fiatPerCrypto.toString())
  }

  networkFeeSyntax = () => {
    const { networkFee, parentNetworkFee, parentDisplayDenomination, exchangeRates } = this.props
    if (!networkFee && !parentNetworkFee) return ''

    const primaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.currencyCode,
      displayDenomination: this.props.primaryDisplayDenomination,
      exchangeCurrencyCode: this.props.primaryExchangeDenomination.name,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    let exchangeCurrencyCode = this.props.secondaryExchangeCurrencyCode

    if (this.props.secondaryExchangeCurrencyCode === '') {
      if (this.state.secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = this.state.secondaryDisplayDenomination.name
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    if (parentNetworkFee && bns.gt(parentNetworkFee, '0')) {
      const cryptoFeeSymbol = parentDisplayDenomination.symbol ? parentDisplayDenomination.symbol : ''
      // multiplier for display denomination
      const displayDenomMultiplier = parentDisplayDenomination.multiplier
      // multiplier for exchange denomination
      const cryptoFeeMultiplier = this.props.parentExchangeDenomination.multiplier
      // fee amount in exchange denomination
      const cryptoFeeExchangeDenomAmount = parentNetworkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(parentNetworkFee) : ''
      const exchangeToDisplayMultiplierRatio = bns.div(cryptoFeeMultiplier, displayDenomMultiplier, DIVIDE_PRECISION)
      const cryptoFeeDisplayDenomAmount = bns.mul(cryptoFeeExchangeDenomAmount, exchangeToDisplayMultiplierRatio)
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeDisplayDenomAmount}`
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol ? secondaryInfo.displayDenomination.symbol : ''
      const exchangeConvertor = convertNativeToExchange(this.props.parentExchangeDenomination.multiplier)
      const cryptoFeeExchangeAmount = exchangeConvertor(parentNetworkFee)
      const fiatFeeAmount = convertCurrencyFromExchangeRates(
        exchangeRates,
        this.props.parentExchangeDenomination.name,
        secondaryInfo.exchangeCurrencyCode,
        parseFloat(cryptoFeeExchangeAmount)
      )
      const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
      const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
      const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
      return sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString)
    }

    if (networkFee && bns.gt(networkFee, '0')) {
      const cryptoFeeSymbol = primaryInfo.displayDenomination.symbol ? primaryInfo.displayDenomination.symbol : ''
      // multiplier for display denomination
      const displayDenomMultiplier = primaryInfo.displayDenomination.multiplier
      // multiplier for EXCHANGE denomination
      const cryptoFeeMultiplier = this.props.primaryExchangeDenomination.multiplier
      // fee amount in exchange denomination
      const cryptoFeeExchangeDenomAmount = networkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(networkFee) : ''
      const exchangeToDisplayMultiplierRatio = bns.div(cryptoFeeMultiplier, displayDenomMultiplier, DIVIDE_PRECISION)
      const cryptoFeeDisplayDenomAmount = bns.mul(cryptoFeeExchangeDenomAmount, exchangeToDisplayMultiplierRatio)
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeDisplayDenomAmount}`
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol ? secondaryInfo.displayDenomination.symbol : ''
      const exchangeConvertor = convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)
      // amount in EXCHANGE denomination
      const cryptoFeeExchangeAmount = exchangeConvertor(networkFee)
      const fiatFeeAmount = convertCurrencyFromExchangeRates(
        exchangeRates,
        this.props.currencyCode,
        secondaryInfo.exchangeCurrencyCode,
        parseFloat(cryptoFeeExchangeAmount)
      )
      const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
      const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
      const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
      return sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString)
    }
    return ''
  }
}

export const uniqueIdentifierText = (currencyCode: string, uniqueIdentifier?: string): string => {
  if (!uniqueIdentifier) {
    if (currencyCode === 'XLM') return sprintf(s.strings.unique_identifier_add, s.strings.unique_identifier_memo_id)
    if (currencyCode === 'XRP') return sprintf(s.strings.unique_identifier_add, s.strings.unique_identifier_destination_tag)
    if (currencyCode === 'XMR') return sprintf(s.strings.unique_identifier_add, s.strings.unique_identifier_payment_id)
  }

  if (currencyCode === 'XLM') return sprintf(s.strings.unique_identifier_display_text, s.strings.unique_identifier_memo_id, uniqueIdentifier)
  if (currencyCode === 'XRP') return sprintf(s.strings.unique_identifier_display_text, s.strings.unique_identifier_destination_tag, uniqueIdentifier)
  if (currencyCode === 'XMR') return sprintf(s.strings.unique_identifier_display_text, s.strings.unique_identifier_payment_id, uniqueIdentifier)

  throw new Error('Invalid currency code')
}
