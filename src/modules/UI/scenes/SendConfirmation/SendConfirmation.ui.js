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
  convertNativeToDisplay,
  border
} from '../../../utils.js'
import type { CurrencyConverter, GuiCurrencyInfo } from '../../../../types'
import type { AbcMetadata } from 'airbitz-core-types'

const DIVIDE_PRECISION = 18

export type StateProps = {
  currencyCode: string,
  nativeAmount: string,
  networkFee: string,
  publicAddress: string,
  pending: boolean,
  keyboardIsVisible: boolean,
  label: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  currencyConverter: CurrencyConverter
}

export type DispatchProps = {
  updateSpendPending: (boolean) => any,
  signBroadcastAndSave: () => any,
  reset: () => any,
  updateAmount: (
    nativeAmount: string,
    metadata: AbcMetadata
  ) => any
}

export type Props = DispatchProps & StateProps

type State = {
  nativeAmount: string,
  overridePrimaryExchangeAmount: string,
  keyboardVisible: boolean
}

export default class SendConfirmation extends Component<Props, State> {
  constructor (props: Props & DispatchProps) {
    super(props)
    const newState: State = {
      overridePrimaryExchangeAmount: '',
      keyboardVisible: false,
      nativeAmount: props.nativeAmount
    }
    this.state = newState
  }

  componentDidMount () {
    const overridePrimaryExchangeAmount = bns.div(this.props.nativeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    this.setState({overridePrimaryExchangeAmount})
  }

  componentWillUnmount () {
    this.props.reset()
  }

  render () {
    let networkFeeSyntax

    if (bns.gt(this.props.networkFee, '0')) {
      const cryptoFeeSymbol = this.props.primaryCurrencyInfo.displayDenomination.symbol
      const cryptoFeeAmount = this.convertPrimaryNativeToDisplay(this.props.networkFee)
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      const fiatFeeSymbol = this.props.secondaryCurrencyInfo.displayDenomination.symbol
      const exchangeConvertor = convertNativeToExchange(this.props.primaryCurrencyInfo.exchangeDenomination.multiplier)
      const cryptoFeeExchangeAmount = exchangeConvertor(this.props.networkFee)
      const fiatFeeAmount = this.props.currencyConverter.convertCurrency(this.props.currencyCode, this.props.secondaryCurrencyInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
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
                    primaryInfo={this.props.primaryCurrencyInfo}
                    secondaryInfo={this.props.secondaryCurrencyInfo} />
              }
            </View>

            <View style={[styles.main, border('yellow'), {flex: this.state.keyboardVisible ? 0 : 1}]}>
              <ExchangedFlipInput
                primaryCurrencyInfo={this.props.primaryCurrencyInfo}
                secondaryCurrencyInfo={this.props.secondaryCurrencyInfo}
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

  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const amountFiatString: string = bns.mul(amounts.exchangeAmount, this.props.fiatPerCrypto.toString())
    const amountFiat: number = parseFloat(amountFiatString)
    const metadata: AbcMetadata = {amountFiat}
    const nativeAmount: string = amounts.nativeAmount

    this.props.updateAmount(nativeAmount, metadata)
  }

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.props.primaryCurrencyInfo.exchangeDenomination.multiplier
    const primaryDisplayAmount = convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }
}
