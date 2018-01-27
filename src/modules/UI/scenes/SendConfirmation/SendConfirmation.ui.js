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
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import type { FlipInputFieldInfo } from '../../components/FlipInput/FlipInput.ui'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Gradient from '../../components/Gradient/Gradient.ui'
import {
  getDenomFromIsoCode,
  convertNativeToExchange,
  convertNativeToDisplay,
  border
} from '../../../utils.js'
import type { CurrencyConverter, GuiDenomination } from '../../../../types'

export type StateProps = {
  currencyCode: string,
  nativeAmount: string,
  networkFee: string,
  publicAddress: string,
  pending: boolean,
  keyboardIsVisible: boolean,
  label: string,
  primaryDisplayDenomination: GuiDenomination,
  primaryExchangeDenomination: GuiDenomination,
  secondaryDisplayCurrencyCode: string,
  secondaryExchangeCurrencyCode: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  sliderDisabled: boolean,
  currencyConverter: CurrencyConverter
}

export type DispatchProps = {
  updateSpendPending: (boolean) => any,
  signBroadcastAndSave: () => any,
  resetFees: () => any,
  updateAmount: (
    primaryDisplayAmount: string,
    secondaryDisplayAmount: string,
    primaryMultiplier: string,
    secondaryMultiplier: string
  ) => any
}

export type Props = DispatchProps & StateProps

type State = {
  secondaryDisplayDenomination: any,
  keyboardVisible: boolean
}

export default class SendConfirmation extends Component<Props, State> {
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
        secondaryDisplayDenomination: getDenomFromIsoCode(
          nextProps['secondaryDisplayCurrencyCode']
        )
      })
    }
  }

  componentDidMount () {
    const secondaryDisplayDenomination = getDenomFromIsoCode(
      this.props.secondaryDisplayCurrencyCode
    )
    this.setState({
      secondaryDisplayDenomination
    }, () => this.props.resetFees())
  }

  render () {
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

  onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}: {primaryDisplayAmount: string, secondaryDisplayAmount: string}) => {
    this.props.updateAmount(
      primaryDisplayAmount,
      secondaryDisplayAmount,
      this.props.primaryDisplayDenomination.multiplier.toString(),
      this.state.secondaryDisplayDenomination.multiplier.toString()
    )
  }

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.props.primaryExchangeDenomination.multiplier
    const primaryDisplayAmount = convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }
}
