// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext, type EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Alert, ScrollView, TouchableHighlight, View } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { logoutRequest } from '../../../../../actions/LoginActions.js'
import { showError } from '../../../../../components/services/AirshipInstance.js'
import s from '../../../../../locales/strings'
import { connect } from '../../../../../types/reactRedux.js'
import { FormattedText as T } from '../../../components/FormattedText/FormattedText.ui.js'
import { deleteLocalAccount } from '../action.js'
import { styles } from '../style'

type StateProps = {
  context: EdgeContext,
  disklet: Disklet,
  currentUsername: string
}
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: (username: string) => void
}
type Props = StateProps & DispatchProps

type State = {
  localUsers: EdgeUserInfo[],
  mostRecentUsernames: string[]
}

class UserListComponent extends React.Component<Props, State> {
  cleanups: Array<() => mixed> = []

  constructor(props: Props) {
    super(props)
    this.state = {
      localUsers: this.props.context.localUsers,
      mostRecentUsernames: []
    }
  }

  componentDidMount() {
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

  componentWillUnmount() {
    this.cleanups.forEach(cleanup => cleanup())
  }

  render() {
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
                <MaterialIcon size={20} name="close" />
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

  sortUsernames = (usernames: string[]): string[] => {
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

export const UserList = connect<StateProps, DispatchProps, {}>(
  state => ({
    context: state.core.context,
    disklet: state.core.disklet,
    currentUsername: state.core.account.username
  }),
  dispatch => ({
    logout(username) {
      dispatch(logoutRequest(username))
    },
    deleteLocalAccount(username) {
      dispatch(deleteLocalAccount(username))
    }
  })
)(UserListComponent)
