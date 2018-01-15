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

import type {GuiWallet, CurrencyConverter} from '../../../../types'
import type {AbcCurrencyWallet, AbcParsedUri, AbcTransaction} from 'airbitz-core-types'
import type {SendConfirmationState} from './reducer'

const DIVIDE_PRECISION = 18

export type Props = {
  sendConfirmation: SendConfirmationState,
  abcWallet: AbcCurrencyWallet,
  nativeAmount: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  guiWallet: GuiWallet,
  currencyCode: string,
  primaryInfo: FlipInputFieldInfo,
  sliderDisabled: boolean,
  secondaryInfo: FlipInputFieldInfo,
  currencyConverter: CurrencyConverter
}

export type DispatchProps = {
  processParsedUri: (AbcParsedUri) => void,
  updateSpendPending: (boolean) => void,
  signBroadcastAndSave: (AbcTransaction) => void
}

type State = {
  primaryNativeAmount: string,
  secondaryNativeAmount: string,
  keyboardVisible: boolean
}

export default class SendConfirmation extends Component<Props & DispatchProps, State> {
  constructor (props: Props & DispatchProps) {
    super(props)
    const amt = props.sendConfirmation.transaction ? props.sendConfirmation.transaction.nativeAmount : '0'

    this.state = {
      primaryNativeAmount: amt,
      secondaryNativeAmount: '',
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
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto,
      errorMsg,
      nativeAmount,
      currencyConverter,
      currencyCode
    } = this.props
    const color = 'white'

    if (transaction && bns.gt(transaction.networkFee, '0')) {
      networkFee = transaction.networkFee
      cryptoFeeSymbol = primaryInfo.displayDenomination.symbol
      cryptoFeeAmount = this.convertPrimaryNativeToDisplay(networkFee)
      cryptoFeeString = `${cryptoFeeSymbol} ${cryptoFeeAmount}`
      fiatFeeSymbol = secondaryInfo.displayDenomination.symbol
      cryptoFeeExchangeAmount = UTILS.convertNativeToExchange(primaryInfo.exchangeDenomination.multiplier)(transaction.networkFee)
      fiatFeeAmount = currencyConverter.convertCurrency(currencyCode, secondaryInfo.exchangeCurrencyCode, cryptoFeeExchangeAmount)
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
                    primaryInfo={this.props.primaryInfo}
                    secondaryInfo={this.props.secondaryInfo} />
              }
            </View>

            <View style={[styles.main, UTILS.border('yellow'), {flex: this.state.keyboardVisible ? 0 : 1}]}>
              <ExchangedFlipInput
                primaryInfo={{...primaryInfo, nativeAmount}}
                secondaryInfo={secondaryInfo}
                secondaryToPrimaryRatio={fiatPerCrypto}
                onAmountsChange={this.onAmountsChange}
                color={color} />
              <View style={[styles.feeArea]}>
                <Text style={[styles.feeAreaText]}>{networkFeeSyntax}</Text>
              </View>
              <Recipient label={label} link={''} publicAddress={publicAddress} style={styles.recipient} />
            </View>
            <View style={[styles.pendingSymbolArea]}>
              {this.props.sendConfirmation.pending &&
                <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, UTILS.border()]} size={'small'} />
              }
            </View>
            <View style={[styles.sliderWrap]}>
              <ABSlider
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.signBroadcastAndSave}
                sliderDisabled={this.props.sliderDisabled || this.props.sendConfirmation.pending} />
            </View>
          </ScrollView>
        </Gradient>
      </SafeAreaView>
    )
  }

  onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}: {primaryDisplayAmount: string, secondaryDisplayAmount: string}) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()

    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryNativeAmount = UTILS.convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)

    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)

    const parsedUri = this.props.sendConfirmation.parsedUri
    parsedUri.metadata = {
      amountFiat: parseFloat(secondaryExchangeAmount)
    }
    parsedUri.nativeAmount = primaryNativeAmount

    this.props.processParsedUri(parsedUri)

    this.setState({
      primaryNativeAmount,
      secondaryNativeAmount
    })
  }

  signBroadcastAndSave = () => {
    const abcTransaction: AbcTransaction | null = this.props.sendConfirmation.transaction
    if (abcTransaction) {
      this.props.updateSpendPending(true)
      this.props.signBroadcastAndSave(abcTransaction)
    }
  }

  getTopSpacer = () => {
    if (this.props.sendConfirmation.keyboardIsVisible) {

    } else {
      return <View style={styles.spacer} />
    }
  }

  getBottomSpacer = () => {
    if (!this.props.sendConfirmation.keyboardIsVisible) {

    } else {
      return <View style={styles.spacer} />
    }
  }

  onMaxPress = () => {}

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.props.primaryInfo.exchangeDenomination.multiplier
    const primaryDisplayAmount = UTILS.convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }

  getPrimaryNativeToDisplayRatio = () => this.props.primaryInfo.displayDenomination.multiplier

  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return bns.div(secondaryDisplayAmount, secondaryDisplayToExchangeRatio, DIVIDE_PRECISION)
  }
  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier = this.props.secondaryInfo.displayDenomination.multiplier
    const exchangeMultiplier = this.props.secondaryInfo.exchangeDenomination.multiplier
    return bns.div(exchangeMultiplier, displayMultiplier, DIVIDE_PRECISION)
  }
}
