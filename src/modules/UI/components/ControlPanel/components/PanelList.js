// @flow

import * as React from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Share from 'react-native-share'
import { sprintf } from 'sprintf-js'

import { type WalletListResult, WalletListModal } from '../../../../../components/modals/WalletListModal.js'
import { SWEEP_PRIVATE_KEY } from '../../../../../components/scenes/ScanScene'
import { Airship } from '../../../../../components/services/AirshipInstance.js'
import * as Constants from '../../../../../constants/indexConstants.js'
import { getPrivateKeySweepableCurrencies } from '../../../../../constants/WalletAndCurrencyConstants.js'
import s from '../../../../../locales/strings.js'
import { THEME } from '../../../../../theme/variables/airbitz.js'
import PanelRow from './PanelRow'

export type Props = {
  onLogout: (username?: string) => void,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

export default function PanelBody(props: Props) {
  const { onSelectWallet, onLogout } = props

  const onSweep = () => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={getPrivateKeySweepableCurrencies()} showCreateWallet />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        onSelectWallet(walletId, currencyCode)
        Actions.jump(Constants.SCAN, { data: SWEEP_PRIVATE_KEY })
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
      <PanelRow title={s.strings.drawer_fio_names} route={Constants.FIO_ADDRESS_LIST} iconName="sort" />
      <PanelRow title={s.strings.drawer_fio_requests} route={Constants.FIO_REQUEST_LIST} iconName="sort" />
      <PanelRow title={s.strings.drawer_scan_qr_send} route={Constants.SCAN} iconName="sort" />
      <PanelRow title={s.strings.drawer_sweep_private_key} onPress={onSweep} iconName="sort" />
      <PanelRow title={s.strings.title_terms_of_service} route={Constants.TERMS_OF_SERVICE} iconName="sort" />
      <PanelRow title={s.strings.string_share + ' ' + s.strings.app_name} onPress={onShareApp} iconName="sort" />
      <PanelRow title={s.strings.settings_title} route={Constants.SETTINGS_OVERVIEW_TAB} iconName="sort" />
      <PanelRow title={s.strings.settings_button_logout} onPress={onLogout} iconName="sort" />
    </ScrollView>
  )
}
