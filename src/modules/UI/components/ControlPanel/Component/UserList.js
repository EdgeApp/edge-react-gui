import React, { Component } from 'react'
import { Platform, View, ScrollView, TouchableNativeFeedback, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import { Text, Icon  } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import _ from 'lodash'

import { closeSelectUser, selectUsersList, removeUsersList } from '../action'

import styles from '../style'
const platform = Platform.OS;

class UserListComponent extends Component {

  _handlePressUserSelect = (id) => {
    this.props.dispatch(selectUsersList(id))
    return this.props.dispatch(closeSelectUser(id))
  }

  _handlePressUserRemove = (id) => {
    return this.props.dispatch(removeUsersList(id))
  }

  render () {
    const rows = () => {
      return _.map(this.props.usersList, (user, index) => {
        if(platform === 'android') {
          return (
            <View key={index} style={styles.userList.row}>
              <TouchableNativeFeedback onPress={ e => this._handlePressUserSelect(user) } background={TouchableNativeFeedback.SelectableBackground()} >
                <Text style={styles.userList.text}>{user}</Text>
              </TouchableNativeFeedback>
              <TouchableOpacity style={styles.userList.icon} onPress={ e => this._handlePressUserRemove(user) }>
                <Icon name='close'/>
              </TouchableOpacity>
            </View>
          )
        }
        if(platform !== 'android') {
          return (
            <View key={index} style={styles.userList.row}>
              <TouchableOpacity  style={styles.userList.text} onPress={ e => this._handlePressUserSelect(user) }>
                <Text>{user}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.userList.icon} onPress={ e => this._handlePressUserRemove(user) }>
                <Icon name='close'/>
              </TouchableOpacity>
            </View>
          )
        }
      })
    }

    return(
      <ScrollView style={styles.userList.container}>
        {rows()}
      </ScrollView>
    )

  }
}

export default connect( state => ({

  usersList : state.account.username !== null ?
    _.filter(state.ui.controlPanel.usersList, item => item !== state.account.username) :
    state.ui.controlPanel.usersList,

}) )(UserListComponent)
