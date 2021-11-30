/* eslint-disable react-native/no-raw-text */
// @flow

import { type EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, Platform, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Share from 'react-native-share'
import Feather from 'react-native-vector-icons/Feather'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import { deleteLocalAccount } from '../../actions/AccountActions.js'
import { logoutRequest } from '../../actions/LoginActions.js'
import { loginQrCodeScanned, qrCodeScanned } from '../../actions/ScanActions.js'
import { selectWalletFromModal } from '../../actions/WalletActions'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_S.png'
import { Fontello } from '../../assets/vector'
import { FIO_ADDRESS_LIST, FIO_REQUEST_LIST, SETTINGS_OVERVIEW_TAB, TERMS_OF_SERVICE, WALLET_CONNECT } from '../../constants/SceneKeys'
import { EDGE_URL, getPrivateKeySweepableCurrencies } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { getSelectedWallet } from '../../selectors/WalletSelectors'
import { useEffect, useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { type NavigationProp, type ParamList, Actions } from '../../types/routerTypes.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { ScanModal } from '../modals/ScanModal'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { DividerLine } from './DividerLine'
import { EdgeText } from './EdgeText'
import { FiatText } from './FiatText.js'

type Props = { navigation: NavigationProp<'controlPanel'> }

export function ControlPanel(props: Props) {
  const { navigation } = props
  const state: any = navigation.state
  const { isDrawerOpen } = state
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // ---- Redux State ----

  const activeUsername = useSelector(state => state.core.account.username)
  const context = useSelector(state => state.core.context)
  const selectedCurrencyCode = useSelector(state => state.ui.wallets.selectedCurrencyCode)
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const guiWallet = useSelector(getSelectedWallet)
  const currencyLogo = guiWallet != null ? getCurrencyIcon(guiWallet.currencyCode, selectedCurrencyCode).symbolImage : null
  const { name: currencyDenomName, multiplier: currencyDenomMult } = useSelector(state =>
    guiWallet != null ? getDisplayDenomination(state, selectedCurrencyCode) : { name: '', multiplier: '1' }
  )
  const isoFiatCurrencyCode = guiWallet != null ? guiWallet.isoFiatCurrencyCode : null

  /// ---- Local State ----

  // Maintain the list of usernames:
  const [usernames, setUsernames] = useState(arrangeUsers(context.localUsers, activeUsername))
  useEffect(() => context.watch('localUsers', localUsers => setUsernames(arrangeUsers(context.localUsers, activeUsername))))

  // User List dropdown/open state:
  const [isDropped, setIsDropped] = useState(false)
  const isMultiUsers = usernames.length > 0
  const handleToggleDropdown = () => {
    if (isMultiUsers) setIsDropped(!isDropped)
  }
  useEffect(() => {
    if (!isDrawerOpen || !isMultiUsers) setIsDropped(false)
  }, [isDrawerOpen, isMultiUsers])

  /// ---- Callbacks ----

  const handleDeleteAccount = (username: string) => () => {
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
            },
            type: 'primary'
          },
          cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
        }}
      />
    ))
  }

  const handleSwitchAccount = (username: string) => () => {
    dispatch(logoutRequest(username))
  }

  const handleSweep = () => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={getPrivateKeySweepableCurrencies()} showCreateWallet />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        dispatch(selectWalletFromModal(selectedWalletId, selectedCurrencyCode))
        Airship.show(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} isTextInput />)
          .then((result: string | void) => {
            if (result) {
              dispatch(qrCodeScanned(result))
            }
          })
          .catch(showError)
      }
    })
  }

  const handleLoginQr = () => {
    Actions.drawerClose()
    Airship.show(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string | void) => {
        if (result) {
          dispatch(loginQrCodeScanned(result))
        }
      })
      .catch(showError)
  }

  const handleShareApp = () => {
    const message = `${sprintf(s.strings.share_subject, s.strings.app_name)}\n\n${s.strings.share_message}\n\n`

    const shareOptions = {
      message: Platform.OS === 'ios' ? message : message + EDGE_URL,
      url: Platform.OS === 'ios' ? EDGE_URL : ''
    }
    Share.open(shareOptions).catch(e => console.log(e))
  }

  const handleGoToScene = (scene: $Keys<ParamList>, sceneProps: any) => {
    const { currentScene, drawerClose } = Actions

    if (currentScene !== scene) {
      navigation.navigate(scene, sceneProps)
    } else if (sceneProps) {
      navigation.setParams(sceneProps)
    }

    drawerClose()
  }

  /// ---- Animation ----

  // Track the destination height of the dropdown
  const userListMaxHeight = styles.rowContainer.height * usernames.length + theme.rem(1)

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

  /// ---- Row Data ----

  const rowDatas: any[] = [
    {
      pressHandler: () => handleGoToScene(FIO_ADDRESS_LIST),
      iconName: 'cp-fio-names',
      title: s.strings.drawer_fio_names
    },
    {
      pressHandler: () => handleGoToScene(FIO_REQUEST_LIST),
      iconName: 'cp-fio',
      title: s.strings.drawer_fio_requests
    },
    {
      pressHandler: () => handleGoToScene(WALLET_CONNECT),
      iconName: 'cp-wallet-connect',
      title: s.strings.wc_walletconnect_title
    },
    {
      pressHandler: () => handleLoginQr(),
      iconName: 'cp-scan-qr',
      title: s.strings.drawer_scan_qr_send
    },
    { pressHandler: handleSweep, iconName: 'cp-sweep', title: s.strings.drawer_sweep_private_key },
    {
      pressHandler: () => handleGoToScene(TERMS_OF_SERVICE),
      iconName: 'cp-tos',
      title: s.strings.title_terms_of_service
    },
    { pressHandler: handleShareApp, iconName: 'cp-share', title: s.strings.string_share + ' ' + s.strings.app_name },
    {
      pressHandler: () => handleGoToScene(SETTINGS_OVERVIEW_TAB),
      iconName: 'cp-settings',
      title: s.strings.settings_title
    },
    {
      pressHandler: () => dispatch(logoutRequest()),
      iconName: 'cp-logout',
      title: s.strings.settings_button_logout
    }
  ]

  const fiatText =
    isoFiatCurrencyCode === null ? (
      ''
    ) : (
      <FiatText
        nativeCryptoAmount={currencyDenomMult}
        cryptoCurrencyCode={selectedCurrencyCode}
        isoFiatCurrencyCode={isoFiatCurrencyCode}
        autoPrecision
        appendFiatCurrencyCode
      />
    )

  const exchangeRateText =
    isoFiatCurrencyCode === null ? (
      <EdgeText style={styles.text}>{s.strings.exchange_rate_loading_singular}</EdgeText>
    ) : (
      <EdgeText style={styles.text}>
        {`1 ${currencyDenomName} = `}
        {fiatText}
      </EdgeText>
    )

  return (
    <SceneWrapper hasHeader={false} hasTabs={false} isGapTop={false} background="none">
      {/* ==== Top Panel Start ==== */}
      <View style={styles.topPanel}>
        <Image style={styles.logoImage} source={edgeLogo} resizeMode="contain" />
        <View style={styles.rowContainer}>
          <View style={styles.rowIconContainer}>{!!currencyLogo && <Image style={styles.icon} source={{ uri: currencyLogo }} />}</View>
          <View style={styles.rowBodyContainer}>{exchangeRateText}</View>
        </View>
        <Pressable onPress={handleToggleDropdown} style={styles.rowContainer}>
          <View style={styles.rowIconContainer}>
            <Fontello name="cp-account" style={styles.icon} size={theme.rem(1.5)} color={theme.iconTappable} />
          </View>
          <View style={styles.rowBodyContainer}>
            <EdgeText style={styles.text}>{activeUsername}</EdgeText>
          </View>
          {isMultiUsers ? (
            <View style={styles.rowIconContainer}>
              <Animated.View style={aRotate}>
                <Feather name="chevron-down" color={theme.iconTappable} size={theme.rem(1.5)} />
              </Animated.View>
            </View>
          ) : null}
        </Pressable>
        <DividerLine marginRem={[0.5, -2, 2, 1]} />
      </View>
      {/* ==== Top Panel End ==== */}
      {/* ==== Bottom Panel Start ==== */}
      <View style={styles.bottomPanel}>
        {/* === Dropdown Start === */}
        <Animated.View style={[styles.dropContainer, aDropdown]}>
          <ScrollView>
            {usernames.map((username: string) => (
              <View key={username} style={styles.rowContainer}>
                {/* This empty container is required to align the row contents properly */}
                <View style={styles.rowIconContainer} />
                <TouchableOpacity style={styles.rowBodyContainer} onPress={handleSwitchAccount(username)}>
                  <EdgeText style={styles.text}>{username}</EdgeText>
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
          <ScrollView>
            {rowDatas.map(rowData => (
              <TouchableOpacity onPress={rowData.pressHandler} key={rowData.title} style={styles.rowContainer}>
                <View style={styles.rowIconContainer}>
                  <Fontello name={rowData.iconName} style={styles.icon} size={theme.rem(1.5)} color={theme.iconTappable} />
                </View>
                <View style={styles.rowBodyContainer}>
                  <EdgeText style={styles.text}>{rowData.title}</EdgeText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* === Navigation Rows End === */}
        </View>
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
  // Containers/Panels
  topPanel: {
    backgroundColor: theme.modal,
    borderTopLeftRadius: theme.rem(2),
    height: theme.rem(10.5)
  },
  bottomPanel: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(2)
  },
  rowsContainer: {
    flex: 1,
    flexGrow: 1,
    marginBottom: theme.rem(1.5)
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
    flexGrow: 1
  },
  // Animation
  dropContainer: {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(2),
    borderBottomRightRadius: theme.rem(2),
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
    marginTop: theme.rem(2)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5)
  },
  text: {
    fontFamily: theme.fontFaceMedium,
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
