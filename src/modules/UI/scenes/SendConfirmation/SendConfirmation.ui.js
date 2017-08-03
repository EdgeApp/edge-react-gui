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

import { getCryptoFromFiat, getFiatFromCrypto, border } from '../../../utils.js'
import LinearGradient from 'react-native-linear-gradient'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import {
  updateCryptoAmountRequest,
  useMaxCryptoAmount,
  signBroadcastAndSave,

  updateAmountSatoshiRequest,
  updateMaxSatoshiRequest,
  useMaxSatoshi,
  updateSpendPending
} from './action.js'

class SendConfirmation extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardVisible: false
    }
    this.props.dispatch(updateAmountSatoshiRequest(this.props.cryptoAmount || 0))
  }
  _onFocus = () => this.setState({keyboardVisible: true})
  _onBlur = () => this.setState({keyboardVisible: false})

  componentDidMount () {
    this.processURI(uri)
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
        colors={['#3b7adb', '#2b569a']}>
        <ScrollView style={[styles.mainScrollView]} keyboardShouldPersistTaps={'always'}>

          <View style={[styles.exchangeRateContainer, border()]} >
            <ExchangeRate fiatPerCrypto={this.props.fiatPerCrypto} fiatCurrencyCode={this.props.fiatCurrencyCode} cryptoDenom={this.props.inputCurrencyDenom} />
          </View>

          <View style={[styles.main, border(), {flex: this.state.keyboardVisible ? 0 : 1}]}>

            {this.props.inputCurrencySelected === 'crypto' ? (
              <FlipInput
                mode={this.props.sendConfirmation.mode}
                onCryptoInputChange={this.onCryptoInputChange}
                onFiatInputChange={this.onFiatInputChange}
                cryptoAmount={this.props.cryptoAmount || 0}
                fiatAmount={this.getFiatAmount(this.props.cryptoAmount)}
                inputCurrencySelected={this.props.inputCurrencySelected} // crypto
                maxCryptoAmount={this.props.maxCryptoAmount}
                displayFees
                cryptoFee={this.props.cryptoFee}
                fiatFee={this.getFiatFee(this.props.cryptoFee)}
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
                cryptoAmount={this.props.cryptoAmount || 0}
                fiatAmount={this.getFiatAmount(this.props.cryptoAmount)}
                inputCurrencySelected={this.props.inputCurrencySelected} // fiat
                maxCryptoAmount={this.props.maxCryptoAmount}
                displayFees
                cryptoFee={this.props.cryptoFee}
                fiatFee={this.getFiatFee(this.props.cryptoFee)}
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
              <ActivityIndicator style={[{ flex: 1, alignSelf: 'center' }, border()]} size={'small'} />
            }
          </View>
          <ABSlider style={[border()]} onSlidingComplete={this.signBroadcastAndSave} sliderDisabled={false} />
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

  onCryptoInputChange = cryptoAmount => {
    console.log('in onCryptoInputChange')
    this.props.updateAmountSatoshi(parseInt(cryptoAmount))
  }

  onFiatInputChange = (fiatAmount) => {
    console.log('in onFiatInputChange')
    const cryptoAmount = getCryptoFromFiat(fiatAmount, this.props.fiatPerCrypto)
    this.props.updateAmountSatoshi(cryptoAmount)
  }

  getFiatFee = cryptoFee => {
    const fiatPerCrypto = this.props.fiatPerCrypto
    const feeFiat = getFiatFromCrypto(cryptoFee, fiatPerCrypto)

    return feeFiat
  }

  getFiatAmount = cryptoAmount => {
    console.log('in getFiatAmount')
    const fiatPerCrypto = this.props.fiatPerCrypto
    const fiatAmount = getFiatFromCrypto(cryptoAmount, fiatPerCrypto).toFixed(2) // also need opposite

    return fiatAmount
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
    cryptoAmount: state.ui.scenes.sendConfirmation.cryptoAmount,
    maxCryptoAmount: state.ui.wallets.byId[state.ui.wallets.selectedWalletId].balance,
    wallet,
    cryptoFee: state.ui.scenes.sendConfirmation.cryptoFee,
    fiatPerCrypto,
    cryptoPerFiat,
    inputCurrencySelected: state.ui.scenes.sendConfirmation.inputCurrencySelected,
    publicAddress: state.ui.scenes.sendConfirmation.publicAddress,
    transaction: state.ui.scenes.sendConfirmation.transaction,
    inputCurrencyDenom,
    fiatCurrencyCode
  }
}
const mapDispatchToProps = (dispatch) => ({
  updateCryptoAmount: cryptoAmount => dispatch(updateCryptoAmountRequest(cryptoAmount)),
  updateAmountSatoshi: cryptoAmount => dispatch(updateAmountSatoshiRequest(cryptoAmount)),
  signBroadcastAndSave: transaction => dispatch(signBroadcastAndSave(transaction)),
  updateMaxSatoshi: () => dispatch(updateMaxSatoshiRequest()),
  useMaxSatoshi: () => dispatch(useMaxSatoshi())
})
export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmation)
