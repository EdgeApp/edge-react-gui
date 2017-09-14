import React, {Component} from 'react'
import {View, TouchableOpacity, Image} from 'react-native'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import LinearGradient from 'react-native-linear-gradient'

import Main from './Component/MainConnector'
import ExchangeRate from '../ExchangeRate/ExchangedExchangeRate.ui.js'
import styles from './style'
import {colors as c} from '../../../../theme/variables/airbitz.js'
import T from '../../components/FormattedText'

import person from '../../../../assets/images/sidenav/accounts.png'

export default class ControlPanel extends Component {
  _handlePressUserList = () => {
    if (!this.props.usersView) {
      return this.props.openSelectUser()
    }
    if (this.props.usersView) {
      return this.props.closeSelectUser()
    }
  }

  _getExchangeRate = () => {
    const {
      exchangeRate,
      primaryInfo,
      primaryDisplayAmount,
      secondaryInfo,
      secondaryDisplayAmount
    } = this.props

    return exchangeRate === 0
      ? <T style={styles.bitcoin.value}>
          {sprintf(strings.enUS['drawer_exchange_rate_loading'])}
        </T>
      : <T style={styles.bitcoin.value}>
          <ExchangeRate
            primaryDisplayAmount={primaryDisplayAmount}
            primaryInfo={primaryInfo}

            secondaryDisplayAmount={secondaryDisplayAmount}
            secondaryInfo={secondaryInfo}

            secondaryToPrimaryRatio={exchangeRate} />
        </T>
  }

  render () {
    const primaryDisplayAmount = '1'
    const {
      primaryInfo,
      secondaryInfo,
      secondaryDisplayAmount,
      secondaryToPrimaryRatio
    } = this.props

    return (
      <LinearGradient
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={[c.gradient.light, c.gradient.dark]}>
        <View style={styles.bitcoin.container}>
          <T style={styles.bitcoin.icon} />
          <ExchangeRate
            primaryDisplayAmount={primaryDisplayAmount}
            primaryInfo={primaryInfo}
            secondaryDisplayAmount={secondaryDisplayAmount}
            secondaryInfo={secondaryInfo}
            secondaryToPrimaryRatio={secondaryToPrimaryRatio} />
        </View>
        <TouchableOpacity style={styles.user.container} onPress={this._handlePressUserList}>
          <View style={styles.iconImageContainer}>
            <Image style={styles.iconImage} source={person} />
          </View>
          <T style={styles.user.name}>
            {this.props.username}
          </T>
          <MDIcon style={styles.icon} name={this.props.usersView ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} />
        </TouchableOpacity>
        <Main />
      </LinearGradient>
    )
  }
}
