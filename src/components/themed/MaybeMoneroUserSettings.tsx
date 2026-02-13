import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { logActivity } from '../../util/logger'
import {
  type CurrencySettingProps,
  maybeCurrencySetting
} from '../hoc/MaybeCurrencySetting'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship } from '../services/AirshipInstance'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsSubHeader } from '../settings/SettingsSubHeader'

const asMoneroUserSettings = asObject({
  enableCustomServers: asBoolean,
  enableCustomMonerod: asOptional(asBoolean, false),
  moneroLightwalletServer: asString,
  monerodServer: asString
})
type MoneroUserSettings = ReturnType<typeof asMoneroUserSettings>

type Props = CurrencySettingProps<MoneroUserSettings, undefined>

const MoneroUserSettingsComponent: React.FC<Props> = props => {
  const { defaultSetting, onUpdate, setting } = props
  const {
    enableCustomServers,
    enableCustomMonerod,
    moneroLightwalletServer,
    monerodServer
  } = setting
  const isLwsEmpty =
    moneroLightwalletServer === '' ||
    moneroLightwalletServer === defaultSetting.moneroLightwalletServer
  const isMonerodEmpty =
    monerodServer === '' || monerodServer === defaultSetting.monerodServer

  // LWS handlers

  const handleEdgeLws = useHandler(async (): Promise<void> => {
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
      <SettingsHeaderRow label={lstrings.settings_monerod} />
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
    </>
  )
}

export const MaybeMoneroUserSettings = maybeCurrencySetting(
  MoneroUserSettingsComponent,
  asMoneroUserSettings,
  undefined
)
