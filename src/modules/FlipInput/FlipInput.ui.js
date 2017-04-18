import React, { Component } from 'react'
import { Text, TextInput, View, StyleSheet} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { devStyle } from '../utils.js'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

const FlipInput = ({
  mode,
  onFiatInputChange,
  onCryptoInputChange,
  amountRequestedInCrypto,
  amountRequestedInFiat,
  onInputCurrencyToggle,
  inputCurrencySelected,
  feesInFiat,
  feesInCrypto,
  displayFees,
  maxAvailableToSpendInCrypto
}) => {

  const getAmountToDisplayInFiat = () => {
    if ([0, '', undefined, null].includes(amountRequestedInFiat)) {
      return ''
    }
    return amountRequestedInFiat.toString()
  }

  const getAmountToDisplayInCrypto = () => {
    if ([0, '', undefined, null].includes(amountRequestedInCrypto)) {
      return ''
    }
    return amountRequestedInCrypto.toString()
  }

  getTextColor = () => {
    let textColor

    if ( mode === 'over' ) {
      textColor = 'red'
    } else if ( mode === 'max' ) {
      textColor = 'orange'
    } else {
      textColor = 'white'
    }

    return textColor
  }

  const displayTopFees = (topFee) => {
    if (!displayFees) { topFee = '' }

    return (<View style={styles.topFee}>
      <Text style={styles.topFeeText}>{topFee}</Text>
    </View>)
  }

  const displayBottomFees = (bottomFee) => {
    if (!displayFees) { bottomFee = '' }

    return (
      <View style={styles.bottomFee}>
        <Text style={styles.topFeeText}>{bottomFee}</Text>
      </View>
    )
  }

  const getFlippingElement = () => {
    const inputs =
      inputCurrencySelected === 'fiat' ?
        <View style={{flex: 10}} name='FlipperContainer'>
          <View style={styles.topRow} name='TopRow'>
            <TextInput
              style={[styles.primaryTextInput, styles[mode]]}
              value={getAmountToDisplayInFiat()}
              placeholder='F 0.00'
              keyboardType='numeric'
              onChangeText={onFiatInputChange} />
            {displayTopFees('F Fee')}
          </View>

          <View style={styles.bottomRow} name='bottomRow'>
            <Text
              style={[styles.secondaryTextInput, styles[mode]]}>
              {getAmountToDisplayInCrypto() || 'C 0.00'}
            </Text>
            {displayBottomFees('C Fee')}
          </View>
        </View> :

        <View style={{flex: 10}} name='FlipperContainer'>
          <View style={styles.topRow} name='TopRow'>
            <TextInput
              style={[styles.primaryTextInput, styles[mode]]}
              value={getAmountToDisplayInCrypto()}
              placeholder='C 0.00'
              keyboardType='numeric'
              onChangeText={onCryptoInputChange} />
            {displayTopFees('C Fee')}
          </View>

          <View style={{flex: 1, flexDirection: 'row'}} name='bottomRow'>
            <Text style={[styles.secondaryTextInput, styles[mode]]}>
              {getAmountToDisplayInFiat() || 'F 0.00'}
            </Text>
            {displayBottomFees('F Fee')}
          </View>
        </View>

    return inputs
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

        {getFlippingElement()}
      </View>
    </View>
  )
}

export default connect()(FlipInput)
