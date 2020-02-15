// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext, type EdgeUserInfo } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, ScrollView, TouchableHighlight, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showError } from '../../../../../components/services/AirshipInstance.js'
import * as Constants from '../../../../../constants/indexConstants.js'
import s from '../../../../../locales/strings'
import T from '../../../components/FormattedText'
import { Icon } from '../../Icon/Icon.ui.js'
import styles from '../style'

type Props = {
  logout: (username?: string) => void,
  deleteLocalAccount: string => void,
  context: EdgeContext,
  disklet: Disklet,
  currentUsername: string
}

type State = {
  localUsers: Array<EdgeUserInfo>,
  mostRecentUsernames: Array<string>
}

export default class UserList extends Component<Props, State> {
  cleanups: Array<() => mixed> = []

  constructor (props: Props) {
    super(props)
    this.state = {
      localUsers: this.props.context.localUsers,
      mostRecentUsernames: []
    }
  }

  componentDidMount () {
    const { context } = this.props
    this.cleanups.push(context.watch('localUsers', localUsers => this.setState({ localUsers })))

    this.getRecentLoginUsernames()
      .then(mostRecentUsernames =>
        this.setState({
          mostRecentUsernames
        })
      )
      .catch(showError)
  }

  componentWillUnmount () {
    this.cleanups.forEach(cleanup => cleanup())
  }

  render () {
    const { currentUsername } = this.props
    const { localUsers, mostRecentUsernames } = this.state

    // Grab all usernames that aren't logged in:
    const coreUsernames = localUsers.map(userInfo => userInfo.username).filter(username => username !== currentUsername)

    // Move recent usernames to their own list:
    const recentUsernames = []
    for (const username of mostRecentUsernames) {
      const index = coreUsernames.indexOf(username)
      if (index < 0) continue // Skip deleted & logged-in users
      coreUsernames.splice(index, 1)
      recentUsernames.push(username)
    }

    const usernames = [...recentUsernames, ...this.sortUsernames(coreUsernames)]

    return (
      <ScrollView style={styles.userList.container}>
        {usernames.map((username: string) => (
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
    return Alert.alert(s.strings.delete_account_header, sprintf(s.strings.delete_username_account, username), [
      { text: s.strings.no, style: 'cancel' },
      { text: s.strings.yes, onPress: () => this.handleDeleteLocalAccount(username)() }
    ])
  }

  getRecentLoginUsernames = async () => {
    const { disklet } = this.props
    const lastUsers = await disklet
      .getText('lastusers.json')
      .then(text => JSON.parse(text))
      .catch(_ => [])
    return lastUsers.slice(0, 4)
  }

  sortUsernames = (usernames: Array<string>): Array<string> => {
    return usernames.sort((a: string, b: string) => {
      const stringA = a.toUpperCase()
      const stringB = b.toUpperCase()
      if (stringA < stringB) {
        return -1
      }
      if (stringA > stringB) {
        return 1
      }
      return 0
    })
  }
}
