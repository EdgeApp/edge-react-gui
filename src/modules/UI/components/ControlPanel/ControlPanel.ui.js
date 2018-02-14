import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialIcons'

import person from '../../../../assets/images/sidenav/accounts.png'
import { emptyGuiDenomination } from '../../../../types'
import { getDenomFromIsoCode } from '../../../utils.js'
import T from '../../components/FormattedText'
import ExchangedExchangeRate from '../ExchangeRate/ExchangedExchangeRate.ui.js'
import Gradient from '../Gradient/Gradient.ui'
import SafeAreaView from '../SafeAreaView/SafeAreaViewDrawer.ui.js'
import Main from './Component/MainConnector'
import styles from './style'

export default class ControlPanel extends Component {
  _handlePressUserList = () => {
    if (!this.props.usersView) {
      return this.props.openSelectUser()
    }
    if (this.props.usersView) {
      return this.props.closeSelectUser()
    }
  }

  render () {
    const {
      primaryDisplayCurrencyCode,
      primaryDisplayDenomination,
      primaryExchangeDenomination,
      secondaryDisplayCurrencyCode,
      secondaryToPrimaryRatio
    } = this.props

    const secondaryExchangeDenomination = secondaryDisplayCurrencyCode ? getDenomFromIsoCode(secondaryDisplayCurrencyCode) : ''

    const primaryInfo = {
      displayCurrencyCode: primaryDisplayCurrencyCode,
      displayDenomination: primaryDisplayDenomination || emptyGuiDenomination,
      exchangeDenomination: primaryExchangeDenomination || emptyGuiDenomination
    }
    const secondaryInfo = {
      displayCurrencyCode: secondaryDisplayCurrencyCode,
      displayDenomination: secondaryExchangeDenomination || emptyGuiDenomination,
      exchangeDenomination: secondaryExchangeDenomination || emptyGuiDenomination
    }

    const arrowIcon = this.props.usersView ? 'keyboard-arrow-up' : 'keyboard-arrow-down'

    return (
      <SafeAreaView>
        <Gradient style={styles.container}>
          <View style={styles.bitcoin.container}>
            <T style={styles.bitcoin.icon} />
            <ExchangedExchangeRate
              primaryCurrencyInfo={primaryInfo}
              secondaryCurrencyInfo={secondaryInfo}
              exchangeSecondaryToPrimaryRatio={secondaryToPrimaryRatio}
            />
          </View>

          <TouchableHighlight style={styles.user.container} onPress={this._handlePressUserList} underlayColor={styles.underlay.color}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.iconImageContainer}>
                <Image style={styles.iconImage} source={person} />
              </View>
              <T style={styles.user.name}>{this.props.username}</T>
              <MDIcon style={styles.icon} name={arrowIcon} />
            </View>
          </TouchableHighlight>

          <Main />
        </Gradient>
      </SafeAreaView>
    )
  }
}
