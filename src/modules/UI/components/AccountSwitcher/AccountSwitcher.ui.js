// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext } from 'edge-core-js'
import * as React from 'react'
import { Alert, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { showError } from '../../../../components/services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../../../../components/services/ThemeContext'
import Separator from '../../../../components/themed/Separator'
import s from '../../../../locales/strings'
import { type RootState } from '../../../../reducers/RootReducer.js'
import { useDispatch, useEffect, useSelector, useState } from '../../../../util/hooks.js'
import { reduxShallowEqual } from '../../../../util/utils.js'
import { logoutRequest } from '../../../Login/action'
import SwitcherHeader from './components/SwitcherHeader'
import SwitcherList from './components/SwitcherList'
import { getCoreUserNames, getRecentLoginUsernames, getRecentUserNames, sortUserNames } from './helpers'

export type Props = {
  onSwitch: (value: boolean) => void
}

export type StateProps = {
  username: string,
  context: EdgeContext,
  disklet: Disklet
}

export const selector = (state: RootState): StateProps => ({
  username: state.core.account.username,
  context: state.core.context,
  disklet: state.core.disklet
})

const cleanups = []

export default function AccountSwitcher(props: Props) {
  const [isViewUserList, setIsViewUserList] = useState(false)
  const [localUsers, setLocalUsers] = useState([])
  const [mostRecentUsernames, setMostRecentUsernames] = useState([])

  const theme = useTheme()
  const styles = getStyles(theme)

  const { onSwitch } = props

  const dispatch = useDispatch()

  const { username, context, disklet }: StateProps = useSelector(selector, reduxShallowEqual)

  const coreUserNames = getCoreUserNames(localUsers, username)
  const usernames = [...getRecentUserNames(username, mostRecentUsernames, coreUserNames), ...sortUserNames(coreUserNames, username)]

  useEffect(() => {
    cleanups.push(context.watch('localUsers', localUsers => setLocalUsers(localUsers)))

    getRecentLoginUsernames(disklet)
      .then(mostRecentUsernames => setMostRecentUsernames(mostRecentUsernames))
      .catch(showError)

    return () => cleanups.forEach(cleanup => cleanup())
  }, [context, context.localUsers, disklet])

  const onPress = () => {
    setIsViewUserList(!isViewUserList)
    onSwitch(!isViewUserList)
  }

  const onLogout = () => {
    dispatch(logoutRequest(username))
  }

  const deleteLocalAccount = () =>
    Alert.alert(s.strings.delete_account_header, sprintf(s.strings.delete_username_account, username), [
      { text: s.strings.no, style: 'cancel' },
      { text: s.strings.yes, onPress: () => context.deleteLocalAccount(username).catch(showError) }
    ])

  return (
    <View>
      <SwitcherHeader onPress={onPress} username={username} />
      <Separator style={styles.separator} />
      <View style={styles.list}>
        {isViewUserList ? <SwitcherList usernames={usernames} onLogout={onLogout} deleteLocalAccount={deleteLocalAccount} /> : null}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.rem(1)
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconUser: {
    marginRight: theme.rem(1.5)
  },
  textContainer: {
    marginRight: 'auto'
  },
  text: {
    color: 'white',
    fontFamily: theme.fontFaceBold
  },
  separator: {
    marginBottom: theme.rem(1),
    marginTop: theme.rem(1.5),
    marginRight: theme.rem(-1)
  }
}))
