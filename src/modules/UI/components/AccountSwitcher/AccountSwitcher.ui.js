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
import DropDownList from '../DropDownList/DropDownList.ui'
import SwitcherHeader from './components/SwitcherHeader'
import SwitcherList from './components/SwitcherList'
import { getCoreUserNames, getRecentLoginUsernames, getRecentUserNames, sortUserNames } from './helpers'

export type Props = {
  onSwitch: (value: boolean) => void
}

export type StateProps = {
  username: string,
  context: EdgeContext,
  disklet: Disklet,
  forceClose?: boolean
}

export const selector = (state: RootState): StateProps => ({
  username: state.core.account.username,
  context: state.core.context,
  disklet: state.core.disklet
})

export default function AccountSwitcher(props: Props) {
  const [localUsers, setLocalUsers] = useState([])
  const [mostRecentUsernames, setMostRecentUsernames] = useState([])

  const theme = useTheme()
  const styles = getStyles(theme)

  const { onSwitch, forceClose } = props

  const dispatch = useDispatch()

  const { username, context, disklet }: StateProps = useSelector(selector, reduxShallowEqual)

  const coreUserNames = getCoreUserNames(localUsers, username)
  const usernames = [...getRecentUserNames(username, mostRecentUsernames, coreUserNames), ...sortUserNames(coreUserNames, username)]

  useEffect(() => {
    const cleanup = context.watch('localUsers', localUsers => setLocalUsers(localUsers))

    getRecentLoginUsernames(disklet)
      .then(mostRecentUsernames => setMostRecentUsernames(mostRecentUsernames))
      .catch(showError)

    return () => cleanup()
  }, [context, context.localUsers, disklet])

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
  listItem: {
    height: 40,
    borderBottomWidth: 1,
    display: 'flex',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listItemText: {
    textAlign: 'center',
    color: 'white'
  },
  separator: {
    marginBottom: theme.rem(1),
    marginTop: theme.rem(1.2),
    marginRight: theme.rem(-2)
  }
}))
