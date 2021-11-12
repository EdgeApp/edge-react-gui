// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext, type EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Alert, Pressable, ScrollView, TouchableHighlight, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Feather from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { deleteLocalAccount } from '../../actions/AccountActions.js'
import { logoutRequest } from '../../actions/LoginActions.js'
import { Fontello } from '../../assets/vector'
import s from '../../locales/strings'
import { useEffect, useRef, useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'

type Props = {
  onToggle?: (value: boolean) => void
}

export function AccountList({ onToggle }: Props) {
  const { activeUsername, context, disklet } = useSelector(state => {
    const activeUsername = state.core.account.username
    const context = state.core.context
    const disklet = state.core.disklet
    return { activeUsername, context, disklet }
  })
  const dispatch = useDispatch()
  const duration = 300
  const theme = useTheme()
  const styles = getStyles(theme)
  const [localUsers, setLocalUsers] = useState<EdgeUserInfo[]>([])
  const [mostRecentUsernames, setMostRecentUsernames] = useState<string[]>([])
  const [usersSubscription, setUsersSubscription] = useState<void | (() => mixed)>(() => {})

  // Grab all usernames that aren't logged in:
  const inactiveUsernames = localUsers.map(({ username }: EdgeUserInfo) => username).filter(name => name !== activeUsername)

  // Move recent usernames to their own list:
  const recentUsernames = []
  for (const username of mostRecentUsernames) {
    const index = inactiveUsernames.indexOf(username)
    if (index < 0) continue // Skip deleted & logged-in users
    inactiveUsernames.splice(index, 1)
    recentUsernames.push(username)
  }

  useEffect(() => {
    console.warn('UE Users changed: ', localUsers)
    setLocalUsers(localUsers)
  }, [localUsers])

  const contextRef = useRef<EdgeContext>(context)
  useEffect(() => {
    const handleUserChange = localUsers => {
      console.warn('Users changed: ', localUsers)
      setLocalUsers(localUsers)
    }

    setUsersSubscription(contextRef.current?.watch('localUsers', handleUserChange))

    getRecentLoginUsernames(disklet)
      .then(mostRecentUsernames => setMostRecentUsernames(mostRecentUsernames))
      .catch(showError)

    setLocalUsers(contextRef.current?.localUsers)

    return () => {
      if (usersSubscription) usersSubscription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSwitchAccount = (username: string) => {
    dispatch(logoutRequest(username))
  }

  const handlePressDeleteLocalAccount = (username: string) =>
    Alert.alert(s.strings.delete_account_header, sprintf(s.strings.delete_username_account, username), [
      { text: s.strings.no, style: 'cancel' },
      { text: s.strings.yes, onPress: () => dispatch(deleteLocalAccount(username)) }
    ])

  const getRecentLoginUsernames = async (disklet: Disklet): Promise<string[]> => {
    const lastUsers = await disklet
      .getText('lastusers.json')
      .then(text => JSON.parse(text))
      .catch(_ => [])
    return lastUsers.slice(0, 4)
  }

  const sortUsernames = (inactiveUsernames: string[]): string[] => {
    return inactiveUsernames.sort((a: string, b: string) => {
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

  const usernames = [...recentUsernames, ...sortUsernames(inactiveUsernames)]
  const numItems = usernames.length
  const listHeight = styles.row.height * numItems + theme.rem(1)
  const height = useSharedValue(0)
  const [isOpen, setIsOpen] = useState(false)
  const onPress = () => {
    // Notify caller of dropdown opening
    if (onToggle) onToggle(isOpen)
    height.value = !isOpen ? listHeight : 0
    setIsOpen(!isOpen)
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(height.value, {
        duration: duration,
        easing: Easing.linear
      })
    }
  })

  return (
    <View>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.iconUser}>
            <Fontello name="edge.logo" size={theme.rem(1.5)} color={theme.mainMenuIcon} />
          </View>
          <View style={styles.textContainer}>
            <EdgeText style={styles.text}>{activeUsername}</EdgeText>
          </View>
          <Feather name="chevron-down" color={theme.mainMenuIcon} size={theme.rem(1.5)} />
        </View>
      </Pressable>
      <DividerLine marginRem={[1, -2, 0, 0]} />
      <Animated.View style={[styles.root, animatedStyle]}>
        <ScrollView style={styles.container}>
          {usernames.map((username: string) => (
            <View key={username} style={styles.row}>
              <TouchableHighlight
                style={styles.textContainer}
                onPress={() => {
                  onSwitchAccount(username)
                }}
              >
                <EdgeText style={styles.text}>{username}</EdgeText>
              </TouchableHighlight>
              <TouchableHighlight onPress={() => handlePressDeleteLocalAccount(username)}>
                <View /* Hack, do not remove */>
                  <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.mainMenuIcon} />
                </View>
              </TouchableHighlight>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  hide: {
    opacity: 0,
    position: 'absolute',
    zIndex: -1
  },
  root: {
    overflow: 'hidden'
  },
  container: {
    alignSelf: 'stretch'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.rem(2.5),
    paddingLeft: theme.rem(2)
  },
  textContainer: {
    marginRight: 'auto'
  },
  text: {
    fontFamily: theme.fontFaceBold
  },
  separator: {
    marginBottom: theme.rem(1),
    marginTop: theme.rem(1.2),
    marginRight: theme.rem(-2)
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: theme.rem(1),
    width: '100%'
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.rem(2)
  },
  iconUser: {
    marginRight: theme.rem(1.5)
  }
}))
