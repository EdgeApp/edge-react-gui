// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext, type EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Alert, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { logoutRequest } from '../../actions/LoginActions.js'
import s from '../../locales/strings'
import { type RootState } from '../../reducers/RootReducer.js'
import { useEffect, useState } from '../../types/reactHooks'
import { reduxShallowEqual, useDispatch, useSelector } from '../../types/reactRedux'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { getCoreUserNames, getRecentLoginUsernames, getRecentUserNames, sortUserNames, SwitcherHeader, SwitcherList } from '../themed/AccountSwitcher'
import DropDownList from '../themed/DropDownList'
import Separator from '../themed/Separator'

export type Props = {
  onSwitch: (value: boolean) => void,
  forceClose?: boolean
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

const initialStateLocalUsers: EdgeUserInfo[] = []
const initialStateRecentUsernames: string[] = []

export const AccountSwitcher = (props: Props) => {
  const [localUsers, setLocalUsers] = useState(initialStateLocalUsers)
  const [mostRecentUsernames, setMostRecentUsernames] = useState(initialStateRecentUsernames)

  const theme = useTheme()
  const styles = getStyles(theme)

  const { onSwitch, forceClose } = props

  const dispatch = useDispatch()

  const { username, context, disklet }: StateProps = useSelector(selector, reduxShallowEqual)

  const coreUserNames: string[] = getCoreUserNames(localUsers, username)
  const usernames: string[] = [...getRecentUserNames(username, mostRecentUsernames, coreUserNames), ...sortUserNames(coreUserNames, username)]

  useEffect(() => {
    getRecentLoginUsernames(disklet)
      .then(mostRecentUsernames => setMostRecentUsernames(mostRecentUsernames))
      .catch(showError)

    setLocalUsers(context.localUsers)
    const cleanup = context.watch('localUsers', localUsers => setLocalUsers(localUsers))

    return () => cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSwitchAccount = (username: string) => {
    dispatch(logoutRequest(username))
  }

  const deleteLocalAccount = (username: string) =>
    Alert.alert(s.strings.delete_account_header, sprintf(s.strings.delete_username_account, username), [
      { text: s.strings.no, style: 'cancel' },
      { text: s.strings.yes, onPress: () => context.deleteLocalAccount(username).catch(showError) }
    ])

  return (
    <View>
      <DropDownList
        onIsOpen={onSwitch}
        forceClose={forceClose}
        header={<SwitcherHeader username={username} />}
        separator={<Separator style={styles.separator} />}
        isFetching={usernames.length === 0}
        list={
          <View style={styles.list}>
            <SwitcherList usernames={usernames} onSwitchAccount={onSwitchAccount} deleteLocalAccount={deleteLocalAccount} />
          </View>
        }
      />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.rem(1),
    width: '100%'
  },
  separator: {
    marginBottom: theme.rem(1),
    marginTop: theme.rem(1.2),
    marginRight: theme.rem(-2)
  }
}))
