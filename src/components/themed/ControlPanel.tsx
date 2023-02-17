/* eslint-disable react-native/no-raw-text */

import { DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer'
import { DrawerActions } from '@react-navigation/native'
import { EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, Platform, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Share from 'react-native-share'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { deleteLocalAccount } from '../../actions/AccountActions'
import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { logoutRequest } from '../../actions/LoginActions'
import { Fontello } from '../../assets/vector'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { EDGE_URL } from '../../constants/constantSettings'
import { guiPlugins, IONIA_SUPPORTED_FIATS } from '../../constants/plugins/GuiPlugins'
import { ENV } from '../../env'
import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { TitleText } from '../text/TitleText'
import { DividerLine } from './DividerLine'
import { ModalMessage, ModalTitle } from './ModalParts'

const xButtonGradientStart = { x: 0, y: 0 }
const xButtonGradientEnd = { x: 0, y: 0.75 }

export function ControlPanel(props: DrawerContentComponentProps) {
  // Fix this type assertion (seems like DrawerContentComponentProps works just fine as NavigationBase?)
  const navigation: NavigationBase = props.navigation as any
  const isDrawerOpen = useDrawerStatus() === 'open'

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { hideIoniaRewards = false } = config

  // ---- Redux State ----

  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const activeUsername = useSelector(state => state.core.account.username)
  const context = useSelector(state => state.core.context)
  const selectedWallet = useSelectedWallet()
  const selectedDenomination = useSelector(state => {
    if (selectedWallet == null) return
    return getDisplayDenomination(state, selectedWallet.wallet.currencyInfo.pluginId, selectedWallet.currencyCode)
  })

  /// ---- Local State ----

  // Maintain the list of usernames:
  const localUsers = useWatch(context, 'localUsers')
  const usernames = React.useMemo(() => arrangeUsers(localUsers, activeUsername), [localUsers, activeUsername])

  // User List dropdown/open state:
  const [isDropped, setIsDropped] = React.useState(false)
  const isMultiUsers = usernames.length > 0
  const handleToggleDropdown = () => {
    if (isMultiUsers) setIsDropped(!isDropped)
  }
  React.useEffect(() => {
    if (!isDrawerOpen || !isMultiUsers) setIsDropped(false)
  }, [isDrawerOpen, isMultiUsers])

  const [bottomPanelHeight, setBottomPanelHeight] = React.useState(0)

  /// ---- Callbacks ----

  const handleDeleteAccount = (username: string) => () => {
    Airship.show<'ok' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.forget_account_title}
        message={sprintf(s.strings.forget_account_message_common, username)}
        buttons={{
          ok: {
            label: s.strings.string_forget,
            onPress: async () => {
              await dispatch(deleteLocalAccount(username))
              return true
            },
            type: 'primary'
          },
          cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
        }}
      />
    ))
  }

  const handleSwitchAccount = (username: string) => () => {
    dispatch(logoutRequest(navigation, username))
  }

  const handleBorrow = () => {
    navigation.navigate('loanDashboard', {})
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  const handleScanQr = () => {
    navigation.dispatch(DrawerActions.closeDrawer())
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        title={s.strings.scan_qr_label}
        textModalAutoFocus={false}
        textModalBody={
          <ScrollView>
            <ModalTitle>{s.strings.enter_any_title}</ModalTitle>
            <ModalMessage>{s.strings.enter_any_body}</ModalMessage>
          </ScrollView>
        }
        textModalHint={s.strings.enter_any_input_hint}
      />
    ))
      .then((result: string | undefined) => {
        if (result) {
          const deepLink = parseDeepLink(result)
          dispatch(launchDeepLink(navigation, deepLink))
        }
      })
      .catch(showError)
  }

  const handleShareApp = () => {
    const message = `${sprintf(s.strings.share_subject, config.appName)}\n\n${s.strings.share_message}\n\n`

    const shareOptions = {
      message: Platform.OS === 'ios' ? message : message + EDGE_URL,
      url: Platform.OS === 'ios' ? EDGE_URL : ''
    }
    Share.open(shareOptions).catch(e => console.log(e))
  }

  const handleBottomPanelLayout = (event: any) => {
    setBottomPanelHeight(event.nativeEvent.layout.height)
  }

  /// ---- Animation ----

  // Track the destination height of the dropdown
  const userListDesiredHeight = styles.rowContainer.height * usernames.length + theme.rem(1)
  const userListHeight = Math.min(userListDesiredHeight, bottomPanelHeight)
  const isUserListHeightOverflowing = userListDesiredHeight >= bottomPanelHeight

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

  const themeRem2 = theme.rem(2) // We cannot call theme.rem from within worklet
  const aBorderBottomRightRadius = useAnimatedStyle(() => ({
    // Use a easeInCirc easing function for the border transition
    borderBottomRightRadius: isUserListHeightOverflowing ? themeRem2 - themeRem2 * (1 - Math.sqrt(1 - sAnimationMult.value ** 4)) : themeRem2
  }))
  const aDropdown = useAnimatedStyle(() => ({
    height: sMaxHeight.value * sAnimationMult.value
  }))
  const aFade = useAnimatedStyle(() => ({
    opacity: 0.8 * sAnimationMult.value
  }))
  const aRotate = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${(isDropped ? -180 : 180) * sAnimationMult.value}deg` }]
  }))

  /// ---- Row Data ----

  const rowDatas: Array<{
    pressHandler: () => void
    iconName?: string // Fontello
    iconNameFontAwesome?: string
    title: string
  }> = [
    {
      pressHandler: () => {
        navigation.navigate('fioAddressList', {})
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-fio-names',
      title: s.strings.drawer_fio_names
    },
    {
      pressHandler: () => {
        navigation.navigate('fioRequestList', {})
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-fio',
      title: s.strings.drawer_fio_requests
    },
    {
      pressHandler: () => {
        navigation.navigate('wcConnections', {})
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-wallet-connect',
      title: s.strings.wc_walletconnect_title
    },
    {
      pressHandler: () => handleScanQr(),
      iconName: 'control-panel-scan-qr',
      title: s.strings.drawer_scan_qr_send
    },
    ...(ENV.BETA_FEATURES ? [{ pressHandler: handleBorrow, iconName: 'control-panel-borrow', title: s.strings.drawer_borrow_dollars }] : []),
    {
      pressHandler: () => {
        navigation.navigate('termsOfService', {})
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-tos',
      title: s.strings.title_terms_of_service
    },
    { pressHandler: handleShareApp, iconName: 'control-panel-share', title: s.strings.string_share + ' ' + config.appName },
    {
      pressHandler: () => {
        navigation.navigate('settingsOverview', {})
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconName: 'control-panel-settings',
      title: s.strings.settings_title
    },
    {
      pressHandler: async () => dispatch(logoutRequest(navigation)),
      iconName: 'control-panel-logout',
      title: s.strings.settings_button_logout
    },
    // Dummy row that goes under the transparent close button
    {
      pressHandler: async () => {},
      title: ''
    }
  ]

  if (!hideIoniaRewards && IONIA_SUPPORTED_FIATS.includes(defaultFiat)) {
    rowDatas.unshift({
      pressHandler: () => {
        navigation.navigate('pluginViewSell', { plugin: guiPlugins.ionia })
        navigation.dispatch(DrawerActions.closeDrawer())
      },
      iconNameFontAwesome: 'hand-holding-usd',
      title: sprintf(s.strings.side_menu_rewards_button_1s, defaultFiat)
    })
  }

  const handlePressClose = () => {
    navigation.dispatch(DrawerActions.closeDrawer())
  }

  const xButtonTopColor = theme.modal + '00' // Add full transparency to the modal color
  const xButtonBottomColor = theme.modal

  return (
    <SceneWrapper hasHeader={false} hasTabs={false} background="none">
      {/* ==== Top Panel Start ==== */}
      <View style={styles.topPanel}>
        <Image style={styles.logoImage} source={theme.primaryLogo} resizeMode="contain" />
        {/* ==== Rate Display Start ==== */}
        <View style={styles.rowContainer}>
          {selectedWallet == null || selectedDenomination == null ? (
            <TitleText style={{ ...styles.text, marginLeft: theme.rem(1), marginRight: theme.rem(1) }}>{s.strings.exchange_rate_loading_singular}</TitleText>
          ) : (
            <>
              <View style={styles.rowIconContainer}>
                <CryptoIcon pluginId={selectedWallet.wallet.currencyInfo.pluginId} sizeRem={1.5} tokenId={selectedWallet.tokenId} />
              </View>
              <View style={styles.rowBodyContainer}>
                <TitleText style={styles.text}>
                  {`1 ${selectedDenomination.name} = `}
                  <FiatText
                    appendFiatCurrencyCode
                    autoPrecision
                    fiatSymbolSpace
                    nativeCryptoAmount={selectedDenomination.multiplier}
                    tokenId={selectedWallet.tokenId}
                    wallet={selectedWallet.wallet}
                  />
                </TitleText>
              </View>
            </>
          )}
        </View>
        {/* ==== Rate Display End ==== */}
        <Pressable onPress={handleToggleDropdown} style={styles.rowContainer}>
          <View style={styles.rowIconContainer}>
            <Fontello name="control-panel-account" style={styles.icon} size={theme.rem(1.5)} color={theme.iconTappable} />
          </View>
          <View style={styles.rowBodyContainer}>
            <TitleText style={styles.text}>{activeUsername}</TitleText>
          </View>
          {isMultiUsers ? (
            <View style={styles.rowIconContainer}>
              <Animated.View style={aRotate}>
                <Feather name="chevron-down" color={theme.iconTappable} size={theme.rem(1.5)} />
              </Animated.View>
            </View>
          ) : null}
        </Pressable>
        <DividerLine marginRem={[0.25, -2, 2, 1]} />
      </View>
      {/* ==== Top Panel End ==== */}
      {/* ==== Bottom Panel Start ==== */}
      <View style={styles.bottomPanel} onLayout={handleBottomPanelLayout}>
        {/* === Dropdown Start === */}
        <Animated.View style={[styles.dropContainer, aBorderBottomRightRadius, aDropdown]}>
          <ScrollView>
            {usernames.map((username: string) => (
              <View key={username} style={styles.rowContainer}>
                {/* This empty container is required to align the row contents properly */}
                <View style={styles.rowIconContainer} />
                <TouchableOpacity style={styles.rowBodyContainer} onPress={handleSwitchAccount(username)}>
                  <TitleText style={styles.text}>{username}</TitleText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rowIconContainer} onPress={handleDeleteAccount(username)}>
                  <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.iconTappable} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
        {/* === Dropdown End === */}
        <Animated.View style={[styles.disable, styles.invisibleTapper, aFade]} pointerEvents="none" />
        {!isDropped ? null : <Pressable style={styles.invisibleTapper} onPress={handleToggleDropdown} />}
        {/* === Navigation Rows Start === */}
        <View style={styles.rowsContainer}>
          <ScrollView overScrollMode="always">
            {rowDatas.map(rowData => (
              <TouchableOpacity onPress={rowData.pressHandler} key={rowData.title} style={styles.rowContainer}>
                <View style={styles.rowIconContainer}>
                  {rowData.iconName != null ? <Fontello name={rowData.iconName} style={styles.icon} size={theme.rem(1.5)} color={theme.iconTappable} /> : null}
                  {rowData.iconNameFontAwesome != null ? (
                    <FontAwesome5Icon name={rowData.iconNameFontAwesome} style={styles.icon} size={theme.rem(1.5)} color={theme.iconTappable} />
                  ) : null}
                </View>
                <View style={styles.rowBodyContainer}>
                  <TitleText style={styles.text}>{rowData.title}</TitleText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* === Navigation Rows End === */}
        </View>
        {/* === Translucent X Close Button Start === */}
        <LinearGradient
          colors={[xButtonTopColor, xButtonBottomColor]}
          style={styles.closeButtonContainer}
          start={xButtonGradientStart}
          end={xButtonGradientEnd}
        >
          <TouchableOpacity onPress={handlePressClose}>
            <AntDesignIcon name="close" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        </LinearGradient>
        {/* === Translucent X Close Button End === */}
      </View>
      {/* ==== Bottom Panel End ==== */}
    </SceneWrapper>
  )
}

/**
 * Given a list of users from the core,
 * remove the given user, then organize the 3 most recent users,
 * followed by the rest in alphabetical order.
 */
function arrangeUsers(localUsers: EdgeUserInfo[], activeUsername: string): string[] {
  // Sort the users according to their last login date (excluding active logged in user):
  const inactiveUsers = localUsers
    .filter(info => info.username !== activeUsername)
    .sort((a, b) => {
      const { lastLogin: aDate = new Date(0) } = a
      const { lastLogin: bDate = new Date(0) } = b
      return bDate.valueOf() - aDate.valueOf()
    })
    .map(info => info.username)

  // Get the most recent 3 users that were logged in
  const recentUsers = inactiveUsers.slice(0, 3)

  // Sort everything after the last 3 entries alphabetically:
  const oldUsers = inactiveUsers.slice(3).sort((a: string, b: string) => {
    const stringA = a.toUpperCase()
    const stringB = b.toUpperCase()
    if (stringA < stringB) return -1
    if (stringA > stringB) return 1
    return 0
  })

  return [...recentUsers, ...oldUsers]
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Containers/Panels
  topPanel: {
    backgroundColor: theme.modal,
    borderTopLeftRadius: theme.rem(1),
    borderTopColor: theme.sideMenuBorderColor,
    borderLeftColor: theme.sideMenuBorderColor,
    borderTopWidth: theme.sideMenuBorderWidth,
    borderLeftWidth: theme.sideMenuBorderWidth,
    height: theme.rem(10.5)
  },
  closeButtonContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    height: theme.rem(3),
    justifyContent: 'center',
    alignItems: 'center'
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
  rowIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(3),
    aspectRatio: 1,
    marginLeft: theme.rem(0.25)
  },
  rowBodyContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(1)
  },
  // Animation
  dropContainer: {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(2),
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
    height: theme.rem(1.5),
    width: theme.rem(1.5)
  },
  text: {
    fontFamily: theme.sideMenuFont,
    marginLeft: theme.rem(0.5)
  },
  invisibleTapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    borderBottomLeftRadius: theme.rem(2),
    zIndex: 1
  }
}))
