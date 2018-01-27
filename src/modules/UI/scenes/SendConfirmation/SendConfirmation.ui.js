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
import { ExchangedFlipInput, type ExchangedFlipInputAmounts } from '../../components/FlipInput/ExchangedFlipInput2.js'
// import type {FlipInputFieldInfo} from '../../components/FlipInput/FlipInput.ui'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Gradient from '../../components/Gradient/Gradient.ui'

import * as UTILS from '../../../utils.js'

import type {GuiWallet, CurrencyConverter, GuiCurrencyInfo} from '../../../../types'
import type {AbcCurrencyWallet, AbcParsedUri, AbcTransaction} from 'airbitz-core-types'
import type {SendConfirmationState} from './reducer'
import {UPDATE_SPEND_PENDING_START} from './action'

const DIVIDE_PRECISION = 18

export type SendConfirmationStateProps = {
  sendConfirmation: SendConfirmationState,
  abcWallet: AbcCurrencyWallet,
  nativeAmount: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  guiWallet: GuiWallet,
  currencyCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  sliderDisabled: boolean,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  currencyConverter: CurrencyConverter
}

export type SendConfirmationDispatchProps = {
  processParsedUri: (AbcParsedUri) => any,
  updateSpendPending: (number) => any,
  signBroadcastAndSave: (AbcTransaction) => any
}

type State = {
  overridePrimaryExchangeAmount: string,
  keyboardVisible: boolean
}

type Props = SendConfirmationStateProps & SendConfirmationDispatchProps

export default class SendConfirmation extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const amt = props.sendConfirmation.parsedUri.nativeAmount ? props.sendConfirmation.parsedUri.nativeAmount : '0'

    const overridePrimaryExchangeAmount = bns.div(amt, props.primaryCurrencyInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    this.state = {
      overridePrimaryExchangeAmount,
      keyboardVisible: false
    }
  }

  componentDidMount () {
    this.props.processParsedUri(this.props.sendConfirmation.parsedUri)
  }

  render () {
    let networkFee, cryptoFeeSymbol, cryptoFeeAmount, cryptoFeeString, fiatFeeSymbol, fiatFeeAmount
    let fiatFeeAmountPretty, cryptoFeeExchangeAmount, fiatFeeAmountString, fiatFeeString, networkFeeSyntax
    const {
      label,
      publicAddress,
      transaction

     } = this.props.sendConfirmation
    const {
      primaryCurrencyInfo,
      secondaryCurrencyInfo,
      errorMsg,
      currencyConverter,
      currencyCode
    } = this.props
    const color = 'white'

    if (transaction && bns.gt(transaction.networkFee, '0')) {
      networkFee = transaction.networkFee
      cryptoFeeSymbol = primaryCurrencyInfo.displayDenomination.symbol
      cryptoFeeAmount = this.convertPrimaryNativeToDisplay(networkFee)
      cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      fiatFeeSymbol = secondaryCurrencyInfo.displayDenomination.symbol
      cryptoFeeExchangeAmount = UTILS.convertNativeToExchange(primaryCurrencyInfo.exchangeDenomination.multiplier)(transaction.networkFee)
      fiatFeeAmount = currencyConverter.convertCurrency(currencyCode, secondaryCurrencyInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
      fiatFeeAmountString = fiatFeeAmount.toFixed(2)
      fiatFeeAmountPretty = bns.toFixed(fiatFeeAmountString, 2, 2)
      fiatFeeString = `${fiatFeeSymbol} ${fiatFeeAmountPretty}`
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
                errorMsg
                  ? <Text style={[styles.error]}>
                    {errorMsg}
                  </Text>
                  : <ExchangeRate
                    secondaryDisplayAmount={this.props.fiatPerCrypto}
                    primaryInfo={this.props.primaryCurrencyInfo}
                    secondaryInfo={this.props.secondaryCurrencyInfo} />
              }
            </View>

            <View style={[styles.main, UTILS.border('yellow'), {flex: this.state.keyboardVisible ? 0 : 1}]}>
              <ExchangedFlipInput
                primaryCurrencyInfo={this.props.primaryCurrencyInfo}
                secondaryCurrencyInfo={this.props.secondaryCurrencyInfo}
                exchangeSecondaryToPrimaryRatio={this.props.fiatPerCrypto}
                overridePrimaryExchangeAmount={this.state.overridePrimaryExchangeAmount}
                onExchangeAmountChanged={this.onExchangeAmountChanged}
                color={color} />
              <View style={[styles.feeArea]}>
                <Text style={[styles.feeAreaText]}>{networkFeeSyntax}</Text>
              </View>
              <Recipient label={label} link={''} publicAddress={publicAddress} style={styles.recipient} />
            </View>
            <View style={[styles.pendingSymbolArea]}>
              {this.props.sendConfirmation.pending === UPDATE_SPEND_PENDING_START &&
                <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, UTILS.border()]} size={'small'} />
              }
            </View>
            <View style={[styles.sliderWrap]}>
              <ABSlider
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.signBroadcastAndSave}
                sliderDisabled={this.props.sliderDisabled || this.props.sendConfirmation.pending === UPDATE_SPEND_PENDING_START} />
            </View>
          </ScrollView>
        </Gradient>
      </SafeAreaView>
    )
  }

  // onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}: {primaryDisplayAmount: string, secondaryDisplayAmount: string}) => {
  //   const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
  //   const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()
  //
  //   const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
  //   const secondaryNativeAmount = UTILS.convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)
  //
  //   const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)
  //
  //   const parsedUri = this.props.sendConfirmation.parsedUri
  //   parsedUri.metadata = {
  //     amountFiat: parseFloat(secondaryExchangeAmount)
  //   }
  //   parsedUri.nativeAmount = primaryNativeAmount
  //
  //   this.props.processParsedUri(parsedUri)
  //
  //   this.setState({
  //     primaryNativeAmount,
  //     secondaryNativeAmount
  //   })
  // }
  onExchangeAmountChanged = (amounts: ExchangedFlipInputAmounts) => {
    const amountFiatString: string = bns.mul(amounts.exchangeAmount, this.props.fiatPerCrypto.toString())
    const amountFiat: number = parseFloat(amountFiatString)
    const metadata = { amountFiat }
    const parsedUri = this.props.sendConfirmation.parsedUri
    parsedUri.nativeAmount = amounts.nativeAmount
    parsedUri.metadata = metadata

    this.props.processParsedUri(parsedUri)
  }

  signBroadcastAndSave = () => {
    const abcTransaction: AbcTransaction | null = this.props.sendConfirmation.transaction
    if (abcTransaction) {
      this.props.updateSpendPending(UPDATE_SPEND_PENDING_START)
      this.props.signBroadcastAndSave(abcTransaction)
    }
  }

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.props.primaryCurrencyInfo.exchangeDenomination.multiplier
    const primaryDisplayAmount = UTILS.convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }
}
