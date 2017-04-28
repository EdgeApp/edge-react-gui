import React, { Component } from 'react'
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Easing,
  TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { devStyle } from '../utils.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'
import FlipView from 'react-native-flip-view'

const CRYPTO_PLACEHOLDER = 'C 0.00'
const FIAT_PLACEHOLDER = 'F 0.00'

export default class FlipInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isFlipped: false,
    }
  }

  render () {
    return (
      <FlipView style={styles.view}
        front={this._renderFront()}
        back={this._renderBack()}
        isFlipped={this.state.isFlipped}
        onFlipped={(val) => {console.log('Flipped: ' + val);}}
        flipAxis="x"
        flipEasing={Easing.out(Easing.ease)}
        flipDuration={250}
        perspective={1000} />
    );
  };

  flip = () => {
    this.setState({isFlipped: !this.state.isFlipped})
  }

  _renderFront = () => {
    const {
      mode,
      onCryptoInputChange,
      onFiatInputChange,
      amountRequestedInCrypto,
      amountRequestedInFiat,
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
        amountRequestedPrimary={amountRequestedInCrypto}
        amountRequestedSecondary={amountRequestedInFiat}
        onInputCurrencyToggle={this.flip}
        primaryFee={feeInCrypto}
        secondaryFee={feeInFiat}
        displayFees={displayFees} />
  )}

  _renderBack = () => {
    const {
      mode,
      onFiatInputChange,
      onCryptoInputChange,
      amountRequestedInFiat,
      amountRequestedInCrypto,
      onInputCurrencyToggle,
      feeInFiat,
      feeInCrypto,
      displayFees,
    } = this.props

    return (
      <FlipInputInside
        syle={styles.view}
        currencySelected={'fiat'}
        mode={mode}
        primaryPlaceholder={'f 0.00'}
        secondaryPlaceholder={'c 0.00'}
        onInputChange={onFiatInputChange}
        amountRequestedPrimary={amountRequestedInFiat}
        amountRequestedSecondary={amountRequestedInCrypto}
        onInputCurrencyToggle={this.flip}
        primaryFee={feeInFiat}
        secondaryFee={feeInCrypto}
        displayFees={displayFees} />
    )
  }

  _flip = () => {
    this.setState({isFlipped: !this.state.isFlipped});
  }
}

const FlipInputInside = ({
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
}) => {

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
    if (!displayFees) { topFee = '' }

    return (
      <View style={styles.primaryFee}>
        <Text style={styles.primaryFeeText}>{primaryFee}</Text>
      </View>
    )
  }

  const displaySecondaryFees = (secondaryFee) => {
    if (!displayFees) { secondaryFee = '' }

    return (
      <View style={styles.secondaryFee}>
        <Text style={styles.primaryFeeText}>{secondaryFee}</Text>
      </View>
    )
  }

  const getInputAndFeesElement = () => {
    const inputAndFeesElement =
      <View style={{flex: 10}} name='InputAndFeesElement'>
        <View style={styles.primaryRow} name='PrimaryRow'>
          <TextInput
            style={[styles.primaryTextInput, styles[mode]]}
            value={getPrimaryAmount()}
            placeholder={primaryPlaceholder}
            keyboardType='numeric'
            onChangeText={onInputChange} />
          {displayPrimaryFees(primaryFee)}
        </View>

        <View style={styles.secondaryRow} name='SecondaryRow'>
          <Text style={[styles.secondaryText, styles[mode]]}>
            {getSecondaryAmount() || secondaryPlaceholder}
          </Text>
          {displaySecondaryFees(secondaryFee)}
        </View>

      </View>

    return inputAndFeesElement
  }

  return (
    <View style={styles.view}>
      <View style={styles.leftSpacer} />
      <View style={styles.row}>

        <View style={styles.iconContainer}>
          <View style={styles.verticalSpacer} />
          <FAIcon style={styles.icon}
            onPress={onInputCurrencyToggle}
            name='swap-vert'
            size={36} />
          <View style={styles.verticalSpacer} />
        </View>

        {getInputAndFeesElement()}
      </View>
    </View>
  )
}
