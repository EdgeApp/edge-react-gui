// @flow

import React, { Component } from 'react'
import { Alert, ScrollView, TouchableHighlight, View } from 'react-native'

import * as Constants from '../../../../../constants/indexConstants.js'
import T from '../../../components/FormattedText'
import { Icon } from '../../Icon/Icon.ui.js'
import styles from '../style'

type Props = {
  usernames: Array<string>,
  logout: (username?: string) => void,
  deleteLocalAccount: string => void,
  allUsernames: Array<string>,
  currentUsername: string
}

export default class UserList extends Component<Props> {
  render () {
    const { allUsernames, currentUsername } = this.props
    const usernames = allUsernames.filter(username => username !== currentUsername)

    return (
      <ScrollView style={styles.userList.container}>
        {usernames.map(username => (
          <View key={username} style={styles.userList.row}>
            <TouchableHighlight style={styles.userList.textContainer} underlayColor={styles.underlay.color} onPress={this.handlePressUserSelect(username)}>
              <T style={styles.userList.text}>{username}</T>
            </TouchableHighlight>

            <TouchableHighlight style={styles.userList.icon} underlayColor={styles.underlay.color} onPress={this.handlePressDeleteLocalAccount(username)}>
              <View /* Hack, do not remove */>
                <Icon size={20} name={'close'} type={Constants.MATERIAL_ICONS} style={{}} />
              </View>
            </TouchableHighlight>
          </View>
        ))}
      </ScrollView>
    )
  }

  handlePressUserSelect = (username: string) => () => {
    return this.props.logout(username)
  }
  handleDeleteLocalAccount = (username: string) => () => {
    return this.props.deleteLocalAccount(username)
  }
  handlePressDeleteLocalAccount = (username: string) => () => {
    return Alert.alert(
      'Delete Account',
      "Delete '" +
        username +
        "' on this device? This will disable access via PIN. If 2FA is enabled on this account, this device will not be able to login without 2FA reset which takes 7 days",
      [{ text: 'No', style: 'cancel' }, { text: 'Yes', onPress: () => this.handleDeleteLocalAccount(username)() }]
    )
  }
}
