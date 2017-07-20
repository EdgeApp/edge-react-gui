import React, {Component} from 'react'
import {
  Animated,
  Text,
  TextInput,
  View,
  StyleSheet,
  Easing,
  TouchableOpacity
} from 'react-native'
import {connect} from 'react-redux'
import styles from './styles.js'
import {devStyle, border as b, getCryptoFromFiat, getFiatFromCrypto } from '../../../utils.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import FlipView from 'react-native-flip-view'
import * as Animatable from 'react-native-animatable'
import {
  updateAmountSatoshiRequest,
  updateAmountSatoshi,
  updateAmountFiat,
  updateFiatPerCrypto,
  updateInputCurrencySelected,
  updateLabel,
  updateMaxSatoshiRequest,
  updateDraftStatus,
  updateIsKeyboardVisible,
  signBroadcastAndSave,
  useMaxSatoshi
} from '../../scenes/SendConfirmation/action'

import {updateInputCurrencySelected as updateRequestInputCurrency} from '../../scenes/Request/action'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'

import * as SEND_ACTIONS from '../../scenes/SendConfirmation/action.js'
import * as REQUEST_ACTIONS from '../../Request/action.js'

class FlipInput extends Component {
  render () {
    console.log('rendering FlipInput, this.props is: ', this.props)
    const {
      mode,
      onCryptoInputChange,
      onFiatInputChange,
      onInputChange,
      amountSatoshi,
      amountFiat,
      onInputCurrencyToggle,
      feeInFiat,
      feeInCrypto,
      displayFees,
      inputCurrencySelected,
      fiatCurrencyCode,
      cryptoDenom
    } = this.props

    let primaryPlaceholderSyntax
    let secondaryPlaceholderSyntax
    let primaryAmountRequested
    let secondaryAmountRequested
    let primaryFeeAmount
    let secondaryFeeAmount

    let cryptoPlaceholder = '0.00'
    let fiatPlaceholder = '0.00'

    if (inputCurrencySelected === 'crypto') {
      primaryDenomSymbol = this.props.cryptoDenom.symbol
      secondaryDenomSymbol = this.props.fiatCurrencyCode
      primaryPlaceHolderSyntax = cryptoPlaceholder
      secondaryPlaceholderSyntax = fiatPlaceholder
      primaryAmountRequested = amountSatoshi || 0
      secondaryAmountRequested = amountFiat
      primaryFeeAmount = feeInCrypto
      secondaryFeeAmount = feeInFiat
      checkAgainstMax = this.props.checkMax
    } else {
      primaryDenomSymbol = this.props.fiatCurrencyCode
      secondaryDenomSymbol = this.props.cryptoDenom.symbol
      primaryPlaceholderSyntax = fiatPlaceholder
      secondaryPlaceholderSyntax = cryptoPlaceholder
      primaryAmountRequested = amountFiat
      secondaryAmountRequested = amountSatoshi || 0
      primaryFeeAmount = feeInFiat
      secondaryFeeAmount = feeInCrypto
      checkAgainstMax = this.props.checkMax
    }

    return (
      <FlipInputInsideConnect style={[b()]}
        currencySelected={inputCurrencySelected}
        mode={this.props.mode}
        primaryPlaceholder={secondaryPlaceholderSyntax}
        secondaryPlaceholder={secondaryPlaceholderSyntax}
        onInputChange={onInputChange}
        amountRequestedPrimary={primaryAmountRequested}
        amountRequestedSecondary={secondaryAmountRequested}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={primaryFeeAmount}
        secondaryFee={secondaryFeeAmount}
        primaryDenomSymbol={primaryDenomSymbol}
        secondaryDenomSymbol={secondaryDenomSymbol}
        displayFees={displayFees}
        inputCurrencySelected={inputCurrencySelected}
        parentProps={this.props}
        checkMax={checkAgainstMax}
        cryptoDenom={cryptoDenom}
      />
    )
  }
}

export default connect(state => ({}))(FlipInput)

class FlipInputInside extends Component {
  constructor (props) {
    console.log('in FlipInput constructor')
    super(props)
    this.state = {
      primaryInputValue: '',
      secondaryInputValue: '',
      flipInputOpacity: new Animated.Value(1),
      mode: this.props.mode
    }
  }

  render () {
    console.log('rendering FlipInputInside, this.props is: ', this.props)
    const {
      onInputChange,
      amountRequestedPrimary,
      amountRequestedSecondary,
      onInputCurrencyToggle,
      primaryFee,
      secondaryFee,
      primaryPlaceholder,
      secondaryPlaceholder,
      displayFees,
      cryptoDenom
    } = this.props

    const getPrimaryAmount = () => { // this function may need to be integrated with inputChange
      console.log('inside getPrimaryAmount')
      if ([0, '', undefined, null ].includes(amountRequestedPrimary)) {
        console.log('inside getPrimaryAmount, handling blank input')
        return ''
      }
      console.log('inside getPrimaryAmount, handling numerical input')
      return amountRequestedPrimary.toString()
    }

    _onInputCurrencyToggle = () => {
      console.log('SendConfirmation->onInputCurrencyToggle called')
      const {inputCurrencySelected} = this.props
      const nextInputCurrencySelected = inputCurrencySelected === 'crypto'
        ? 'fiat'
        : 'crypto'

      Animated.timing(this.state.flipInputOpacity, {
        toValue: 0,
        duration: 100
      }).start(() => {
        this.setState({primaryInputValue: '', secondaryInputValue: '' })
        inputChange(0)

        if (this.props.scene.sceneKey === 'sendConfirmation') {
          this.props.dispatch(updateInputCurrencySelected(nextInputCurrencySelected))
        } else if (this.props.scene.sceneKey === 'request') {
          this.props.dispatch(updateRequestInputCurrency(nextInputCurrencySelected))
        }
        clearText('primaryInput')
        Animated.timing(this.state.flipInputOpacity, {
          toValue: 1,
          duration: 100
        }).start()
      })
    }

    const animateFlipInput = () => {
      console.log('wihtin animateFlipInput')
    }

    const limitFiatDecimals = (num) => {
      console.log('num: ', num)
      let inputString = num
      let periodPosition = inputString.indexOf('.')
      console.log('periodPosition: ', periodPosition)
      let first
      let second
      if (periodPosition > -1) {
        first = inputString.split('.')[0]
        console.log('first: ', first)
        second = inputString.split('.')[1]
        console.log('second: ', second)
        if (second.length > 2) {
          return first + '.' + second.slice(0, 2)
        } else {
          return first + '.' + second
        }
      } else {
        return num
      }
    }

    const inputChange = (input) => {
      console.log('inputChange executing, input is: ', input)
      // onInputChange(input)
      this.setState({
        primaryInputValue: (this.props.inputCurrencySelected === 'crypto')
          ? input
          : limitFiatDecimals(input.toString()),
        secondaryInputValue: getSecondaryAmount(input)
      }, () => {
        console.log('in inputChange, this.state is: ', this.state, ' and input is: ', input, ' , and this.props.inputCurrencySelected is: ', this.props.inputCurrencySelected)

        if (this.props.inputCurrencySelected === 'crypto') { // Change Crypto Input //////////////
          if (this.props.scene.sceneKey === 'sendConfirmation') { // Send //////////////////////////
            this.setState({
              mode: this.props.checkMax(this.state.primaryInputValue)
            })
            const amountSatoshi = this.state.primaryInputValue
            const amountInBaseDenomination = amountSatoshi * this.props.cryptoDenom.multiplier
            this.props.dispatch(SEND_ACTIONS.updateAmountSatoshiRequest(amountInBaseDenomination))
          } else { // Request ////////////////////////////////////////////////////////////////////
            this.props.dispatch(REQUEST_ACTIONS.updateAmountRequestedInCrypto(this.state.primaryInputValue))
            this.props.dispatch(REQUEST_ACTIONS.updateAmountRequestedInCrypto(this.state.primaryInputValue))
          }
        } else { // Change Fiat Input ////////////////////////////////////////////////////////////
          if (this.props.scene.sceneKey === 'sendConfirmation') { // Send //////////////////////////
            this.setState({
              mode: this.props.checkMax(getAmountFiat(this.state.primaryInputValue))
            })
            const amountSatoshi = Number(getCryptoFromFiat(Number(input), this.props.fiatPerCrypto).toPrecision(12))
            const amountInBaseDenomination = amountSatoshi * this.props.cryptoDenom.multiplier
            this.props.dispatch(SEND_ACTIONS.updateAmountSatoshiRequest(amountInBaseDenomination))
          } else { // Request ////////////////////////////////////////////////////////////////////
            this.props.dispatch(REQUEST_ACTIONS.updateAmountRequestedInFiat(Number(input)))
            this.props.dispatch(REQUEST_ACTIONS.updateAmountRequestedInCrypto(Number(getCryptoFromFiat(Number(input), this.props.fiatPerCrypto).toPrecision(12).toString())))
          }
        }
      })
    }

    const getSecondaryAmount = (input) => {
      // Need to figure out if primary is crypto or fiat
      console.log('calling getSecondaryAmount, input is: ', input, ' and amountRequestedSecondary is: ', amountRequestedSecondary)
      if ([0, '', undefined, null ].includes(input) || (isNaN(input) === true)) {
        console.log('value is falsy')
        return ''
      }
      console.log('value is truthy: ', input, ' , this.props.inputCurrencySelected is: ', this.props.inputCurrencySelected)
      if (this.props.inputCurrencySelected === 'crypto') {
        return getFiatFromCrypto(Number(input), this.props.fiatPerCrypto).toFixed(2).toString()
      } else {
        console.log('about to use input.toPrecsion(12), input is: ', input)
        return getCryptoFromFiat(Number(input), this.props.fiatPerCrypto).toPrecision(12).toString()
      }
    }

    onCryptoInputChange = amountSatoshi => {
      console.log('in onCryptoInputChange')
      this.props.updateAmountSatoshiRequest(parseInt(amountSatoshi))
    }

    onFiatInputChange = (amountFiat) => {
      console.log('in onFiatInputChange')
      const amountSatoshi = getCryptoFromFiat(amountFiat, this.props.fiatPerCrypto)
      this.props.updateAmountSatoshiRequest(amountSatoshi)
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

    getTextColor = () => {
      console.log('inside getTextColor:, this.state.mode is: ', this.state.mode)
      switch (this.props.mode) {
        case 'over':
          return '#F03A47'
        case 'max':
          return '#F6A623'
        default:
          return 'white'
      }
    }

    const clearText = (fieldName) => {
      this.refs[fieldName].setNativeProps({text: ''})
    }

    const renderMainInput = () => {
      return (
        <View style={[styles.mainInputRow, b() ]}>
          <View style={[styles.primaryInputContainer, b() ]} name='InputAndFeesElement'>
            <Animated.View style={{
              opacity: this.state.flipInputOpacity
            }}>
              <TextInput style={[
                styles.primaryInput, {
                  color: getTextColor()
                }
              ]}
                ref={'primaryInput'}
                autoCorrect={false}
                placeholder={primaryPlaceholder}
                value={this.state.primaryInputValue.toString()}
                keyboardType='decimal-pad'
                onChangeText={inputChange}
                placeholderTextColor={getTextColor()}
                returnKeyType='done'
                onBlur={this.props.parentProps.inputOnBlur}
                onFocus={this.props.parentProps.inputOnFocus} />
            </Animated.View>
          </View>
          <Animated.View style={[
            {
              opacity: this.state.flipInputOpacity,
              alignSelf: 'center'
            },
            b()
          ]}>
            <Text style={[
              styles.fees,
              b(), {
                color: getTextColor()
              }
            ]}>{primaryDenomSymbol}</Text>
          </Animated.View>
        </View>
      )
    }

    const renderConvertedInput = () => {
      return (
        <Animated.View style={[
          styles.convertedInputRow,
          b(), {
            opacity: this.state.flipInputOpacity
          }
        ]}>
          <View style={styles.secondaryTextContainer}>
            <Text style={[
              styles.secondaryText, {
                color: getTextColor()
              }
            ]}>
              {this.state.secondaryInputValue || secondaryPlaceholder}
            </Text>
          </View>
          <View style={[
            {
              alignItems: 'center'
            },
            b()
          ]}>
            <Text style={[
              styles.fees,
              b(), {
                color: getTextColor()
              }
            ]}>{secondaryDenomSymbol}</Text>
          </View>
        </Animated.View>
      )
    }

    return (
      <View style={[styles.view]}>
        <Animated.View style={[styles.row]}>
          <FAIcon style={styles.icon} onPress={_onInputCurrencyToggle} name='swap-vert' size={36} />
          <View style={[{
            flex: 1
          }
          ]}>
            {renderMainInput()}
            {renderConvertedInput()}
          </View>
        </Animated.View>
      </View>
    )
  }
}
export const FlipInputInsideConnect = connect(state => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const cryptoPerFiat = currencyConverter.convertCurrency(isoFiatCurrencyCode, currencyCode, 1)
  const fiatPerCrypto = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, 1)

  return {
    cryptoPerFiat,
    fiatPerCrypto,
    maxSatoshi: state.ui.wallets.byId[state.ui.wallets.selectedWalletId].balance,
    scene: state.routes.scene
  }
})(FlipInputInside)
