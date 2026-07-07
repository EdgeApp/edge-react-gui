import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { logActivity } from '../../util/logger'
import {
  asMoneroUserSettings,
  type MoneroUserSettings
} from '../../util/monero'
import { EdgeCard } from '../cards/EdgeCard'
import {
  type CurrencySettingProps,
  maybeCurrencySetting
} from '../hoc/MaybeCurrencySetting'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsSubHeader } from '../settings/SettingsSubHeader'

type Props = CurrencySettingProps<MoneroUserSettings, undefined>

const MoneroUserSettingsComponent: React.FC<Props> = props => {
  const { defaultSetting, onUpdate, pluginId, setting } = props
  const {
    enableCustomServers,
    enableCustomMonerod,
    moneroLightwalletServer,
    monerodServer
  } = setting

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  // Imported wallets are barred from Edge's LWS because each watched wallet
  // incurs ongoing scanning costs on the server side.
  const hasImportedLwsWallet = React.useMemo(() => {
    return Object.values(currencyWallets).some(wallet => {
      if (wallet.currencyInfo.pluginId !== pluginId) return false
      return wallet.imported && wallet.walletSettings.backend === 'lws'
    })
  }, [currencyWallets, pluginId])

  const isLwsEmpty =
    moneroLightwalletServer === '' ||
    moneroLightwalletServer === defaultSetting.moneroLightwalletServer
  const isMonerodEmpty =
    monerodServer === '' || monerodServer === defaultSetting.monerodServer

  // LWS handlers

  const handleEdgeLws = useHandler(async (): Promise<void> => {
    if (hasImportedLwsWallet) {
      showError(
        new Error(lstrings.settings_monero_edge_lws_imported_wallet_error)
      )
      return
    }
    await onUpdate({ ...setting, enableCustomServers: false })
    logActivity(`Disable Monero custom LWS`)
  })

  const handleCustomLws = useHandler(async (): Promise<void> => {
    const server = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCapitalize="none"
        autoCorrect={false}
        bridge={bridge}
        initialValue={moneroLightwalletServer ?? ''}
        inputLabel={lstrings.settings_custom_node_url}
        title={lstrings.settings_edit_custom_node}
      />
    ))
    if (isLwsEmpty && server == null) return

    const url = server ?? moneroLightwalletServer
    await onUpdate({
      ...setting,
      enableCustomServers: true,
      moneroLightwalletServer: url
    })
    logActivity(`Enable Monero custom LWS: "${url}"`)
  })

  // Monerod handlers

  const handleEdgeMonerod = useHandler(async (): Promise<void> => {
    await onUpdate({ ...setting, enableCustomMonerod: false })
    logActivity(`Disable Monero custom monerod`)
  })

  const handleCustomMonerod = useHandler(async (): Promise<void> => {
    const server = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCapitalize="none"
        autoCorrect={false}
        bridge={bridge}
        initialValue={monerodServer ?? ''}
        inputLabel={lstrings.settings_custom_node_url}
        title={lstrings.settings_edit_custom_node}
      />
    ))
    if (isMonerodEmpty && server == null) return

    const url = server ?? monerodServer
    await onUpdate({
      ...setting,
      enableCustomMonerod: true,
      monerodServer: url
    })
    logActivity(`Enable Monero custom monerod: "${url}"`)
  })

  const customLwsLabel =
    lstrings.settings_monero_custom +
    (isLwsEmpty ? '' : `:\n${moneroLightwalletServer}`)
  const customMonerodLabel =
    lstrings.settings_monerod_custom_full_node +
    (isMonerodEmpty ? '' : `:\n${monerodServer}`)

  return (
    <>
      <SettingsHeaderRow label={lstrings.settings_monero} />
      <SettingsSubHeader label={lstrings.settings_monero_lws_info} />
      <EdgeCard sections>
        <SettingsRadioRow
          label={lstrings.settings_monero_edge_lws}
          value={!enableCustomServers}
          onPress={handleEdgeLws}
        />
        <SettingsRadioRow
          label={customLwsLabel}
          value={enableCustomServers}
          onPress={handleCustomLws}
        />
      </EdgeCard>
      <SettingsHeaderRow label={lstrings.settings_monerod} />
      <EdgeCard sections>
        <SettingsRadioRow
          label={lstrings.settings_monerod_edge_full_node}
          value={!enableCustomMonerod}
          onPress={handleEdgeMonerod}
        />
        <SettingsRadioRow
          label={customMonerodLabel}
          value={enableCustomMonerod}
          onPress={handleCustomMonerod}
        />
      </EdgeCard>
    </>
  )
}

export const MaybeMoneroUserSettings = maybeCurrencySetting(
  MoneroUserSettingsComponent,
  asMoneroUserSettings,
  undefined
)
