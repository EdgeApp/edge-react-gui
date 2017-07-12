import React, { Component } from 'react'
import { Text, TextInput, View, StyleSheet, Easing, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { devStyle, border as b , getCryptoFromFiat, getFiatFromCrypto} from '../../../utils.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import FlipView from 'react-native-flip-view'
import * as Animatable from 'react-native-animatable'
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
  useMaxSatoshi
} from '../../scenes/SendConfirmation/action'

class FlipInput extends Component {
  constructor(props) {
    super(props)
  }

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
      fiatCurrencyCode
    } = this.props

    let primaryPlaceholderSyntax
    let secondaryPlaceholderSyntax
    let primaryAmountRequested
    let secondaryAmountRequested
    let primaryFeeAmount
    let secondaryFeeAmount 

    let cryptoPlaceholder = '0.00'
    let fiatPlaceholder = '0.00'
    
    if(inputCurrencySelected === 'crypto') {
      primaryDenomSymbol = this.props.cryptoDenom.symbol      
      secondaryDenomSymbol = this.props.fiatCurrencyCode      
      primaryPlaceHolderSyntax = cryptoPlaceholder
      secondaryPlaceholderSyntax = fiatPlaceholder
      primaryAmountRequested = amountSatoshi || 0
      secondaryAmountRequested = amountFiat
      primaryFeeAmount = feeInCrypto
      secondaryFeeAmount = feeInFiat
    } else {
      primaryDenomSymbol = this.props.fiatCurrencyCode
      secondaryDenomSymbol = this.props.cryptoDenom.symbol
      primaryPlaceholderSyntax = fiatPlaceholder
      secondaryPlaceholderSyntax = cryptoPlaceholder
      primaryAmountRequested =  amountFiat
      secondaryAmountRequested = amountSatoshi || 0
      primaryFeeAmount = feeInFiat
      secondaryFeeAmount = feeInCrypto
    }

    return (
      <FlipInputInsideConnect style={[b()]}
        currencySelected={inputCurrencySelected}
        mode={mode}
        primaryPlaceholder={primaryPlaceholderSyntax}
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
        />
    )
  }

  /*_renderFront = () => {
    const {
      mode,
      onCryptoInputChange,
      onFiatInputChange,
      amountSatoshi,
      amountFiat,
      onInputCurrencyToggle,
      feeInFiat,
      feeInCrypto,
      displayFees,
    } = this.props

    let cryptoPlaceholder = this.props.cryptoDenom.symbol + ' 0.00'
    let fiatPlaceholder = this.props.fiatCurrencyCode + ' 0.00'

    return (
      <FlipInputInside style={[b()]}
        currencySelected={'crypto'}
        mode={mode}
        primaryPlaceholder={cryptoPlaceholder}
        secondaryPlaceholder={fiatPlaceholder}
        onInputChange={onCryptoInputChange}
        amountRequestedPrimary={amountSatoshi || 0}
        amountRequestedSecondary={amountFiat}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} 
        inputCurrencySelected={inputCurrencySelected}   
        parentProps={this.props}     
        />
    )}

  _renderBack = () => {
    const {
      mode,
      onFiatInputChange,
      onCryptoInputChange,
      amountFiat,
      amountSatoshi,
      onInputCurrencyToggle,
      feeInFiat,
      feeInCrypto,
      displayFees,
    } = this.props

    let cryptoPlaceholder = this.props.cryptoDenom.symbol + ' 0.00'
    let fiatPlaceholder = this.props.fiatCurrencyCode + ' 0.00'    

    return (
      <FlipInputInside style={[b()]}
        currencySelected={'fiat'}
        mode={mode}
        primaryPlaceholder={fiatPlaceholder}
        secondaryPlaceholder={cryptoPlaceholder}
        onInputChange={onFiatInputChange}
        amountRequestedPrimary={amountFiat || 0}
        amountRequestedSecondary={amountSatoshi}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInFiat}
        secondaryFee={feeInCrypto}
        displayFees={displayFees}
        inputCurrencySelected={inputCurrencySelected} 
        parentProps={this.props} />
    )
  } */
}

export default connect(state => ({

})
)(FlipInput)

class FlipInputInside extends Component {
  constructor(props){
    super(props)
    this.state = {
      primaryInputValue: null,
      secondaryInputValue: null
    }
  }

  render () {
    console.log('rendering FlipInputInside, this.props is: ', this.props)    
    const {
      mode,
      onInputChange,
      amountRequestedPrimary,
      amountRequestedSecondary,
      onInputCurrencyToggle,
      primaryFee,
      secondaryFee,
      primaryPlaceholder,
      secondaryPlaceholder,
      displayFees,
    } = this.props

    const getPrimaryAmount = () => {
      console.log('inside getPrimaryAmount')
      if ([0, '', undefined, null].includes(amountRequestedPrimary)) {
        console.log('inside getPrimaryAmount, handling blank input')
        return ''
      }
      console.log('inside getPrimaryAmount, handling numerical input')
      return amountRequestedPrimary.toString()
    }

    _onInputCurrencyToggle = () => {
      console.log('SendConfirmation->onInputCurrencyToggle called')
      const { inputCurrencySelected } = this.props
      const nextInputCurrencySelected =
        inputCurrencySelected === 'crypto'
          ? 'fiat'
          : 'crypto'
        //this.props.dispatch(updateAmountSatoshiRequest(''))
        clearText('primaryInput')
        this.setState({
          primaryInputValue: null,
          secondaryInputValue: null          
        })
        this.props.dispatch(updateInputCurrencySelected(nextInputCurrencySelected))
    }

    const inputChange = ( input ) => {
      console.log('inputChange executing, input is: ', input)
      //onInputChange(input)
      this.setState({
        primaryInputValue: getPrimaryAmount(input),
        secondaryInputValue: getSecondaryAmount(input)
      })
    }

    const getSecondaryAmount = (input) => {
      // Need to figure out if primary is crypto or fiat
      console.log('calling getSecondaryAmount, input is: ', input, ' and amountRequestedSecondary is: ' , amountRequestedSecondary)
      if ([0, '', undefined, null].includes(input) || (isNaN(input) === true)) {
        console.log('value is falsy')
        return ''
      }
      console.log('value is truthy: ', input, ' , this.props.inputCurrencySelected is: ' , this.props.inputCurrencySelected )
      if(this.props.inputCurrencySelected === 'crypto'){
        return getFiatFromCrypto(Number(input), this.props.fiatPerCrypto).toFixed(2).toString()
      } else {
        console.log('about to use input.toPrecsion(12), input is: ', input)
        return getCryptoFromFiat(Number(input), this.props.fiatPerCrypto).toPrecision(12).toString()
      }
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

    getTextColor = () => {
      switch(mode) {
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
        <View style={[styles.mainInputRow, b()]}>
          <Animatable.View animation='fadeIn' style={styles.primaryInputContainer} name='InputAndFeesElement'>
            <TextInput
              ref={'primaryInput'} 
              style={[styles.primaryInput, {color: getTextColor()}]}
              placeholder={primaryPlaceholder}
              keyboardType='decimal-pad'
              onChangeText={inputChange}
              placeholderTextColor={getTextColor()}
              returnKeyType='done'
              onBlur={this.props.parentProps.inputOnBlur}
              onFocus={this.props.parentProps.inputOnFocus}
            />
          </Animatable.View>
          <Text style={[ styles.fees, { alignSelf: 'center' } ]}>{primaryDenomSymbol}</Text>
        </View>
      )
    }

    const renderConvertedInput = () => {
      return (
        <View style={[styles.convertedInputRow, b()]}>
          <Animatable.View animation='fadeIn' style={styles.secondaryTextContainer}>
            <Text style={[ styles.secondaryText,  {color: getTextColor()}]}>
              {this.state.secondaryInputValue || secondaryPlaceholder}
            </Text>
          </Animatable.View>
          <Text style={styles.fees}>{secondaryDenomSymbol}</Text>
        </View>
      )
    }

    return (
      <View style={[styles.view, b()]}>
        <View style={[styles.row, b()]}>
          <FAIcon style={styles.icon} onPress={_onInputCurrencyToggle} name='swap-vert' size={36} />
          <View style={[{flex:1}, b('red')]}>
            {renderMainInput()}
            {renderConvertedInput()}
          </View>
          { !displayFees ? <Text style={styles.currency}>{this.props.inputCurrencySelected}</Text> : null }
        </View>
      </View>
    )
  }
}
export const FlipInputInsideConnect = connect(state => ({
  fiatPerCrypto:  state.ui.scenes.exchangeRate.exchangeRates[state.ui.wallets.byId[state.ui.wallets.selectedWalletId].currencyCode].value,
})
)(FlipInputInside)