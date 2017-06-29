import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text, Icon } from 'native-base'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import LinearGradient from 'react-native-linear-gradient'
import _ from 'lodash'

import { openSelectUser, closeSelectUser } from './action'

import Main from './Component/Main'
import usersListObject from './userList'
import styles from './style'

class ControlPanel extends Component {

  _handlePressUserList = () => {
    if(!this.props.usersView){
      return this.props.dispatch(openSelectUser())
    }
    if(this.props.usersView){
      return this.props.dispatch(closeSelectUser())
    }
  }

  render () {
    console.log(this.props)
    return  (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} colors={["#2B5698","#3B7ADA"]} style={styles.container}>
          <View style={styles.bitcoin.container}>
            <Icon name='logo-bitcoin' style={styles.bitcoin.icon}/>
            <Text style={styles.bitcoin.value}>1000 b = $1.129 USD</Text>
          </View>
          <TouchableOpacity style={styles.user.container} onPress={this._handlePressUserList}>
            <Icon style={styles.user.icon} name='person' />
            <Text style={styles.user.name}>{ this.props.account.username ? this.props.account.username : 'Account' }</Text>
            <Icon style={styles.user.icon} name='arrow-dropdown' />
          </TouchableOpacity>
          <Main/>
      </LinearGradient>
    )
  }
}

const mapStateToProps = state => ({
  account:      state.core.account,
  usersView:    state.ui.scenes.controlPanel.usersView
})

export default connect(mapStateToProps)(ControlPanel)
