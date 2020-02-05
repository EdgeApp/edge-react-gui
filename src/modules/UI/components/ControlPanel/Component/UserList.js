// @flow

import type { DiskletFolder } from 'disklet'
import React, { Component } from 'react'
import { Alert, ScrollView, TouchableHighlight, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../../../../constants/indexConstants.js'
import s from '../../../../../locales/strings'
import T from '../../../components/FormattedText'
import { Icon } from '../../Icon/Icon.ui.js'
import styles from '../style'

type Props = {
  usernames: Array<string>,
  folder: DiskletFolder,
  logout: (username?: string) => void,
  deleteLocalAccount: string => void,
  allUsernames: Array<string>,
  currentUsername: string
}

type State = {
  mostRecentUsernames: Array<string>
}

export default class UserList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      mostRecentUsernames: []
    }
  }
  async componentDidMount () {
    const { allUsernames } = this.props
    const recentUsernames = await this.getRecentLoginUsernames()
    const filteredUsernames = allUsernames.filter((username: string) => !recentUsernames.find((lastUser: string) => username === lastUser))
    const sortedUsernames = this.sortUsernames(filteredUsernames)
    recentUsernames.shift()
    this.setState({
      mostRecentUsernames: [...recentUsernames, ...sortedUsernames]
    })
  }
  render () {
    const { mostRecentUsernames } = this.state
    const usernames = mostRecentUsernames.length > 0 ? mostRecentUsernames : this.getUsernameList()
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
  getUsernameList = () => {
    const { allUsernames, currentUsername } = this.props
    const usernames = allUsernames.filter(username => username !== currentUsername)
    return this.sortUsernames(usernames)
  }
  getRecentLoginUsernames = async () => {
    const { folder } = this.props
    // $FlowFixMe - Can't figure out what type to use on this context folder
    const lastUsers = await folder._disklet
      .getText('lastusers.json')
      .then(text => JSON.parse(text))
      .catch(e => e)
    return lastUsers && lastUsers.length > 0 ? lastUsers.slice(0, 4) : []
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
