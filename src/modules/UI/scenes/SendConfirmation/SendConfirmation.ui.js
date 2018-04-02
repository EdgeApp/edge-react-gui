// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../../../locales/strings.js'
import type { CurrencyConverter, GuiCurrencyInfo, GuiDenomination } from '../../../../types'
import { border, convertAbcToGuiDenomination, convertNativeToDisplay, convertNativeToExchange, getDenomFromIsoCode } from '../../../utils.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
import { ExchangedFlipInput } from '../../components/FlipInput/ExchangedFlipInput2.js'
import Text from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import Recipient from '../../components/Recipient/index.js'
import SafeAreaView from '../../components/SafeAreaView'
import ABSlider from '../../components/Slider/index.js'
import styles from './styles.js'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  fiatCurrencyCode: string,
  currencyCode: string,
  nativeAmount: string,
  parentNetworkFee: ?string,
  networkFee: string,
  publicAddress: string,
  pending: boolean,
  keyboardIsVisible: boolean,
  label: string,
  parentDisplayDenomination: EdgeDenomination,
  parentExchangeDenomination: GuiDenomination,
  primaryDisplayDenomination: EdgeDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryeExchangeCurrencyCode: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  resetSlider: boolean,
  forceUpdateGuiCounter: number,
  currencyConverter: CurrencyConverter
}

export type SendConfirmationDispatchProps = {
  updateSpendPending: boolean => any,
  signBroadcastAndSave: () => any,
  reset: () => any,
  updateAmount: (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => any
}

type routerParam = {
  data: string // This is passed by the react-native-router-flux when you put a parameter on Action.route()
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps & routerParam

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

  componentWillMount () {
    this.setState({ keyboardVisible: this.props.data === 'fromScan' })
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
    const parentDisplayDenomination = convertAbcToGuiDenomination(this.props.parentDisplayDenomination)

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

    const networkFeeSyntax = () => {
      const { networkFee, parentNetworkFee } = this.props

      if (parentNetworkFee && bns.gt(parentNetworkFee, '0')) {
        const cryptoFeeSymbol = parentDisplayDenomination.symbol
        const cryptoFeeMultiplier = this.props.parentExchangeDenomination.multiplier
        const cryptoFeeAmount = parentNetworkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(parentNetworkFee) : ''
        const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
        const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol
        const exchangeConvertor = convertNativeToExchange(this.props.parentExchangeDenomination.multiplier)
        const cryptoFeeExchangeAmount = exchangeConvertor(parentNetworkFee)
        const fiatFeeAmount = this.props.currencyConverter.convertCurrency(this.props.parentExchangeDenomination.name, secondaryInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
        const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
        const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
        const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
        return sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString)
      }

      if (bns.gt(networkFee, '0')) {
        const cryptoFeeSymbol = primaryInfo.displayDenomination.symbol
        const cryptoFeeMultiplier = this.props.primaryExchangeDenomination.multiplier
        const cryptoFeeAmount = networkFee ? convertNativeToDisplay(cryptoFeeMultiplier)(networkFee) : ''
        const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
        const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol
        const exchangeConvertor = convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)
        const cryptoFeeExchangeAmount = exchangeConvertor(networkFee)
        const fiatFeeAmount = this.props.currencyConverter.convertCurrency(this.props.currencyCode, secondaryInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
        const fiatFeeAmountString = fiatFeeAmount.toFixed(2)
        const fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
        const fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
        return sprintf(s.strings.send_confirmation_fee_line, cryptoFeeString, fiatFeeString)
      }
      return ''
    }

    return (
      <SafeAreaView>
        <Gradient style={[styles.view]}>
          <Gradient style={styles.gradient} />
          <View style={[styles.mainScrollView]}>
            <View style={[styles.exchangeRateContainer, styles.error]}>
              {this.props.errorMsg ? (
                <Text style={[styles.error, styles.errorText]}>{this.props.errorMsg}</Text>
              ) : (
                <ExchangeRate secondaryDisplayAmount={this.props.fiatPerCrypto} primaryInfo={primaryInfo} secondaryInfo={secondaryInfo} />
              )}
            </View>
            <View style={[styles.main, border('yellow')]}>
              <ExchangedFlipInput
                primaryCurrencyInfo={{ ...primaryInfo }}
                secondaryCurrencyInfo={{ ...secondaryInfo }}
                exchangeSecondaryToPrimaryRatio={this.props.fiatPerCrypto}
                overridePrimaryExchangeAmount={this.state.overridePrimaryExchangeAmount}
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
                keyboardVisible={this.state.keyboardVisible}
              />
              <View style={[styles.feeArea]}>
                <Text style={[styles.feeAreaText]}>{networkFeeSyntax()}</Text>
              </View>
              <Recipient label={this.props.label} link={''} publicAddress={this.props.publicAddress} style={styles.recipient} />
            </View>
            <View style={[styles.pendingSymbolArea]}>
              {this.props.pending && <ActivityIndicator style={[{ flex: 1, alignSelf: 'center' }]} size={'small'} />}
            </View>
            <View style={[styles.sliderWrap]}>
              <ABSlider
                forceUpdateGuiCounter={this.state.forceUpdateGuiCounter}
                resetSlider={this.props.resetSlider}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.props.signBroadcastAndSave}
                sliderDisabled={this.props.sliderDisabled}
              />
            </View>
          </View>
        </Gradient>
      </SafeAreaView>
    )
  }

  onExchangeAmountChanged = ({ nativeAmount, exchangeAmount }: ExchangedFlipInputAmounts) => {
    this.props.updateAmount(nativeAmount, exchangeAmount, this.props.fiatPerCrypto.toString())
  }
}
