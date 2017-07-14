import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Share,
  Text,
  TouchableHighlight,
  Keyboard,
  Button,
  Platform,
  ScrollView
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import MaxButton from '../../components/MaxButton/index.js'
import FlipInput from '../../components/FlipInput/index.js'
import Password from './SendConfirmationPasswordSample.js'

import ABQRCode from '../../components/QRCode/index.js'
import RequestStatus from '../../components/RequestStatus/index.js'
import ShareButtons from '../../components/ShareButtons/index.js'

import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'
import Fees from '../../components/Fees/index.js'

import { getCryptoFromFiat, getFiatFromCrypto, sanitizeInput, border as b } from '../../../utils.js'
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
  constructor(props) {
    super(props)
    this.state = {
      keyboardVisible: false
    }
  }

  _onFocus = () => {
    this.setState({keyboardVisible: true})
  }

  _onBlur = () => {
    this.setState({keyboardVisible: false})
  }

  render () {
    const {
      amountSatoshi,
      amountFiat,
      label,
      isSliderLocked,
     } = this.props.sendConfirmation

    console.log('rendering SendConfirmation.ui.js->render, this.props is: ', this.props)
    return (
      <LinearGradient
        style={[styles.view]}
        start={{x:0,y:0}} end={{x:1, y:0}}
        colors={["#3b7adb","#2b569a"]}
      >
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>
          <View style={[styles.exchangeRateContainer, b()]} >
            <ExchangeRate mode={this.getDraftStatus(this.props.amountSatoshi)} fiatPerCrypto={this.props.fiatPerCrypto} fiatCurrencyCode={this.props.fiatCurrencyCode} cryptoDenom={this.props.inputCurrencyDenom}  />
          </View>

          <View style={[styles.main, b(), {flex: this.state.keyboardVisible ? 0 : 1}]}>

            {this.props.inputCurrencySelected === 'crypto' ? (
              <FlipInput
                mode={this.getDraftStatus(this.props.amountSatoshi)}
                onCryptoInputChange={this.onCryptoInputChange}
                onFiatInputChange={this.onFiatInputChange}
                onInputChange={this.onCryptoInputChange}
                amountSatoshi={this.props.amountSatoshi || 0}
                amountFiat={this.getAmountFiat(this.props.amountSatoshi)}
                inputCurrencySelected={this.props.inputCurrencySelected} // crypto
                maxAvailableToSpendInCrypto={this.props.maxSatoshi}
                displayFees
                feeInCrypto={this.props.feeSatoshi}
                feeInFiat={this.getFeeInFiat(this.props.feeSatoshi)}
                cryptoDenom={this.props.inputCurrencyDenom}
                fiatCurrencyCode={this.props.fiatCurrencyCode}   
                inputOnFocus={this._onFocus}
                inputOnBlur={this._onBlur}
                clearInput={this.clearInput}      
                checkMax={this.getDraftStatus}    
              />
            ) : ( // inputCurrencySelected === 'fiat'
               <FlipInput
                mode={this.getDraftStatus(this.props.amountSatoshi)}
                onCryptoInputChange={this.onCryptoInputChange}
                onFiatInputChange={this.onFiatInputChange}
                onInputChange={this.onFiatInputChange}
                amountSatoshi={this.props.amountSatoshi || 0}
                amountFiat={this.getAmountFiat(this.props.amountSatoshi)}
                inputCurrencySelected={this.props.inputCurrencySelected} // fiat
                maxAvailableToSpendInCrypto={this.props.maxSatoshi}
                displayFees
                feeInCrypto={this.props.feeSatoshi}
                feeInFiat={this.getFeeInFiat(this.props.feeSatoshi)}
                cryptoDenom={this.props.inputCurrencyDenom}
                fiatCurrencyCode={this.props.fiatCurrencyCode}   
                inputOnFocus={this._onFocus}
                inputOnBlur={this._onBlur} 
                clearInput={this.clearInput}   
                checkMax={this.getDraftStatus}                    
              />
              )
            }
            {/* <Recipient label={label} address={publicAddress} /> */}
            <Recipient label={'Ashley Rind'} address={this.props.recipientPublicAddress} />
            {/* <Password /> */}
          </View>

          <ABSlider style={[b()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={!isSliderLocked} />
        </ScrollView>
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

  getDraftStatus = (amountSatoshi) => {
    console.log('inGetDraftStatus, amountSatoshi is: ', amountSatoshi , ' , and this.props.maxSatoshi is: ', this.props.maxSatoshi)
    let draftStatus

    if ( amountSatoshi > this.props.maxSatoshi ) {
      draftStatus = 'over'
    } else if ( amountSatoshi == this.props.maxSatoshi ) {
      draftStatus = 'max'
    } else {
      draftStatus = 'under'
    }

    return draftStatus
  }

  onCryptoInputChange = amountSatoshi => {
    console.log('in onCryptoInputChange')
    this.props.updateAmountSatoshi(parseInt(amountSatoshi))
  }

  onFiatInputChange = (amountFiat) => {
    console.log('in onFiatInputChange')
    const amountSatoshi = getCryptoFromFiat(amountFiat, this.props.fiatPerCrypto)
    this.props.updateAmountSatoshi(amountSatoshi)
  }

  getFeeInFiat = feeSatoshi => {
    const fiatPerCrypto = this.props.fiatPerCrypto
    const feeFiat = getFiatFromCrypto(feeSatoshi, fiatPerCrypto)

    return feeFiat
  }

  getAmountFiat = amountSatoshi => {
    console.log('in getAmountFiat')
    const fiatPerCrypto = this.props.fiatPerCrypto
    const amountFiat = getFiatFromCrypto(amountSatoshi, fiatPerCrypto).toFixed(2) // also need opposite

    return amountFiat
  }
}

SendConfirmation.propTypes = {
  sendConfirmation: PropTypes.object,
  fiatPerCrypto: PropTypes.number,
  inpurCurrencyDenom: PropTypes.string,
  fiatCurrencyCode: PropTypes.string
}

const mapStateToProps = state => {
  return {
    sendConfirmation:      state.ui.scenes.sendConfirmation,
    amountSatoshi:         state.ui.scenes.sendConfirmation.amountSatoshi,
    maxSatoshi:            state.ui.wallets.byId[state.ui.wallets.selectedWalletId].balance ,
    wallet: state.ui.wallets.byId[state.ui.wallets.selectedWalletId],
    feeSatoshi:            state.ui.scenes.sendConfirmation.feeSatoshi,
    fiatPerCrypto:         state.ui.scenes.exchangeRate.exchangeRates[state.ui.wallets.byId[state.ui.wallets.selectedWalletId].currencyCode].value,
    inputCurrencySelected: state.ui.scenes.sendConfirmation.inputCurrencySelected,
    // publicAddress:         state.ui.scenes.sendConfirmation.publicAddress,
    spendInfo:             state.ui.scenes.sendConfirmation.spendInfo,
    transaction:           state.ui.scenes.sendConfirmation.transaction,
    inputCurrencyDenom: state.ui.wallets.byId[state.ui.wallets.selectedWalletId].denominations[state.ui.settings[state.ui.wallets.byId[state.ui.wallets.selectedWalletId].currencyCode].denomination -1]  ,
    fiatCurrencyCode: state.core.wallets.byId[state.ui.wallets.selectedWalletId].fiatCurrencyCode
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
