import React, { Component } from 'react'
import {
  View,
  Share,
  Text,
  TouchableHighlight,
  Keyboard,
  Button,
  Platform,
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import MaxButton from '../../components/MaxButton/index.js'
import FlipInput from '../../components/FlipInput/index.js'

import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'

import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Fees from '../../components/Fees/index.js'

import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput } from '../../../utils.js'
import LinearGradient from 'react-native-linear-gradient'

import {
  updateAmountSatoshiRequest,
  updateAmountFiat,
  updateFiatPerCrypto,
  updateInputCurrencySelected,
  updateLabel,
  updateMaxSatoshiRequest,
  updateDraftStatus,
  updateIsKeyboardVisible,
  signBroadcastAndSave,
  useMaxSatoshi,
} from './action.js'

class SendConfirmation extends Component {
  render () {
    const {
      amountSatoshi,
      amountFiat,
      draftStatus,
      label,
      isSliderLocked,
     } = this.props.sendConfirmation

    const {
      publicAddress
    } = this.props

    return (
      <LinearGradient
        style={styles.view}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}>

        <View style={styles.exchangeRateAndMax} >

          <View style={{ flex: 1}}>
            <ExchangeRate
              mode={draftStatus}
              style={{flex: 1}}
              fiatPerCrypto={this.props.fiatPerCrypto} />
          </View>

          <View>
            <MaxButton style={{flex: 1}}
              mode={draftStatus}
              onMaxPress={this.onMaxPress}/>
          </View>

        </View>

        <View style={styles.flipInput}>
          <FlipInput
            mode={draftStatus}
            onInputCurrencyToggle={this.onInputCurrencyToggle}
            onCryptoInputChange={this.onCryptoInputChange}
            onFiatInputChange={this.onFiatInputChange}
            amountSatoshi={this.props.amountSatoshi}
            amountFiat={this.getAmountFiat(this.props.amountSatoshi)}
            inputCurrencySelected={this.props.inputCurrencySelected}
            maxAvailableToSpendInCrypto={this.props.getMaxSatoshi}
            displayFees
            feeInCrypto={this.props.feeSatoshi}
            feeInFiat={this.getFeeInFiat(this.props.feeSatoshi)} />
        </View>

        <View style={styles.recipient}>
          <View style={{flex: 3}}>
            <Recipient label={label} address={publicAddress} />
          </View>
        </View>

        {this.getTopSpacer()}

        <View style={styles.slider}>
          <ABSlider
            style={{
              flex: 1,
            }}
            onSlidingComplete={this.signBroadcastAndSave}
            sliderDisabled={!isSliderLocked} />
        </View>

        {this.getBottomSpacer()}

      </LinearGradient>
    )
  }

  signBroadcastAndSave = () => {
    const { transaction } = this.props
    this.props.signBroadcastAndSave(transaction)
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

  onMaxPress = () => {
    this.props.useMaxSatoshi()
  }

  getDraftStatus = (amountSatoshi, maxSatoshi) => {
    let draftStatus

    if ( amountSatoshi > maxSatoshi ) {
      draftStatus = 'over'
    } else if ( amountSatoshi == maxSatoshi ) {
      draftStatus = 'max'
    } else {
      draftStatus = 'under'
    }

    return draftStatus
  }

  onInputCurrencyToggle = () => {
    const { inputCurrencySelected } = this.props
    const nextInputCurrencySelected =
      inputCurrencySelected === 'crypto'
        ? 'fiat'
        : 'crypto'

      this.props.dispatch(updateInputCurrencySelected(nextInputCurrencySelected))
  }

  onCryptoInputChange = amountSatoshi => {
    this.props.updateAmountSatoshi(parseInt(amountSatoshi))
  }

  onFiatInputChange = (amountFiat) => {
    const amountSatoshi = getCryptoFromFiat(amountFiat, this.props.fiatPerCrypto)
    this.props.updateAmountSatoshi(amountSatoshi)
  }

  getFeeInFiat = feeSatoshi => {
    const { fiatPerCrypto = 1077.75 } = this.props
    const feeFiat = getFiatFromCrypto(feeSatoshi, fiatPerCrypto)

    return feeFiat
  }

  getAmountFiat = amountSatoshi => {
    const { fiatPerCrypto = 1077.75 } = this.props
    const amountFiat = getFiatFromCrypto(amountSatoshi, fiatPerCrypto)

    return amountFiat
  }
}

const mapStateToProps = state => {
  return {
    sendConfirmation:      state.ui.scenes.sendConfirmation,
    amountSatoshi:         state.ui.scenes.sendConfirmation.amountSatoshi,
    feeSatoshi:            state.ui.scenes.sendConfirmation.feeSatoshi,
    fiatPerCrypto:         state.ui.scenes.sendConfirmation.fiatPerCrypto,
    inputCurrencySelected: state.ui.scenes.sendConfirmation.inputCurrencySelected,
    publicAddress:         state.ui.scenes.sendConfirmation.publicAddress,
    spendInfo:             state.ui.scenes.sendConfirmation.spendInfo,
    transaction:           state.ui.scenes.sendConfirmation.transaction,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateAmountSatoshi: amountSatoshi => dispatch(updateAmountSatoshiRequest(amountSatoshi)),
    updateAmountFiat:       amountFiat => dispatch(updateAmountFiatRequest(amountFiat)),
    toggleCurrencyInput:            () => dispatch(toggleCurrencyInput()),
    signBroadcastAndSave:  transaction => dispatch(signBroadcastAndSave(transaction)),
    updateMaxSatoshi:               () => dispatch(updateMaxSatoshiRequest()),
    useMaxSatoshi:                  () => dispatch(useMaxSatoshi()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
