import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text, Icon } from 'native-base'
import MDIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import LinearGradient from 'react-native-linear-gradient'
import _ from 'lodash'

import { openSelectUser, closeSelectUser, getUsersList } from './action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'

import Main from './Component/Main'
import usersListObject from './userList'
import styles from './style'

class ControlPanel extends Component {
  componentDidMount () {
    this.props.dispatch(getUsersList(usersListObject))
  }

  _handlePressUserList = () => {
    if(!this.props.usersView){
      return this.props.dispatch(openSelectUser())
    }
    if(this.props.usersView){
      return this.props.dispatch(closeSelectUser())
    }
  }

  _getExchangeRate = () => {
    return this.props.exchangeRate === 0
      ? <Text style={styles.bitcoin.value}>
        Exchange Rate loading
      </Text>
    : <Text style={styles.bitcoin.value}>1 ฿ = $ {this.props.exchangeRate} USD</Text>
  }

  render () {
    return  (
      <LinearGradient style={styles.container}
        start={{x:0,y:0}}
        end={{x:1, y:0}}
        colors={["#2B5698","#3B7ADA"]}>
        <View style={styles.bitcoin.container}>
          <Icon name='logo-bitcoin' style={styles.bitcoin.icon}/>
          {this._getExchangeRate()}
        </View>
        <TouchableOpacity style={styles.user.container}
          onPress={this._handlePressUserList}>
          <Icon style={styles.user.icon} name='person' />
          <Text style={styles.user.name}>{ this.props.username }</Text>
          <MDIcon style={styles.user.icon} name='keyboard-arrow-down' />
        </TouchableOpacity>
        <Main/>
      </LinearGradient>
    )
  }
}

const mapStateToProps = (state) => {
  let exchangeRate = 0
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  if (wallet) {
    const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
    const fiatCurrencyCode = wallet.isoFiatCurrencyCode
    const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
    exchangeRate = currencyConverter.convertCurrency(currencyCode, fiatCurrencyCode, 1)
  }

  return {
    exchangeRate: exchangeRate,
    usersView: state.ui.scenes.controlPanel.usersView,
    username:  CORE_SELECTORS.getUsername(state)
  }
}

export default connect(mapStateToProps)(ControlPanel)
