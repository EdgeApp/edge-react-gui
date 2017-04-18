import React, { Component } from 'react'
import { Text, TextInput, View, StyleSheet} from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { devStyle } from '../utils.js'
import { Icon } from 'native-base'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

const FlipInput = ({
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

  const fiatPlaceholder = 'FIAT - 0.00'
  const cryptoPlaceholder = 'CRYPTO - 0.00'

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
    const textColor =
      amountRequestedInCrypto >= maxAvailableToSpendInCrypto ?
      'red' :
      'white'

    return textColor
  }

  const styles = StyleSheet.create({
    view: {
      flex: 1,
      flexDirection: 'row'
    },
    primaryTextInput: {
      flex: 3,
      textAlign: 'center',
      fontSize: 30,
      color: getTextColor(),
    },
    secondaryTextInput: {
      flex: 3,
      textAlign: 'center',
      justifyContent: 'center',
      padding: 0,
      color: getTextColor(),
      backgroundColor: 'transparent',
      paddingTop: 15,
    },
    topRow: {
      flex: 2,
      flexDirection: 'row'
    },
    bottomRow: {
      flex: 1,
      flexDirection: 'row',
    },
    leftSpacer: {
      flex: 0.5
    },
    iconContainer: {
      flex: 2,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent'
    },
    icon: {
      color: 'white'
    },
    verticalSpacer: {
      flex: 1
    },
    right: {
      flex: 1
    },
    topFee: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'flex-end'
    },
    bottomFee: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-end'
    },
    row: {
      flex: 5,
      flexDirection: 'row'
    }
  })

  const displayTopFees = (topFee) => {
    if (!displayFees) { topFee = '' }

    return (<View style={styles.topFee}>
      <Text>{topFee}</Text>
    </View>)
  }

  const displayBottomFees = (bottomFee) => {
    if (!displayFees) { bottomFee = '' }

    return (
      <View style={styles.bottomFee}>
        <Text>{bottomFee}</Text>
      </View>
    )
  }

  const getFlippingElement = () => {
    const inputs =
      inputCurrencySelected === 'fiat' ?
        <View style={{flex: 10}} name='FlipperContainer'>
          <View style={styles.topRow} name='TopRow'>
            <TextInput
              style={styles.primaryTextInput}
              value={getAmountToDisplayInFiat()}
              placeholder='FIAT - 0.00'
              keyboardType='numeric'
              onChangeText={onFiatInputChange} />
            {displayTopFees('FiatFee')}
          </View>

          <View style={styles.bottomRow} name='bottomRow'>
            <Text
              style={[styles.secondaryTextInput ]}>
              {getAmountToDisplayInCrypto() || 'CRYPTO - 0.00'}
            </Text>
            {displayBottomFees('CryptoFee')}
          </View>
        </View> :

        <View style={{flex: 10}} name='FlipperContainer'>
          <View style={styles.topRow} name='TopRow'>
            <TextInput
              style={[styles.primaryTextInput ]}
              value={getAmountToDisplayInCrypto()}
              placeholder='CRYPTO - 0.00'
              keyboardType='numeric'
              onChangeText={onCryptoInputChange} />
            {displayTopFees('CryptoFee')}
          </View>

          <View style={{flex: 1, flexDirection: 'row'}} name='bottomRow'>
            <Text style={[styles.secondaryTextInput ]}>
              {getAmountToDisplayInFiat() || 'FIAT - 0.00'}
            </Text>
            {displayBottomFees('FiatFee')}
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
          <FAIcon name='swap-vert' size={36} style={styles.icon}
            onPress={onInputCurrencyToggle} />
          <View style={styles.verticalSpacer} />
        </View>

        {getFlippingElement()}
      </View>
    </View>
  )
}

export default connect()(FlipInput)
