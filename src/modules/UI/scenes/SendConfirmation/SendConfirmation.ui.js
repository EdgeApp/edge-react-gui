import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRate from '../../components/ExchangeRate/index.js'
import FlipInput from '../../components/FlipInput/index.js'
import Recipient from '../../components/Recipient/index.js'
import ABSlider from '../../components/Slider/index.js'

import { getCryptoFromFiat, getFiatFromCrypto, border as b } from '../../../utils.js'
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  updateAmountSatoshiRequest,
  updateMaxSatoshiRequest,
  signBroadcastAndSave,
  useMaxSatoshi,
  updateSpendPending
} from './action.js'

class SendConfirmation extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardVisible: false
    }
    this.props.dispatch(updateAmountSatoshiRequest(this.props.amountSatoshi || 0))
  }

  _onFocus = () => {
    this.setState({keyboardVisible: true})
  }

  _onBlur = () => {
    this.setState({keyboardVisible: false})
  }

  render () {
    const {
      label,
      publicAddress
     } = this.props.sendConfirmation

    console.log('rendering SendConfirmation.ui.js->render, this.props is: ', this.props)
    return (
      <LinearGradient
        style={[styles.view]}
        start={{x: 0, y: 0}} end={{x: 1, y: 0}}
        colors={['#3b7adb', '#2b569a']}
      >
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>
          <View style={[styles.exchangeRateContainer, b()]} >
            <ExchangeRate fiatPerCrypto={this.props.fiatPerCrypto} fiatCurrencyCode={this.props.fiatCurrencyCode} cryptoDenom={this.props.inputCurrencyDenom} />
          </View>

          <View style={[styles.main, b(), {flex: this.state.keyboardVisible ? 0 : 1}]}>

            {this.props.inputCurrencySelected === 'crypto' ? (
              <FlipInput
                mode={this.props.sendConfirmation.mode}
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
              />
            ) : ( // inputCurrencySelected === 'fiat'
              <FlipInput
                mode={this.props.sendConfirmation.mode}
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
              />
            )
            }
            <Recipient label={label} link={''} publicAddress={publicAddress} />
            {/* <Password /> */}
          </View>
          <View style={[styles.pendingSymbolArea]}>
            {this.props.sendConfirmation.pending &&
              <ActivityIndicator style={[{ flex: 1, alignSelf: 'center' }, b()]} size={'small'} />
            }
          </View>
          <ABSlider style={[b()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={false} />
        </ScrollView>
      </LinearGradient>
    )
  }

  signBroadcastAndSave = () => {
    const { transaction } = this.props
    this.props.dispatch(updateSpendPending(true))
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
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const cryptoPerFiat = currencyConverter.convertCurrency(isoFiatCurrencyCode, currencyCode, 1)
  const fiatPerCrypto = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, 1)
  const index = SETTINGS_SELECTORS.getDenominationIndex(state, currencyCode)
  const inputCurrencyDenom = wallet.allDenominations[currencyCode][index]

  return {
    sendConfirmation: state.ui.scenes.sendConfirmation,
    amountSatoshi: state.ui.scenes.sendConfirmation.amountSatoshi,
    maxSatoshi: state.ui.wallets.byId[state.ui.wallets.selectedWalletId].balance,
    wallet,
    feeSatoshi: state.ui.scenes.sendConfirmation.feeSatoshi,
    fiatPerCrypto,
    cryptoPerFiat,
    inputCurrencySelected: state.ui.scenes.sendConfirmation.inputCurrencySelected,
    publicAddress: state.ui.scenes.sendConfirmation.publicAddress,
    spendInfo: state.ui.scenes.sendConfirmation.spendInfo,
    transaction: state.ui.scenes.sendConfirmation.transaction,
    inputCurrencyDenom,
    fiatCurrencyCode
  }
}
const mapDispatchToProps = (dispatch) => ({
  updateAmountSatoshi: amountSatoshi => dispatch(updateAmountSatoshiRequest(amountSatoshi)),
  signBroadcastAndSave: transaction => dispatch(signBroadcastAndSave(transaction)),
  updateMaxSatoshi: () => dispatch(updateMaxSatoshiRequest()),
  useMaxSatoshi: () => dispatch(useMaxSatoshi())
})
export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
