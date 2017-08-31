import React, { Component } from 'react'
import { View, TouchableOpacity, Image } from 'react-native'
import { Text } from 'native-base'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import { connect } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'

import { openSelectUser, closeSelectUser } from './action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

import Main from './Component/Main'
import ExchangeRate from '../ExchangeRate/ExchangedExchangeRate.ui.js'
import styles from './style'

import person from '../../../../assets/images/sidenav/accounts.png'

class ControlPanel extends Component {
  _handlePressUserList = () => {
    if (!this.props.usersView) {
      return this.props.dispatch(openSelectUser())
    }
    if (this.props.usersView) {
      return this.props.dispatch(closeSelectUser())
    }
  }

  _getExchangeRate = () => {
    return this.props.exchangeRate === 0
      ? <Text style={styles.bitcoin.value}>
          Exchange Rate loading
        </Text>
      : <Text style={styles.bitcoin.value}>
          1 {this.props.currencyCode} = $ {this.props.exchangeRate.toFixed(2)} USD
        </Text>
  }

  render () {
    const primaryDisplayAmount = '1'
    const primaryInfo = this.props.primaryInfo
    const secondaryInfo = this.props.secondaryInfo
    const secondaryDisplayAmount = this.props.secondaryDisplayAmount

    return (
      <LinearGradient
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={['#2B5698', '#3B7ADA']}>
        <View style={styles.bitcoin.container}>
          <Text style={styles.bitcoin.icon} />
          <ExchangeRate
            primaryDisplayAmount={primaryDisplayAmount}
            primaryInfo={primaryInfo}
            secondaryDisplayAmount={secondaryDisplayAmount}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio />
        </View>
        <TouchableOpacity style={styles.user.container} onPress={this._handlePressUserList}>
          <View style={styles.iconImageContainer}>
            <Image style={styles.iconImage} source={person} />
          </View>
          <Text style={styles.user.name}>
            {this.props.username}
          </Text>
          <MDIcon style={styles.icon} name={this.props.usersView ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} />
        </TouchableOpacity>
        <Main />
      </LinearGradient>
    )
  }
}

const mapStateToProps = (state) => {
  let secondaryToPrimaryRatio = 0
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  let primaryDisplayDenomination = {}
  let primaryExchangeDenomination = {}
  let secondaryExchangeDenomination = {}
  let secondaryDisplayDenomination = {}
  let primaryInfo = {}
  let secondaryInfo = {}
  let secondaryDisplayAmount = '0'

  if (wallet && currencyCode) {
    primaryDisplayDenomination = SETTINGS_SELECTORS.getSelectedDenomination(state, currencyCode)
    primaryExchangeDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
    secondaryExchangeDenomination = {
      name: 'Dollars',
      symbol: '$',
      multiplier: '100',
      precision: 2
    }
    secondaryDisplayDenomination = secondaryExchangeDenomination
    primaryInfo = {
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeDenomination: primaryExchangeDenomination
    }
    secondaryInfo = {
      displayCurrencyCode: wallet.fiatCurrencyCode,
      displayDenomination: secondaryDisplayDenomination,
      exchangeDenomination: secondaryExchangeDenomination
    }
    secondaryDisplayAmount =
      parseFloat(1) *
      parseFloat(secondaryToPrimaryRatio) *
      parseFloat(primaryInfo.displayDenomination.multiplier) /
      parseFloat(primaryInfo.exchangeDenomination.multiplier)
  }
  if (wallet) {
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    secondaryToPrimaryRatio = CORE_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)
  }

  return {
    currencyCode,
    primaryInfo,
    secondaryInfo,
    secondaryDisplayAmount,
    secondaryToPrimaryRatio,
    usersView: state.ui.scenes.controlPanel.usersView,
    username: CORE_SELECTORS.getUsername(state)
  }
}

export default connect(mapStateToProps)(ControlPanel)
