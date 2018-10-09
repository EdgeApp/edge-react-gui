// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeDenomination, EdgeMetadata } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import type { GuiCurrencyInfo, GuiDenomination } from '../../../../types'
import { convertNativeToDisplay, convertNativeToExchange, decimalOrZero, getDenomFromIsoCode } from '../../../utils.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput2.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Text from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import { PinInput } from '../../components/PinInput/PinInput.ui.js'
import Recipient from '../../components/Recipient/index.js'
import SafeAreaView from '../../components/SafeAreaView'
import ABSlider from '../../components/Slider/index.js'
import { convertCurrencyFromExchangeRates } from '../../selectors.js'
import { UniqueIdentifierModalConnect as UniqueIdentifierModal } from './components/UniqueIdentifierModal/UniqueIdentifierModalConnector.js'
import styles, { rawStyles } from './styles.js'

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
  uniqueIdentifierUpdated: (uniqueIdentifier: string) => any,
  onChangePin: (pin: string) => mixed,
  uniqueIdentifierButtonPressed: () => void
}

type routerParam = {
  data: string // This is passed by the react-native-router-flux when you put a parameter on Action.route()
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps & routerParam

type State = {|
  secondaryDisplayDenomination: GuiDenomination,
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  keyboardVisible: boolean
|}

export class SendConfirmation extends Component<Props, State> {
  pinInput: any

  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
    this.state = {
      secondaryDisplayDenomination: {
        name: '',
        multiplier: '1',
        symbol: ''
      },
      overridePrimaryExchangeAmount: '',
      keyboardVisible: false,
      forceUpdateGuiCounter: 0,
      nativeAmount: props.nativeAmount
    }
  }

  UNSAFE_componentWillMount () {
    this.setState({ keyboardVisible: this.props.data === 'fromScan' })
  }
  componentDidMount () {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)
    const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
    this.setState({ secondaryDisplayDenomination, overridePrimaryExchangeAmount })
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
                <Text style={[styles.error, styles.errorText]}>{this.props.errorMsg}</Text>
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
              />

              <Scene.Padding style={{ paddingHorizontal: 54 }}>
                <Scene.Item style={{ alignItems: 'center', flex: -1 }}>
                  {(!!this.props.networkFee || !!this.props.parentNetworkFee) && (
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

                  {(currencyCode === 'XMR' || currencyCode === 'XRP' || currencyCode === 'XLM') && (
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

            <Scene.Row style={styles.activityIndicatorSpace}>
              {this.props.pending && <ActivityIndicator style={[{ flex: 1, alignSelf: 'center' }]} size={'small'} />}
            </Scene.Row>

            <Scene.Footer style={styles.footer}>
              <ABSlider
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                resetSlider={this.props.resetSlider}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.props.signBroadcastAndSave}
                sliderDisabled={this.props.sliderDisabled}
              />
            </Scene.Footer>
          </View>
        </Gradient>

        {(currencyCode === 'XRP' || currencyCode === 'XMR' || currencyCode === 'XLM') && (
          <UniqueIdentifierModal onConfirm={this.props.uniqueIdentifierUpdated} currencyCode={currencyCode} />
        )}
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
      const cryptoFeeMultiplier = this.props.parentExchangeDenomination.multiplier
      const cryptoFeeAmount = parentNetworkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(parentNetworkFee) : ''
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
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
      const cryptoFeeMultiplier = this.props.primaryExchangeDenomination.multiplier
      const cryptoFeeAmount = networkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(networkFee) : ''
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol ? secondaryInfo.displayDenomination.symbol : ''
      const exchangeConvertor = convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)
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
