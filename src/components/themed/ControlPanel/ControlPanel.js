// @flow

import { type EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, Pressable, ScrollView, TouchableHighlight, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Feather from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { deleteLocalAccount } from '../../../actions/AccountActions.js'
import { logoutRequest } from '../../../actions/LoginActions.js'
import edgeLogo from '../../../assets/images/edgeLogo/Edge_logo_S.png'
import { Fontello } from '../../../assets/vector'
import s from '../../../locales/strings'
import { useEffect, useState } from '../../../types/reactHooks'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { ButtonsModal } from '../../modals/ButtonsModal.js'
import { Airship } from '../../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'
import { DividerLine } from '../DividerLine'
import { EdgeText } from '../EdgeText'
import { ControlPanelRateComponent } from './ControlPanelRate.js'
import { ControlPanelRowsComponent } from './ControlPanelRows.js'

type Props = { navigation: NavigationProp<'controlPanel'>, isDrawerOpen: { state: { isDrawerOpen: boolean } } }

export function ControlPanel(props: Props) {
  const { navigation, isDrawerOpen } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // ---- Redux State ----

  const activeUsername = useSelector(state => state.core.account.username)
  const context = useSelector(state => state.core.context)

  /// ---- Local State ----

  // Maintain the list of usernames:
  const [usernames, setUsernames] = useState(() => arrangeUsers(context.localUsers, activeUsername))
  useEffect(() => context.watch('localUsers', localUsers => setUsernames(arrangeUsers(context.localUsers, activeUsername))), [context, activeUsername])

  // User List dropdown/open state:
  const [isDropped, setIsDropped] = useState(false)
  const handleToggleDropdown = () => {
    setIsDropped(!isDropped)
  }
  useEffect(() => {
    if (!isDrawerOpen) setIsDropped(false)
  }, [isDrawerOpen])

  /// ---- Callbacks ----

  const handleDeleteAccount = (username: string) => {
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.delete_account_header}
        message={sprintf(s.strings.delete_username_account, username)}
        buttons={{
          ok: {
            label: s.strings.string_delete,
            async onPress() {
              await dispatch(deleteLocalAccount(username))
              return true
            }
          },
          cancel: { label: s.strings.string_cancel }
        }}
      />
    ))
  }

  const handleSwitchAccount = (username: string) => {
    dispatch(logoutRequest(username))
  }

  /// ---- Animation ----

  // Track the destination height of the dropdown
  const userListMaxHeight = styles.dropdownRow.height * usernames.length + theme.rem(1)

  // Height value above can change if users are added/removed
  const sMaxHeight = useSharedValue(userListMaxHeight)
  useEffect(() => {
    sMaxHeight.value = withTiming(userListMaxHeight)
  }, [sMaxHeight, userListMaxHeight])

  // Animation completion ratio/multiplier
  // Shared to sync fade & drop animations
  const sAnimationMult = useSharedValue(0)
  useEffect(() => {
    sAnimationMult.value = withTiming(isDropped ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.circle)
    })
  }, [sAnimationMult, isDropped])

  /// ---- Dynamic CSS ----

  const aDropdown = useAnimatedStyle(() => ({
    height: sMaxHeight.value * sAnimationMult.value
  }))
  const aFade = useAnimatedStyle(() => ({
    opacity: 0.8 * sAnimationMult.value
  }))
  const aRotate = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${(isDropped ? -180 : 180) * sAnimationMult.value}deg` }]
  }))

  return (
    <SceneWrapper hasHeader={false} hasTabs={false} isGapTop={false} background="none">
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Image style={styles.logoImage} source={edgeLogo} resizeMode="contain" />
          </View>
          <ControlPanelRateComponent />
          <View>
            <Pressable onPress={handleToggleDropdown}>
              <View style={styles.dropdownHeader}>
                <Fontello name="account" style={styles.icon} size={theme.rem(1.5)} color={theme.controlPanelIcon} />
                <EdgeText style={styles.text}>{activeUsername}</EdgeText>
                <Animated.View style={aRotate}>
                  <Feather name="chevron-down" color={theme.controlPanelIcon} size={theme.rem(1.5)} />
                </Animated.View>
              </View>
            </Pressable>
            <DividerLine marginRem={[1, -2, 0, 0]} />
            <Animated.View style={[styles.root, aDropdown]}>
              <ScrollView>
                {usernames.map((username: string) => (
                  <View key={username} style={styles.dropdownRow}>
                    <TouchableHighlight onPress={() => handleSwitchAccount(username)}>
                      <EdgeText style={styles.text}>{username}</EdgeText>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={() => handleDeleteAccount(username)}>
                      <View>
                        <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.controlPanelIcon} />
                      </View>
                    </TouchableHighlight>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </View>
        <ControlPanelRowsComponent navigation={navigation} />
        <DividerLine marginRem={[1, -2, 2, 1.25]} />
        <Animated.View style={[styles.disable, aFade]} pointerEvents="none" />
        {!isDropped ? null : <Pressable style={styles.invisibleTapper} onPress={handleToggleDropdown} />}
      </View>
    </SceneWrapper>
  )
}

/**
 * Given a list of users from the core,
 * remove the given user, then organize the 3 most recent users,
 * followed by the rest in alphabetical order.
 */
function arrangeUsers(localUsers: EdgeUserInfo[], activeUsername: string): string[] {
  // Sort the users according to their last login date:
  const usernames = localUsers
    .filter(info => info.username !== activeUsername)
    .sort((a, b) => {
      const { lastLogin: aDate = new Date(0) } = a
      const { lastLogin: bDate = new Date(0) } = b
      return aDate.valueOf() - bDate.valueOf()
    })
    .map(info => info.username)

  // Sort everything after the last 3 entries alphabetically:
  const oldUsernames = usernames.slice(3).sort((a: string, b: string) => {
    const stringA = a.toUpperCase()
    const stringB = b.toUpperCase()
    if (stringA < stringB) return -1
    if (stringA > stringB) return 1
    return 0
  })

  return [...usernames.slice(0, 3), ...oldUsernames]
}

const getStyles = cacheStyles((theme: Theme) => ({
  panel: {
    flex: 1,
    backgroundColor: theme.modal,
    position: 'relative',
    paddingRight: theme.rem(2),
    paddingTop: theme.rem(13.25),
    borderBottomLeftRadius: theme.rem(2),
    borderTopLeftRadius: theme.rem(2)
  },
  header: {
    borderBottomRightRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2),
    paddingLeft: theme.rem(1.2),
    paddingRight: theme.rem(2),
    borderTopLeftRadius: theme.rem(2),
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.modal,
    zIndex: 2
  },
  disable: {
    backgroundColor: theme.fadeDisable,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: theme.rem(2),
    borderBottomLeftRadius: theme.rem(2)
  },
  invisibleTapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(2),
    marginLeft: theme.rem(0.8)
  },
  logoImage: {
    height: theme.rem(2.5),
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(0.25)
  },
  root: {
    overflow: 'scroll'
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.rem(2.5),
    marginLeft: theme.rem(8.25)
  },
  text: {
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(-5)
  },
  dropdownHeader: {
    marginLeft: theme.rem(-0.25),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.rem(2)
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(0.5),
    height: theme.rem(1.5),
    width: theme.rem(2.5)
  },
  chevron: {
    marginRight: theme.rem(-0.5)
  }
}))
