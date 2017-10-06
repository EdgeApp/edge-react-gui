import React, {Component} from 'react'
import {View, TouchableOpacity, Image} from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import Gradient from '../Gradient/Gradient.ui'

import Main from './Component/MainConnector'
import ExchangeRate from '../ExchangeRate/ExchangedExchangeRate.ui.js'
import styles from './style'
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

  render () {
    const primaryDisplayAmount = '1'
    const {
      primaryInfo,
      secondaryInfo,
      secondaryDisplayAmount,
      secondaryToPrimaryRatio
    } = this.props

    return (
      <Gradient style={styles.container}>
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
      </Gradient>
    )
  }
}
