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
              <TouchableNativeFeedback onPress={ e => this._handlePressUserSelect(user.id) } background={TouchableNativeFeedback.SelectableBackground()} >
                <Text style={styles.userList.text}>{user.name}</Text>
              </TouchableNativeFeedback>
              <TouchableOpacity style={styles.userList.icon} onPress={ e => this._handlePressUserRemove(user.id) }>
                <Icon name='close'/>
              </TouchableOpacity>
            </View>
          )
        }
        if(platform !== 'android') {
          return (
            <View key={index} style={styles.userList.row}>
              <TouchableOpacity  style={styles.userList.text} onPress={ e => this._handlePressUserSelect(user.id) }>
                <Text>{user.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.userList.icon} onPress={ e => this._handlePressUserRemove(user.id) }>
                <Icon name='close'/>
              </TouchableOpacity>
            </View>
          )
        }
      })
    }

    return(
      <ScrollView>
        {rows()}
      </ScrollView>
    )

  }
}

export default connect( state => ({

  usersList : state.controlPanel.selectedUser !== null ?
    _.filter(state.controlPanel.usersList, item => item.id !== state.controlPanel.selectedUser) :
    state.controlPanel.usersList,

}) )(UserListComponent)
