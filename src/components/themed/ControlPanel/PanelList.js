// @flow

import * as React from 'react'
import { Platform, ScrollView } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Share from 'react-native-share'
import { sprintf } from 'sprintf-js'

import { Airship } from '../../../components/services/AirshipInstance.js'
import { FIO_ADDRESS_LIST, FIO_REQUEST_LIST, SCAN, SETTINGS_OVERVIEW_TAB, TERMS_OF_SERVICE } from '../../../constants/SceneKeys'
import { getPrivateKeySweepableCurrencies } from '../../../constants/WalletAndCurrencyConstants.js'
import s from '../../../locales/strings.js'
import { THEME } from '../../../theme/variables/airbitz.js'
import { type WalletListResult, WalletListModal } from '../../modals/WalletListModal.js'
import { SWEEP_PRIVATE_KEY } from '../../scenes/ScanScene'
import PanelRow from './PanelRow'

export type Props = {
  onLogout: (username?: string) => void,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

export default function PanelList(props: Props) {
  const { onSelectWallet, onLogout } = props

  const onSweep = () => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={getPrivateKeySweepableCurrencies()} showCreateWallet />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        onSelectWallet(walletId, currencyCode)
        Actions.jump(SCAN, { data: SWEEP_PRIVATE_KEY })
      }
    })
  }

  const onShareApp = () => {
    const url = THEME.websiteUrl
    const message = `${sprintf(s.strings.share_subject, s.strings.app_name)}\n\n${s.strings.share_message}\n\n`

    const shareOptions = {
      message: Platform.OS === 'ios' ? message : message + url,
      url: Platform.OS === 'ios' ? url : ''
    }

    Share.open(shareOptions).catch(e => console.log(e))
  }

  return (
    <ScrollView>
      <PanelRow title={s.strings.drawer_fio_names} route={FIO_ADDRESS_LIST} iconName="list.view" />
      <PanelRow title={s.strings.drawer_fio_requests} route={FIO_REQUEST_LIST} iconName="map" />
      <PanelRow title={s.strings.drawer_scan_qr_send} route={SCAN} iconName="scan.qr" />
      <PanelRow title={s.strings.drawer_sweep_private_key} onPress={onSweep} iconName="key" />
      <PanelRow title={s.strings.title_terms_of_service} route={TERMS_OF_SERVICE} iconName="list.box" />
      <PanelRow title={s.strings.string_share + ' ' + s.strings.app_name} onPress={onShareApp} iconName="share" />
      <PanelRow title={s.strings.settings_title} route={SETTINGS_OVERVIEW_TAB} iconName="settings" />
      <PanelRow title={s.strings.settings_button_logout} onPress={onLogout} iconName="logout" />
    </ScrollView>
  )
}
