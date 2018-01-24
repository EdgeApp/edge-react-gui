// @flow

import React, {Component} from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import SafeAreaView from '../../components/SafeAreaView'
import Text from '../../components/FormattedText'
import {sprintf} from 'sprintf-js'
import s from '../../../../locales/strings.js'
import styles from './styles.js'
import {bns} from 'biggystring'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import type {FlipInputFieldInfo} from '../../components/FlipInput/FlipInput.ui'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Gradient from '../../components/Gradient/Gradient.ui'

import * as UTILS from '../../../utils.js'
import type { AbcMakeSpendInfo } from './action'
import type {CurrencyConverter, GuiDenomination} from '../../../../types'
import type { AbcMetadata } from 'airbitz-core-types'

const DIVIDE_PRECISION = 18

export type Props = {
  metadata: AbcMetadata,
  nativeAmount: string,
  publicAddress: string,
  pending: boolean,
  keyboardIsVisible: boolean,
  label: string,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryDisplayCurrencyCode: string,
  secondaryExchangeCurrencyCode: string,
  networkFeeOption: string,
  customNetworkFee: any,
  networkFee: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  currencyCode: string,
  sliderDisabled: boolean,
  currencyConverter: CurrencyConverter
}

export type DispatchProps = {
  updateSpendPending: (boolean) => any,
  signBroadcastAndSave: () => any,
  makeSpend: (options: AbcMakeSpendInfo) => any,
  resetFees: () => any,
  updateAmounts: (nativeAmount: string, metadata: AbcMetadata) => any
}

type State = {
  secondaryDisplayDenomination: any,
  keyboardVisible: boolean
}

export default class SendConfirmation extends Component<Props & DispatchProps, State> {
  constructor (props: Props & DispatchProps) {
    super(props)
    this.state = {
      secondaryDisplayDenomination: { multiplier: '1' },
      keyboardVisible: false
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps['secondaryDisplayCurrencyCode'] !== this.props['secondaryDisplayCurrencyCode']) {
      this.setState({
        secondaryDisplayDenomination: UTILS.getDenomFromIsoCode(
          nextProps['secondaryDisplayCurrencyCode']
        )
      })
    }
  }

  componentDidMount () {
    this.setState({
      secondaryDisplayDenomination: UTILS.getDenomFromIsoCode(
        this.props.secondaryDisplayCurrencyCode
      )
    }, () => {
      this.onAmountsChange({
        primaryDisplayAmount: '0',
        secondaryDisplayAmount: '0'
      })
      this.props.resetFees()
    })
  }

  render () {
    this.props.makeSpend({ ...this.props })
    const primaryInfo: FlipInputFieldInfo = {
      displayCurrencyCode: this.props.currencyCode,
      exchangeCurrencyCode: this.props.currencyCode,
      displayDenomination: this.props.primaryDisplayDenomination,
      exchangeDenomination: this.props.primaryExchangeDenomination
    }

    const secondaryInfo: FlipInputFieldInfo = {
      displayCurrencyCode: this.props.secondaryDisplayCurrencyCode,
      exchangeCurrencyCode: this.props.secondaryExchangeCurrencyCode,
      displayDenomination: this.state.secondaryDisplayDenomination,
      exchangeDenomination: this.state.secondaryDisplayDenomination
    }

    const color = 'white'
    let networkFeeSyntax

    if (bns.gt(this.props.networkFee, '0')) {
      const cryptoFeeSymbol = primaryInfo.displayDenomination.symbol
      const cryptoFeeAmount = this.convertPrimaryNativeToDisplay(this.props.networkFee)
      const cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      const fiatFeeSymbol = secondaryInfo.displayDenomination.symbol
      const exchangeConvertor = UTILS.convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)
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

            <View style={[styles.exchangeRateContainer, UTILS.border()]}>
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

            <View style={[styles.main, UTILS.border('yellow'), {flex: this.state.keyboardVisible ? 0 : 1}]}>
              <ExchangedFlipInput
                primaryInfo={{...primaryInfo, nativeAmount: this.props.nativeAmount}}
                secondaryInfo={secondaryInfo}
                secondaryToPrimaryRatio={this.props.fiatPerCrypto}
                onAmountsChange={this.onAmountsChange}
                color={color} />
              <View style={[styles.feeArea]}>
                <Text style={[styles.feeAreaText]}>{networkFeeSyntax}</Text>
              </View>
              <Recipient label={this.props.label} link={''} publicAddress={this.props.publicAddress} style={styles.recipient} />
            </View>
            <View style={[styles.pendingSymbolArea]}>
              {this.props.pending &&
                <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, UTILS.border()]} size={'small'} />
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

  onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}: {primaryDisplayAmount: string, secondaryDisplayAmount: string}) => {
    const primaryNativeToDenominationRatio = this.props.primaryDisplayDenomination.multiplier.toString()
    const nativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)
    const metadata = { amountFiat: parseFloat(secondaryExchangeAmount) }

    this.props.updateAmounts(nativeAmount, metadata)
  }

  onMaxPress = () => {}

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.props.primaryExchangeDenomination.multiplier
    const primaryDisplayAmount = UTILS.convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }

  getPrimaryNativeToDisplayRatio = () => this.props.primaryDisplayDenomination.multiplier

  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return bns.div(secondaryDisplayAmount, secondaryDisplayToExchangeRatio, DIVIDE_PRECISION)
  }

  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier = this.state.secondaryDisplayDenomination.multiplier
    return bns.div(displayMultiplier, displayMultiplier, DIVIDE_PRECISION)
  }
}
