import React, {Component} from 'react'
import {
  Alert,
  Platform,
  View,
  ScrollView,
  TouchableNativeFeedback,
  TouchableOpacity
} from 'react-native'
import {Text, Icon} from 'native-base'
import _ from 'lodash'

import styles from '../style'
const platform = Platform.OS

export default class UserList extends Component {

  _handlePressUserSelect = (username) => () =>
    this.props.logout(username)

  _handleDeleteLocalAccount = (username) => () =>
    this.props.deleteLocalAccount(username)

  _handlePressDeleteLocalAccount = (username) => () =>
    Alert.alert('Delete Account', 'Delete \''
      + username
      + '\' on this device? This will disable access via PIN. If 2FA is enabled on this account, this device will not be able to login without 2FA reset which takes 7 days',
      [{text: 'No', style: 'cancel'}, {text: 'Yes', onPress: () => this._handleDeleteLocalAccount(username)}])

  rows = () => _.map(this.props.usernames, (username, index) => {
    if (platform === 'android') {
      return (
        <View key={index} style={styles.userList.row}>
          <TouchableNativeFeedback onPress={this._handlePressUserSelect(username)}
            background={TouchableNativeFeedback.SelectableBackground()} >
            <Text style={styles.userList.text}>{username}</Text>
          </TouchableNativeFeedback>
          <TouchableOpacity style={styles.userList.icon} onPress={this._handlePressDeleteLocalAccount(username)}>
            <Icon name='close' />
          </TouchableOpacity>
        </View>
      )
    }
    if (platform !== 'android') {
      return (
        <View key={index} style={styles.userList.row}>
          <TouchableOpacity style={styles.userList.text} onPress={this._handlePressUserSelect(username)}>
            <Text>{username}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.userList.icon} onPress={this._handlePressDeleteLocalAccount(username)}>
            <Icon name='close' />
          </TouchableOpacity>
        </View>
      )
    }
  })

  render () {
    return (
      <ScrollView style={styles.userList.container}>
        {this.rows()}
      </ScrollView>
    )
  }
}
