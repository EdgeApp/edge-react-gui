/* eslint-disable react-native/no-raw-text */

import { EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, Platform, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Share from 'react-native-share'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import { sprintf } from 'sprintf-js'

import ENV from '../../../env.json'
import { deleteLocalAccount } from '../../actions/AccountActions'
import { logoutRequest } from '../../actions/LoginActions'
import { parseScannedUri } from '../../actions/ScanActions'
import { selectWalletFromModal } from '../../actions/WalletActions'
import { Fontello } from '../../assets/vector'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { EDGE_URL } from '../../constants/constantSettings'
import { guiPlugins, IONIA_SUPPORTED_FIATS } from '../../constants/plugins/GuiPlugins'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Actions, NavigationProp, ParamList } from '../../types/routerTypes'
import { EdgeTokenId } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ScanModal } from '../modals/ScanModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { TitleText } from '../text/TitleText'
import { DividerLine } from './DividerLine'

interface Props {
  navigation: NavigationProp<'controlPanel'>
}

const SWEEPABLE_CURRENCY_CODES = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].isPrivateKeySweepable)
  .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)

export function ControlPanel(props: Props) {
  const { navigation } = props
  const state: any = navigation.state
  const { isDrawerOpen } = state
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { hideIoniaRewards = false } = config

  // ---- Redux State ----

  const account = useSelector(state => state.core.account)
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
    dispatch(logoutRequest(username))
  }

  const handleSweep = () => {
    // Only allow native assets, filtered by sweepable currency codes
    const allowedAssets: EdgeTokenId[] = Object.keys(account.currencyConfig)
      .filter(pluginId => {
        const currencyConfig = account.currencyConfig[pluginId]
        return SWEEPABLE_CURRENCY_CODES.some(
          sweepableCurrencyCode => currencyConfig.currencyInfo.currencyCode.toLowerCase() === sweepableCurrencyCode.toLowerCase()
        )
      })
      .map(pluginId =>
        // Return an "EdgeTokenId" specifying that this must NOT be a token
        // (implies it must be a supported native asset)
        ({ pluginId, tokenId: undefined })
      )

    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        allowedAssets={allowedAssets}
        allowedCurrencyCodes={SWEEPABLE_CURRENCY_CODES}
        showCreateWallet
      />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        dispatch(selectWalletFromModal(walletId, currencyCode))
        Airship.show<string | undefined>(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
          .then((result: string | undefined) => {
            if (result) {
              dispatch(parseScannedUri(result))
            }
          })
          .catch(showError)
      }
    })
  }

  const handleBorrow = () => {
    handleGoToScene('loanDashboard', {})
  }

  const handleLoginQr = () => {
    Actions.drawerClose()
    Airship.show<string | undefined>(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string | undefined) => {
        if (result) {
          dispatch(parseScannedUri(result))
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

  const handleGoToScene = (scene: keyof ParamList, sceneProps: any) => {
    const { currentScene, drawerClose } = Actions

    if (currentScene !== scene) {
      navigation.navigate(scene, sceneProps)
    } else if (sceneProps) {
      navigation.setParams(sceneProps)
    }

    drawerClose()
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
      pressHandler: () => handleGoToScene('fioAddressList', {}),
      iconName: 'control-panel-fio-names',
      title: s.strings.drawer_fio_names
    },
    {
      pressHandler: () => handleGoToScene('fioRequestList', {}),
      iconName: 'control-panel-fio',
      title: s.strings.drawer_fio_requests
    },
    {
      pressHandler: () => handleGoToScene('wcConnections', {}),
      iconName: 'control-panel-wallet-connect',
      title: s.strings.wc_walletconnect_title
    },
    {
      pressHandler: () => handleLoginQr(),
      iconName: 'control-panel-scan-qr',
      title: s.strings.drawer_scan_qr_send
    },
    { pressHandler: handleSweep, iconName: 'control-panel-sweep', title: s.strings.drawer_sweep_private_key },
    ...(ENV.BETA_FEATURES ? [{ pressHandler: handleBorrow, iconName: 'control-panel-borrow', title: s.strings.drawer_borrow_dollars }] : []),
    {
      pressHandler: () => handleGoToScene('termsOfService', {}),
      iconName: 'control-panel-tos',
      title: s.strings.title_terms_of_service
    },
    { pressHandler: handleShareApp, iconName: 'control-panel-share', title: s.strings.string_share + ' ' + config.appName },
    {
      pressHandler: () => handleGoToScene('settingsOverviewTab', {}),
      iconName: 'control-panel-settings',
      title: s.strings.settings_title
    },
    {
      pressHandler: async () => dispatch(logoutRequest()),
      iconName: 'control-panel-logout',
      title: s.strings.settings_button_logout
    }
  ]

  if (!hideIoniaRewards && IONIA_SUPPORTED_FIATS.includes(defaultFiat)) {
    rowDatas.unshift({
      pressHandler: () => handleGoToScene('pluginViewSell', { plugin: guiPlugins.ionia }),
      iconNameFontAwesome: 'hand-holding-usd',
      title: sprintf(s.strings.side_menu_rewards_button_1s, defaultFiat)
    })
  }

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
          <ScrollView>
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
