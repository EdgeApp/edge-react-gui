// @flow

import * as React from 'react'
import { Platform, ScrollView, TouchableOpacity } from 'react-native'
import Share from 'react-native-share'
import { sprintf } from 'sprintf-js'

import { logoutRequest } from '../../../actions/LoginActions.js'
import { selectWalletFromModal } from '../../../actions/WalletActions.js'
import { Fontello } from '../../../assets/vector/index.js'
import { FIO_ADDRESS_LIST, FIO_REQUEST_LIST, SCAN, SETTINGS_OVERVIEW_TAB, TERMS_OF_SERVICE, WALLET_CONNECT } from '../../../constants/SceneKeys'
import { EDGE_URL, getPrivateKeySweepableCurrencies } from '../../../constants/WalletAndCurrencyConstants.js'
import s from '../../../locales/strings.js'
import { useDispatch, useSelector } from '../../../types/reactRedux.js'
import { type NavigationProp, type ParamList, Actions } from '../../../types/routerTypes.js'
import { type WalletListResult, WalletListModal } from '../../modals/WalletListModal.js'
import { SWEEP_PRIVATE_KEY } from '../../scenes/ScanScene'
import { Airship } from '../../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { EdgeText } from '../../themed/EdgeText'

type Props = {
  navigation: NavigationProp<'controlPanel'>
}

export function ControlPanelRowsComponent(props: Props) {
  const { navigation } = props
  const theme = useTheme()

  // ---- Redux state ----

  const selectedCurrencyCode = useSelector(state => state.ui.wallets.selectedWalletId)
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedCurrencyCode)
  const dispatch = useDispatch()

  // ---- Press handlers ----

  const sweep = () => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={getPrivateKeySweepableCurrencies()} showCreateWallet />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        dispatch(selectWalletFromModal(selectedWalletId, selectedCurrencyCode))
        Actions.jump(SCAN, {
          data: SWEEP_PRIVATE_KEY
        })
      }
    })
  }

  const shareApp = () => {
    const message = `${sprintf(s.strings.share_subject, s.strings.app_name)}\n\n${s.strings.share_message}\n\n`

    const shareOptions = {
      message: Platform.OS === 'ios' ? message : message + EDGE_URL,
      EDGE_URL: Platform.OS === 'ios' ? EDGE_URL : ''
    }
    Share.open(shareOptions).catch(e => console.log(e))
  }

  const goToScene = (scene: $Keys<ParamList>, sceneProps: any) => {
    const { currentScene, drawerClose } = Actions

    if (currentScene !== scene) {
      navigation.navigate(scene, sceneProps)
    } else if (sceneProps) {
      navigation.setParams(sceneProps)
    }

    drawerClose()
  }

  const renderRow = (rowProps: { title: string, route?: $Keys<ParamList>, handlePress?: () => void, iconName: string }) => {
    const { title, route, handlePress, iconName } = rowProps
    const styles = getStyles(theme)

    return (
      <TouchableOpacity
        onPress={() => {
          if (route) goToScene(route)
          if (handlePress) handlePress()
        }}
        style={styles.row}
      >
        <Fontello style={styles.icon} name={iconName} size={theme.rem(1.5)} color={theme.controlPanelIcon} />
        <EdgeText style={styles.text}>{title}</EdgeText>
      </TouchableOpacity>
    )
  }

  const rowDatas: any[] = [
    { title: s.strings.drawer_fio_names, route: FIO_ADDRESS_LIST, iconName: 'fionames' },
    { title: s.strings.drawer_fio_requests, route: FIO_REQUEST_LIST, iconName: 'FIO-geometric' },
    { title: s.strings.wc_walletconnect_title, route: WALLET_CONNECT, iconName: 'walletConnect' },
    { title: s.strings.drawer_scan_qr_send, route: SCAN, iconName: 'scanqr' },
    { title: s.strings.drawer_sweep_private_key, handlePress: sweep, iconName: 'sweep' },
    { title: s.strings.title_terms_of_service, route: TERMS_OF_SERVICE, iconName: 'tos' },
    { title: s.strings.string_share + ' ' + s.strings.app_name, handlePress: shareApp, iconName: 'share' },
    { title: s.strings.settings_title, route: SETTINGS_OVERVIEW_TAB, iconName: 'settings' },
    {
      title: s.strings.settings_button_logout,
      handlePress: () => {
        dispatch(logoutRequest())
      },
      iconName: 'logout'
    }
  ]

  const rows = []
  for (const rowData of rowDatas) {
    rows.push(renderRow(rowData))
  }

  return <ScrollView>{rows}</ScrollView>
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    height: theme.rem(1.5),
    width: theme.rem(2.5)
  },
  row: {
    color: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: theme.rem(2.75)
  },
  text: {
    fontFamily: theme.fontFaceMedium
  }
}))
