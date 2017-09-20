import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import ExchangedFlipInput from '../../components/FlipInput/ExchangedFlipInput.js'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'

import Gradient from '../../components/Gradient/Gradient.ui'

import * as UTILS from '../../../utils.js'
import type {GuiWallet, GuiCurrencyInfo} from '../../../../types'
import type {AbcCurrencyWallet, AbcParsedUri, AbcTransaction} from 'airbitz-core-types'
import type {SendConfirmationState} from './reducer'

type Props = {
  sendConfirmation: SendConfirmationState,
  abcWallet: AbcCurrencyWallet,
  nativeAmount: string,
  errorMsg: string | null,
  fiatPerCrypto: number,
  wallet: GuiWallet,
  currencyCode: string,
  primaryInfo: GuiCurrencyInfo,
  sliderDisabled: boolean,
  secondaryInfo: GuiCurrencyInfo,
  processUri(AbcParsedUri): void
}

export default class SendConfirmation extends Component<any, any, any> {
  state: {
    primaryNativeAmount: string,
    secondaryNativeAmount: string,
    keyboardVisible: boolean
  }

  constructor (props: Props) {
    super(props)
    const amt = props.sendConfirmation.transaction ? props.sendConfirmation.transaction.nativeAmount : '0'
    this.state = {
      primaryNativeAmount: amt,
      secondaryNativeAmount: '',
      keyboardVisible: false
    }
  }
  _onFocus = () => this.setState({keyboardVisible: true})
  _onBlur = () => this.setState({keyboardVisible: false})

  componentDidMount () {
    this.props.processParsedUri(this.props.sendConfirmation.parsedUri)
  }

  onAmountsChange = ({primaryDisplayAmount, secondaryDisplayAmount}) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const secondaryNativeToDenominationRatio = this.props.secondaryInfo.displayDenomination.multiplier.toString()

    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)
    const secondaryNativeAmount = UTILS.convertDisplayToNative(secondaryNativeToDenominationRatio)(secondaryDisplayAmount)

    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)

    const parsedUri = this.props.sendConfirmation.parsedUri
    parsedUri.metadata = {
      amountFiat: secondaryExchangeAmount
    }
    parsedUri.nativeAmount = primaryNativeAmount

    this.props.processParsedUri(parsedUri)

    this.setState({
      primaryNativeAmount,
      secondaryNativeAmount
    })
  }

  render () {
    const {
      label,
      publicAddress
     } = this.props.sendConfirmation
    const {
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto,
      errorMsg,
      nativeAmount
    } = this.props
    // console.log('nativeAmount', nativeAmount)
    const color = 'white'

    // console.log('rendering SendConfirmation.ui.js->render, this.props is: ', this.props)
    return (
      <Gradient style={[styles.view]}>
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>

          <View style={[styles.exchangeRateContainer, UTILS.border()]}>
            {
              errorMsg
                ? <Text style={[styles.error]}>
                  {errorMsg}
                </Text>
                :                <ExchangeRate
                  secondaryDisplayAmount={this.props.fiatPerCrypto}
                  primaryInfo={this.props.primaryInfo}
                  secondaryInfo={this.props.secondaryInfo} />
            }
          </View>

          <View style={[styles.main, UTILS.border(), {flex: this.state.keyboardVisible ? 0 : 1}]}>
            <ExchangedFlipInput
              primaryInfo={{...primaryInfo, nativeAmount}}
              secondaryInfo={secondaryInfo}
              secondaryToPrimaryRatio={fiatPerCrypto}
              onAmountsChange={this.onAmountsChange}
              color={color} />
            {/* <ExchangedFees networkFee={networkFee} providerFee={providerFee} /> */}
            <Recipient label={label} link={''} publicAddress={publicAddress} />
            {/* <Password /> */}
          </View>
          <View style={[styles.pendingSymbolArea]}>
            {this.props.sendConfirmation.pending
              && <ActivityIndicator style={[{flex: 1, alignSelf: 'center'}, UTILS.border()]} size={'small'} />
            }
          </View>
          <ABSlider style={[UTILS.border()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={this.props.sliderDisabled} />
        </ScrollView>
      </Gradient>
    )
  }

  signBroadcastAndSave = () => {
    const abcTransaction: AbcTransaction = this.props.sendConfirmation.transaction
    this.props.updateSpendPending(true)
    this.props.signBroadcastAndSave(abcTransaction)
  }

  getTopSpacer = () => {
    if (this.props.sendConfirmation.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  getBottomSpacer = () => {
    if (!this.props.sendConfirmation.keyboardIsVisible) {
      return
    } else {
      return <View style={styles.spacer} />
    }
  }

  onMaxPress = () => {}

  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return (UTILS.convertDisplayToExchange(secondaryDisplayToExchangeRatio)(secondaryDisplayAmount)).toString()
  }
  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier = this.props.secondaryInfo.displayDenomination.multiplier.toString()
    const exchangeMultiplier = this.props.secondaryInfo.exchangeDenomination.multiplier.toString()
    return (UTILS.deriveDisplayToExchangeRatio(exchangeMultiplier)(displayMultiplier)).toString()
  }
}

SendConfirmation.propTypes = {
  sendConfirmation: PropTypes.object,
  fiatPerCrypto: PropTypes.number,
  inpurCurrencyDenom: PropTypes.string,
  fiatCurrencyCode: PropTypes.string
}
