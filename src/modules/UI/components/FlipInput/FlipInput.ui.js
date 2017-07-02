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

  render () {

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
        primaryPlaceholder={'c 0.00'}
        secondaryPlaceholder={'f 0.00'}
        onInputChange={onCryptoInputChange}
        amountRequestedPrimary={amountSatoshi}
        amountRequestedSecondary={amountFiat}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} />
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
        primaryPlaceholder={'c 0.00'}
        secondaryPlaceholder={'f 0.00'}
        onInputChange={onCryptoInputChange}
        amountRequestedPrimary={amountSatoshi}
        amountRequestedSecondary={amountFiat}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} />
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
        primaryPlaceholder={'f 0.00'}
        secondaryPlaceholder={'c 0.00'}
        onInputChange={onFiatInputChange}
        amountRequestedPrimary={amountFiat}
        amountRequestedSecondary={amountSatoshi}
        onInputCurrencyToggle={onInputCurrencyToggle}
        primaryFee={feeInFiat}
        secondaryFee={feeInCrypto}
        displayFees={displayFees} />
    )
  }
}

export default connect(state => ({
  sendConfirmation: state.ui.sendConfirmation
})
)(FlipInput)

class FlipInputInside extends Component {

  render () {
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
          return 'red'
        case 'max':
          return 'orange'
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
              placeholderTextColor='#FFF'
            />
          </View>
          { displayFees ? <Text style={styles.fees}> + b0.026</Text> : null }
          {/* { displayFees ? <Text style={styles.fees}> + b{primaryFee}</Text> : null } */}
        </View>
      )
    }

    const renderConvertedInput = () => {
      return (
        <View style={styles.convertedInputRow}>
          <View style={styles.secondaryTextContainer}>
            <Text style={styles.secondaryText}>
              {getSecondaryAmount() || secondaryPlaceholder}
            </Text>
          </View>
          { displayFees ? <Text style={styles.fees}> + $0.95</Text> : null }
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
          { !displayFees ? <Text style={styles.currency}>BTC</Text> : null }
          {/* { !displayFees ? <Text style={styles.currency}>{currency}</Text> : null } */}
        </View>
      </View>
    )
  }

}
