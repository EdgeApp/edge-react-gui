// @flow

import React, { Component } from 'react'
import { Alert, ScrollView, TouchableHighlight, View } from 'react-native'

import * as Constants from '../../../../../constants/indexConstants.js'
import s from '../../../../../locales/strings'
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
    return Alert.alert(s.strings.delete_account_header, s.strings.delete_username_account, [
      { text: s.strings.no, style: 'cancel' },
      { text: s.strings.yes, onPress: () => this.handleDeleteLocalAccount(username)() }
    ])
  }
}
