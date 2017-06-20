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
    return (
      <FlipView style={styles.view}
        front={this._renderFront()}
        back={this._renderBack()}
        isFlipped={this.props.inputCurrencySelected === 'fiat'}
        flipAxis='x'
        flipEasing={Easing.out(Easing.ease)}
        flipDuration={250}
        perspective={1000} />
    );
  };

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
        style={styles.view}
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
        style={styles.view}
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
      let textColor

      if (mode === 'over') {
        textColor = 'red'
      } else if (mode === 'max') {
        textColor = 'orange'
      } else {
        textColor = 'white'
      }

      return textColor
    }

    const displayPrimaryFees = (primaryFee) => {
      if (!displayFees) {
        return null
      }else {
        return (
          <View style={styles.primaryFee}>
            <Text style={styles.primaryFeeText}>{primaryFee}</Text>
          </View>
        )
      }

    }

    const displaySecondaryFees = (secondaryFee) => {
      if (!displayFees) {
        return null
      }else {
        return (
          <View style={styles.secondaryFee}>
            <Text style={styles.primaryFeeText}>{secondaryFee}</Text>
          </View>
        )
      }
    }

    const getInputAndFeesElement = () => {
      return (
        <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.6)'}} name='InputAndFeesElement'>
            <TextInput
              style={[styles.primaryTextInput, styles[mode]]}
              value={getPrimaryAmount()}
              placeholder={primaryPlaceholder}
              keyboardType='numeric'
              onChangeText={onInputChange}
              placeholderTextColor='#FFF'
            />
            {displayPrimaryFees(primaryFee)}
        </View>
      )
    }

    return (
      <View style={styles.view}>
        <View style={styles.row}>
          <FAIcon style={styles.icon} onPress={onInputCurrencyToggle} name='swap-vert' size={36} />
          {getInputAndFeesElement()}
          <Text style={styles.currency}>BTC</Text>
        </View>
        <View style={styles.secondaryRow} name='SecondaryRow'>
          <Text style={styles.secondaryText}>
            {getSecondaryAmount() || secondaryPlaceholder}
          </Text>
          {displaySecondaryFees(secondaryFee)}
        </View>
      </View>
    )
  }

}
