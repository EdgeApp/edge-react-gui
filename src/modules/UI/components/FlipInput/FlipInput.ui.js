import React, { Component } from 'react'
import { Text, TextInput, View, StyleSheet, Easing, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { devStyle } from '../../../utils.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import FlipView from 'react-native-flip-view'

const CRYPTO_PLACEHOLDER = 'C 0.00'
const FIAT_PLACEHOLDER   = 'F 0.00'

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
      amountSatoshi,
      amountFiat,
      onInputCurrencyToggle,
      feeInFiat,
      feeInCrypto,
      displayFees,
      inputCurrencySelected,
      fiatCurrencyCode
    } = this.props

    return (
      <FlipInputInside
        currencySelected={'crypto'}
        mode={mode}
        primaryPlaceholder={this.props.cryptoDenom.symbol + ' 0.00'}
        secondaryPlaceholder={this.props.fiatCurrencyCode + ' 0.00'}
        onInputChange={onCryptoInputChange}
        amountRequestedPrimary={amountSatoshi}
        amountRequestedSecondary={amountFiat}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} 
        inputCurrencySelected={inputCurrencySelected}  
        />
    )
  }

  _renderFront = () => {
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

    return (
      <FlipInputInside
        currencySelected={'crypto'}
        mode={mode}
        primaryPlaceholder={this.props.cryptoDenom.symbol + ' 0.00'}
        secondaryPlaceholder={this.props.fiatCurrencyCode + ' 0.00'}
        onInputChange={onCryptoInputChange}
        amountRequestedPrimary={amountSatoshi}
        amountRequestedSecondary={amountFiat}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} 
        inputCurrencySelected={inputCurrencySelected}        
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

    return (
      <FlipInputInside
        currencySelected={'fiat'}
        mode={mode}
        primaryPlaceholder={this.props.fiatCurrencyCode + ' 0.00'}
        secondaryPlaceholder={this.props.cryptoDenom.symbol + ' 0.00'}
        onInputChange={onFiatInputChange}
        amountRequestedPrimary={amountFiat}
        amountRequestedSecondary={amountSatoshi}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInFiat}
        secondaryFee={feeInCrypto}
        displayFees={displayFees}
        inputCurrencySelected={inputCurrencySelected} />
    )
  }
}

export default connect(state => ({
  sendConfirmation: state.ui.scenes.sendConfirmation
})
)(FlipInput)

class FlipInputInside extends Component {

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
      if ([0, '', undefined, null].includes(amountRequestedPrimary)) {
        return ''
      }
      return amountRequestedPrimary.toString()
    }

    const getSecondaryAmount = () => {
      if ([0, '', undefined, null].includes(amountRequestedSecondary)) {
        return ''
      }
      return amountRequestedSecondary.toString()
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

    const renderMainInput = () => {
      return (
        <View style={styles.mainInputRow}>
          <View style={styles.primaryInputContainer} name='InputAndFeesElement'>
            <TextInput
              style={[styles.primaryInput, {color: getTextColor()}]}
              value={getPrimaryAmount()}
              placeholder={primaryPlaceholder}
              keyboardType='numeric'
              onChangeText={onInputChange}
              placeholderTextColor={getTextColor()}
            />
          </View>
          { displayFees ? <Text style={[ styles.fees, { alignSelf: 'center' } ]}> + { this.props.cryptoDenom.symbol } 0.026</Text> : null }
          {/* { displayFees ? <Text style={styles.fees}> + b{primaryFee}</Text> : null } */}
        </View>
      )
    }

    const renderConvertedInput = () => {
      return (
        <View style={styles.convertedInputRow}>
          <View style={styles.secondaryTextContainer}>
            <Text style={[ styles.secondaryText,  {color: getTextColor()}]}>
              {getSecondaryAmount() || secondaryPlaceholder}
            </Text>
          </View>
          { displayFees ? <Text style={styles.fees}> + {this.props.fiatCurrencyCode} 0.95</Text> : null }
          {/* { displayFees ? <Text style={styles.fees}> + ${secondaryFee}</Text> : null } */}
        </View>
      )
    }

    return (
      <View style={styles.view}>
        <View style={styles.row}>
          <FAIcon style={styles.icon} onPress={onInputCurrencyToggle} name='swap-vert' size={36} />
          <View style={{flex:1}}>
            {renderMainInput()}
            {renderConvertedInput()}
          </View>
          { !displayFees ? <Text style={styles.currency}>{this.props.inputCurrencySelected}</Text> : null }
          {/* { !displayFees ? <Text style={styles.currency}>{currency}</Text> : null } */}
        </View>
      </View>
    )
  }

}
