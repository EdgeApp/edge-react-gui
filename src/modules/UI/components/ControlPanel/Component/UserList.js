// @flow

import React, {Component} from 'react'
import {
  Alert,
  View,
  ScrollView,
  TouchableHighlight
} from 'react-native'
import {
  Text,
  Icon
} from 'native-base'
import _ from 'lodash'

import styles from '../style'

type Props = {usernames: Array<string>, logout: (username?: string) => void, deleteLocalAccount: (string) => void}
type State = {}

export default class UserList extends Component<Props, State> {
  render () {
    return <ScrollView style={styles.userList.container}>
      {this.rows()}
    </ScrollView>
  }

  rows = () => _.map(this.props.usernames, (username, index) =>
    <View key={index} style={styles.userList.row}>
      <TouchableHighlight style={styles.userList.text}
        underlayColor={styles.underlay.color}
        onPress={this.handlePressUserSelect(username)}>
        <Text>
          {username}
        </Text>
      </TouchableHighlight>

      <TouchableHighlight style={styles.userList.icon}
        underlayColor={styles.underlay.color}
        onPress={this.handlePressDeleteLocalAccount(username)}>
        <Icon name='close' />
      </TouchableHighlight>
    </View>
  )

  handlePressUserSelect = (username: string) => () => this.props.logout(username)
  handleDeleteLocalAccount = (username: string) => () => this.props.deleteLocalAccount(username)
  handlePressDeleteLocalAccount = (username: string) => () =>
    Alert.alert('Delete Account', 'Delete \''
      + username
      + '\' on this device? This will disable access via PIN. If 2FA is enabled on this account, this device will not be able to login without 2FA reset which takes 7 days',
      [{
        text: 'No', style: 'cancel'
      }, {
        text: 'Yes', onPress: () => this.handleDeleteLocalAccount(username)
      }])
}
