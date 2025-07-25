/* eslint-disable react-native/no-raw-text */
import {
  DrawerContentComponentProps,
  useDrawerStatus
} from '@react-navigation/drawer'
import { DrawerActions } from '@react-navigation/native'
import { EdgeUserInfo } from 'edge-core-js'
import hashjs from 'hash.js'
import * as React from 'react'
import { Image, Platform, Pressable, ScrollView, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Share from 'react-native-share'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { useNotifCount } from '../../actions/LocalSettingsActions'
import { getRootNavigation, logoutRequest } from '../../actions/LoginActions'
import { executePluginAction } from '../../actions/PluginActions'
import { Fontello } from '../../assets/vector'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ENV } from '../../env'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { arrangeUsers } from '../../util/arrangeUsers'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { getUserInfoUsername } from '../../util/getAccountUsername'
import { getDisplayUsername } from '../../util/utils'
import { IONIA_SUPPORTED_FIATS } from '../cards/VisaCardCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { IconBadge } from '../icons/IconBadge'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { Services } from '../services/Services'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { TitleText } from '../text/TitleText'
import { DividerLine } from './DividerLine'
import { EdgeText } from './EdgeText'

const footerGradientStart = { x: 0, y: 0 }
const footerGradientEnd = { x: 0, y: 0.75 }

interface Props {
  navigation: DrawerContentComponentProps['navigation']
}

export function SideMenuComponent(props: Props) {
  const { navigation } = props
  const navigationBase = navigation as any as NavigationBase
  const isDrawerOpen = useDrawerStatus() === 'open'
  const number = useNotifCount()

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const insets = useSafeAreaInsets()

  // ---- Redux State ----

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  /// ---- Local State ----

  // Maintain the list of usernames:
  const localUsers = useWatch(context, 'localUsers')
  const watchedUsername = useWatch(account, 'username')
  const displayUsername = getDisplayUsername(
    account.rootLoginId,
    watchedUsername
  )

  const sortedUsers = React.useMemo(
    () => arrangeUsers(localUsers, account),
    [account, localUsers]
  )

  const footerContainerStyle = React.useMemo(() => {
    return [styles.footerContainer, { paddingBottom: insets.bottom }]
  }, [insets.bottom, styles.footerContainer])

  // User List dropdown/open state:
  const [isDropped, setIsDropped] = React.useState(false)
  const isMultiUsers = sortedUsers.length > 0
  const isAccountRowShown = watchedUsername != null || isMultiUsers

  const handleToggleDropdown = () => {
    if (isMultiUsers) setIsDropped(!isDropped)
  }
  React.useEffect(() => {
    if (!isDrawerOpen || !isMultiUsers) setIsDropped(false)
  }, [isDrawerOpen, isMultiUsers])

  const [bottomPanelHeight, setBottomPanelHeight] = React.useState(0)

  /// ---- Callbacks ----

  const handleDeleteAccount = (userInfo: EdgeUserInfo) => () => {
    const { loginId, username } = userInfo
    if (username == null) {
      showBackupModal({
        navigation: navigationBase,
        forgetLoginId: loginId
      })
    } else {
      Airship.show<'ok' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.forget_account_title}
          message={sprintf(lstrings.forget_account_message_common, username)}
          buttons={{
            ok: {
              label: lstrings.string_forget,
              onPress: async () => {
                await context.forgetAccount(loginId)
                return true
              },
              type: 'primary'
            },
            cancel: { label: lstrings.string_cancel_cap, type: 'secondary' }
          }}
        />
      )).catch(err => showError(err))
    }
  }

  const handleSwitchAccount = (userInfo: EdgeUserInfo) => () => {
    dispatch(
      logoutRequest(navigationBase, {
        nextLoginId: userInfo.loginId
      })
    ).catch(err => showError(err))
  }

  const handleBorrow = () => {
    navigation.navigate('edgeAppStack', { screen: 'loanDashboard' })
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  const handleScanQr = () => {
    navigation.dispatch(DrawerActions.closeDrawer())
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        scanModalTitle={lstrings.scan_qr_label}
        textModalAutoFocus={false}
        textModalTitle={lstrings.enter_any_title}
        textModalBody={lstrings.enter_any_body}
        textModalHint={lstrings.enter_any_input_hint}
      />
    ))
      .then(async (result: string | undefined) => {
        if (result) {
          const deepLink = parseDeepLink(result)
          await dispatch(launchDeepLink(navigationBase, deepLink))
        }
      })
      .catch(err => showError(err))
  }

  const handleMarketsPress = () => {
    navigation.navigate('edgeAppStack', { screen: 'coinRanking' })
  }

  const handleShareApp = async () => {
    // Generate anonymized referral ID
    const data = Uint8Array.from(Buffer.from(account.rootLoginId, 'hex'))
    const refId = hashjs
      .sha256()
      .update(data)
      .digest('hex')
      .replace('0x', '')
      .substring(0, 10)

    const url = `${config.website}?af=appreferred_${refId}`
    const subject = sprintf(lstrings.share_subject, config.appName)

    await Share.open({
      failOnCancel: false,
      title: subject,
      subject,
      message: lstrings.share_message,
      url
    })
  }

  const handleBottomPanelLayout = (event: any) => {
    setBottomPanelHeight(event.nativeEvent.layout.height)
  }

  /// ---- Animation ----

  // Track the destination height of the dropdown
  const userListDesiredHeight =
    styles.rowContainer.height * sortedUsers.length + theme.rem(1)
  const userListHeight = Math.min(userListDesiredHeight, bottomPanelHeight)

  // Height value above can change if users are added/removed
  const sMaxHeight = useSharedValue(userListHeight)
  React.useEffect(() => {
    sMaxHeight.value = withTiming(userListHeight)
  }, [sMaxHeight, userListHeight])

  // Animation completion ratio/multiplier
  // Shared to sync fade & drop animations
  const sAnimationMult = useSharedValue(0)
  React.useEffect(() => {
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
    transform: [
      { rotateZ: `${(isDropped ? -180 : 180) * sAnimationMult.value}deg` }
    ]
  }))

  /// ---- Row Data ----

  const rowDatas: Array<{
    pressHandler: () => void | Promise<void>
    iconName?: string // Fontello
    iconNameFontAwesome?: string
    title: string
  }> = [
    {
      pressHandler: () => {
        navigation.navigate('edgeAppStack', { screen: 'notificationCenter' })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'notifications',
      title: lstrings.settings_notifications
    },
    {
      pressHandler: () => {
        navigation.navigate('edgeAppStack', { screen: 'fioAddressList' })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-fio-names',
      title: lstrings.drawer_fio_names
    },
    {
      pressHandler: () => {
        navigation.navigate('edgeAppStack', { screen: 'fioRequestList' })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-fio',
      title: lstrings.drawer_fio_requests
    },
    {
      pressHandler: () => {
        navigation.navigate('edgeAppStack', {
          screen: 'wcConnections',
          params: {}
        })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-wallet-connect',
      title: lstrings.wc_walletconnect_title
    },
    {
      pressHandler: () => handleScanQr(),
      iconName: 'control-panel-scan-qr',
      title: lstrings.drawer_scan_qr_send
    },
    {
      pressHandler: () => handleMarketsPress(),
      iconNameFontAwesome: 'chart-line',
      title: lstrings.title_markets
    },
    ...(ENV.BETA_FEATURES
      ? [
          {
            pressHandler: handleBorrow,
            iconName: 'control-panel-borrow',
            title: lstrings.drawer_borrow_dollars
          }
        ]
      : []),
    {
      pressHandler: handleShareApp,
      iconName: 'control-panel-share',
      title: lstrings.string_share + ' ' + config.appName
    },
    {
      pressHandler: () => {
        navigation.navigate('edgeAppStack', { screen: 'settingsOverview' })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-settings',
      title: lstrings.settings_title
    },
    {
      pressHandler: async () => await dispatch(logoutRequest(navigationBase)),
      iconName: 'control-panel-logout',
      title: lstrings.settings_button_logout
    },
    // Dummy row that goes under the transparent close button
    {
      pressHandler: async () => {},
      title: ''
    }
  ]

  if (ENV.FIO_INIT == null || ENV.FIO_INIT === false) {
    // Remove FIO rows
    let index = rowDatas.findIndex(
      row => row.title === lstrings.drawer_fio_names
    )
    if (index >= 0) rowDatas.splice(index, 1)
    index = rowDatas.findIndex(
      row => row.title === lstrings.drawer_fio_requests
    )
    if (index >= 0) rowDatas.splice(index, 1)
  }

  if (ENV.ENABLE_VISA_PROGRAM && IONIA_SUPPORTED_FIATS.includes(defaultFiat)) {
    rowDatas.unshift({
      pressHandler: () => {
        dispatch(
          executePluginAction(navigationBase, 'rewardscard', 'sell')
        ).catch(err => showError(err))
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconNameFontAwesome: 'credit-card',
      title: sprintf(lstrings.rewards_card_call_to_action, defaultFiat)
    })
  }

  const footerTopColor = theme.modal + '00' // Add full transparency to the modal color
  const footerBottomColor = theme.modal
  const rootNavigation = getRootNavigation(navigationBase)

  /// ---- Renderers ----

  const topPanel = (
    <View style={styles.topPanel}>
      <Image
        style={styles.logoImage}
        source={theme.primaryLogo}
        resizeMode="contain"
      />
      {isAccountRowShown ? (
        <>
          <Pressable
            accessible={false}
            onPress={handleToggleDropdown}
            style={styles.rowContainer}
          >
            <View style={styles.leftIconContainer}>
              <Fontello
                name="control-panel-account"
                style={styles.icon}
                size={theme.rem(1.5)}
                color={theme.iconTappable}
              />
            </View>
            <View style={styles.rowBodyContainer}>
              <EdgeText
                style={styles.text}
                disableFontScaling={Platform.OS === 'android'}
                ellipsizeMode="tail"
              >
                {displayUsername}
              </EdgeText>
            </View>
            {isMultiUsers ? (
              <View style={styles.rightIconContainer}>
                <Animated.View style={aRotate}>
                  <Feather
                    testID="downArrow"
                    name="chevron-down"
                    color={theme.iconTappable}
                    size={theme.rem(1.5)}
                  />
                </Animated.View>
              </View>
            ) : null}
          </Pressable>
          <DividerLine marginRem={[0.25, -2, 0, 1]} />
        </>
      ) : null}
    </View>
  )

  const usernameDropdown = (
    <>
      <Animated.View style={[styles.dropContainer, aDropdown]}>
        <ScrollView scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
          {sortedUsers.map(userInfo => (
            <View key={userInfo.loginId} style={styles.rowContainer}>
              {/* This empty container is required to align the row contents properly */}
              <View style={styles.leftIconContainer} />
              <EdgeTouchableOpacity
                style={styles.rowBodyContainer}
                onPress={handleSwitchAccount(userInfo)}
              >
                <EdgeText
                  style={styles.text}
                  disableFontScaling={Platform.OS === 'android'}
                  ellipsizeMode="tail"
                >
                  {getUserInfoUsername(userInfo)}
                </EdgeText>
              </EdgeTouchableOpacity>
              <EdgeTouchableOpacity
                style={styles.rightIconContainer}
                onPress={handleDeleteAccount(userInfo)}
              >
                <MaterialIcon
                  accessibilityHint={lstrings.close_control_panel_hint}
                  color={theme.iconTappable}
                  name="close"
                  size={theme.rem(1.5)}
                />
              </EdgeTouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      <Animated.View
        style={[styles.disable, styles.invisibleTapper, aFade]}
        pointerEvents="none"
      />
      <Pressable
        style={[styles.invisibleTapper, { zIndex: isDropped ? 1 : 0 }]}
        onPress={handleToggleDropdown}
      />
    </>
  )

  const navigationRows = (
    <>
      <View style={styles.rowsContainer}>
        <ScrollView
          overScrollMode="always"
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        >
          {rowDatas.map(rowData => (
            <EdgeTouchableOpacity
              accessible={false}
              onPress={rowData.pressHandler}
              key={rowData.title}
              style={styles.rowContainer}
            >
              <View style={styles.leftIconContainer}>
                {rowData.iconName === 'notifications' ? (
                  <IconBadge
                    number={number}
                    offsetX={theme.rem(0.25)}
                    offsetY={theme.rem(0.25)}
                    sizeRem={1.5}
                  >
                    <Ionicons
                      name="notifications-outline"
                      style={styles.icon}
                      size={theme.rem(1.5)}
                      color={theme.iconTappable}
                    />
                  </IconBadge>
                ) : rowData.iconName != null ? (
                  <Fontello
                    name={rowData.iconName}
                    style={styles.icon}
                    size={theme.rem(1.5)}
                    color={theme.iconTappable}
                  />
                ) : null}
                {rowData.iconNameFontAwesome != null ? (
                  <FontAwesome5Icon
                    name={rowData.iconNameFontAwesome}
                    style={styles.icon}
                    size={theme.rem(1.25)}
                    color={theme.iconTappable}
                  />
                ) : null}
              </View>
              <View style={styles.rowBodyContainer}>
                <TitleText style={styles.text}>{rowData.title}</TitleText>
              </View>
            </EdgeTouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <LinearGradient
        colors={[footerTopColor, footerBottomColor]}
        style={footerContainerStyle}
        start={footerGradientStart}
        end={footerGradientEnd}
      />
    </>
  )

  return (
    <OuterView insets={insets}>
      {topPanel}
      <View style={styles.bottomPanel} onLayout={handleBottomPanelLayout}>
        {usernameDropdown}
        {navigationRows}
      </View>
      <Services navigation={rootNavigation} />
    </OuterView>
  )
}

export const SideMenu = React.memo(SideMenuComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  // Containers/Panels
  topPanel: {
    backgroundColor: theme.modal,
    borderTopLeftRadius: theme.rem(1),
    borderTopColor: theme.sideMenuBorderColor,
    borderLeftColor: theme.sideMenuBorderColor,
    borderTopWidth: theme.sideMenuBorderWidth,
    borderLeftWidth: theme.sideMenuBorderWidth
  },
  footerContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    height: theme.rem(3),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: theme.rem(1)
  },
  bottomPanel: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: theme.modal,
    borderBottomColor: theme.sideMenuBorderColor,
    borderLeftColor: theme.sideMenuBorderColor,
    borderBottomWidth: theme.sideMenuBorderWidth,
    borderLeftWidth: theme.sideMenuBorderWidth,
    borderBottomLeftRadius: theme.rem(1)
  },
  rowsContainer: {
    flex: 1,
    flexGrow: 1,
    marginBottom: theme.rem(0)
  },
  rowContainer: {
    display: 'flex',
    height: theme.rem(2.75),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(3),
    aspectRatio: 1
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(3),
    marginHorizontal: theme.rem(0.5)
  },
  rowBodyContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1
  },
  // Animation
  dropContainer: {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(1),
    zIndex: 2,
    position: 'absolute',
    width: '100%'
  },
  disable: {
    backgroundColor: theme.fadeDisable
  },
  // Elements
  logoImage: {
    display: 'flex',
    alignSelf: 'center',
    height: theme.rem(2.25),
    marginTop: theme.rem(2),
    marginBottom: theme.rem(0.25)
  },
  icon: {
    height: theme.rem(1.5)
  },
  text: {
    fontFamily: theme.sideMenuFont
  },
  invisibleTapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    borderBottomLeftRadius: theme.rem(1),
    zIndex: 1
  }
}))

// TODO: Refactor more of SideMenu into styled components
const OuterView = styled(View)<{ insets: { top: number; bottom: number } }>(
  () => props => ({
    flexGrow: 1,
    paddingTop: props.insets.top,
    paddingBottom: props.insets.bottom
  })
)
