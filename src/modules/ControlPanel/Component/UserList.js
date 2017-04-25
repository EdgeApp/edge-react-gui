import React, { Component } from 'react'
import { View, ScrollView, TouchableNativeFeedback, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import { Text, Icon  } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import _ from 'lodash'

import { closeSelectUser, selectUsersList, removeUsersList } from '../action'

import styles from '../style'

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
        return (
          <View key={index} style={styles.userList.row}>
            <Text style={styles.userList.text} onPress={ e => this._handlePressUserSelect(user.id) }>{user.name}</Text>
            <Icon name='close' onPress={ e => this._handlePressUserRemove(user.id) }/>
          </View>
        )
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
