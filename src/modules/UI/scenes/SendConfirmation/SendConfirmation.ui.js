// @flow

import React, { Component } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import SafeAreaView from '../../components/SafeAreaView'
import Text from '../../components/FormattedText'
import { sprintf } from 'sprintf-js'
import s from '../../../../locales/strings.js'
import styles from './styles.js'
import { bns } from 'biggystring'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import { ExchangedFlipInput, type ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {
  convertNativeToExchange,
  convertAbcToGuiDenomination,
  getDenomFromIsoCode,
  convertNativeToDisplay,
  border
} from '../../../utils.js'
import type { AbcDenomination } from 'edge-login'
import type { CurrencyConverter, GuiCurrencyInfo, GuiDenomination } from '../../../../types'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  fiatCurrencyCode: string,
  currencyCode: string,
  nativeAmount: string,
  networkFee: string,
  publicAddress: string,
  pending: boolean,
  keyboardIsVisible: boolean,
  label: string,
  primaryDisplayDenomination: AbcDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryeExchangeCurrencyCode: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  forceUpdateGuiCounter: number,
  currencyConverter: CurrencyConverter
}

export type SendConfirmationDispatchProps = {
  updateSpendPending: (boolean) => any,
  signBroadcastAndSave: () => any,
  reset: () => any,
  updateAmount: (
    nativeAmount: string,
    exchangeAmount: string,
    fiatPerCrypto: string
  ) => any
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps

type State = {
  secondaryDisplayDenomination: GuiDenomination,
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  forceUpdateGuiCounter: number,
  keyboardVisible: boolean
}

export class SendConfirmation extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const newState: State = {
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
    this.state = newState
  }

  componentDidMount () {
    const secondaryDisplayDenomination = getDenomFromIsoCode(this.props.fiatCurrencyCode)
    const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryExchangeDenomination.multiplier, DIVIDE_PRECISION)
    this.setState({ secondaryDisplayDenomination, overridePrimaryExchangeAmount })
  }

  componentWillReceiveProps (nextProps: Props) {
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
    const primaryDisplayDenomination = convertAbcToGuiDenomination(this.props.primaryDisplayDenomination)

    const primaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeCurrencyCode: this.props.primaryExchangeDenomination.name,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    let exchangeCurrencyCode = this.props.secondaryeExchangeCurrencyCode

    if (this.props.secondaryeExchangeCurrencyCode === '') {
      if (this.state.secondaryDisplayDenomination.currencyCode) {
        exchangeCurrencyCode = this.state.secondaryDisplayDenomination.currencyCode
      }
    }

    const secondaryInfo: GuiCurrencyInfo = {
      displayCurrencyCode: this.props.fiatCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeCurrencyCode: exchangeCurrencyCode,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    let networkFeeSyntax
    if (bns.gt(this.props.networkFee, '0')) {
      const cryptoFeeSymbol = primaryInfo.displayDenomination.symbol
      const cryptoFeeMultiplier = this.props.primaryExchangeDenomination.multiplier
      const cryptoFeeAmount = this.props.networkFee
        ? convertNativeToDisplay(cryptoFeeMultiplier)(this.props.networkFee)
        : ''
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol
      const exchangeConvertor = convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)
      const cryptoFeeExchangeAmount = exchangeConvertor(this.props.networkFee)
      const fiatFeeAmount = this.props.currencyConverter.convertCurrency(this.props.currencyCode, secondaryInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
      const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
      const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
      const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
      networkFeeSyntax = sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString)
    } else {
      networkFeeSyntax = ''
    }

    return (
      <SafeAreaView>
        <Gradient style={[styles.view]}>
          <Gradient style={styles.gradient} />
          <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>

            <View style={[styles.exchangeRateContainer, border()]}>
              {
                this.props.errorMsg
                  ? <Text style={[styles.error]}>
                    {this.props.errorMsg}
                  </Text>
                  : <ExchangeRate
                    secondaryDisplayAmount={this.props.fiatPerCrypto}
                    primaryInfo={primaryInfo}
                    secondaryInfo={secondaryInfo} />
              }
            </View>

            <View style={[styles.main, border('yellow'), {flex: this.state.keyboardVisible ? 0 : 1}]}>
              <ExchangedFlipInput
                primaryCurrencyInfo={{ ...primaryInfo }}
                secondaryCurrencyInfo={{ ...secondaryInfo }}
                exchangeSecondaryToPrimaryRatio={this.props.fiatPerCrypto}
                overridePrimaryExchangeAmount={this.state.overridePrimaryExchangeAmount}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
              />
              <View style={[styles.feeArea]}>
                <Text style={[styles.feeAreaText]}>{networkFeeSyntax}</Text>
              </View>
              <Recipient label={this.props.label} link={''} publicAddress={this.props.publicAddress} style={styles.recipient} />
            </View>
            <View style={[styles.pendingSymbolArea]}>
              {this.props.pending &&
                <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, border()]} size={'small'} />
              }
            </View>
            <View style={[styles.sliderWrap]}>
              <ABSlider
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.props.signBroadcastAndSave}
                sliderDisabled={this.props.sliderDisabled} />
            </View>
          </ScrollView>
        </Gradient>
      </SafeAreaView>
    )
  }

  onExchangeAmountChanged = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    this.props.updateAmount(nativeAmount, exchangeAmount, this.props.fiatPerCrypto.toString())
  }
}
