import React, { Component } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text, Icon } from 'native-base'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import _ from 'lodash'

import { openSelectUser, closeSelectUser, getUsersList } from './action'

import Main from './Component/Main'
import usersListObject from './userList'
import styles from './style'

class ControlPanel extends Component {

  componentWillMount = () => {
    return this.props.dispatch(
      getUsersList(usersListObject)
    )
  }

  _handlePressUserList = () => {
    if(!this.props.usersView){
      return this.props.dispatch(openSelectUser())
    }
    if(this.props.usersView){
      return this.props.dispatch(closeSelectUser())
    }
  }

  render () {

    return  (
        <View style={styles.container}>
          <View style={styles.bitcoin.container}>
            <Icon name='logo-bitcoin' style={{ color: '#F8F8F8' }}/>
            <Text style={styles.bitcoin.value}>  = 10000 USD</Text>
          </View>
          <TouchableOpacity style={styles.user.container} onPress={this._handlePressUserList}>
            <Icon style={styles.user.icon} name='person' />
            <Text style={styles.user.name}>{ this.props.selectedUser ? this.props.selectedUser.name : 'Account' }</Text>
            <Icon style={styles.user.icon} name='arrow-dropdown' />
          </TouchableOpacity>
          <Main/>
        </View>
    )
  }
}

export default connect( state => ({

  selectedUser : state.controlPanel.selectedUser !== null ?
    _.find(state.controlPanel.usersList, item => item.id === state.controlPanel.selectedUser) :
    null

}) )(ControlPanel)
