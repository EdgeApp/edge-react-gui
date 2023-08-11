import { asBoolean, asObject, asString } from 'cleaners'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { logActivity } from '../../util/logger'
import { CurrencySettingProps, maybeCurrencySetting } from '../hoc/MaybeCurrencySetting'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship } from '../services/AirshipInstance'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { SettingsSubHeader } from '../settings/SettingsSubHeader'

const asMoneroUserSettings = asObject({
  enableCustomServers: asBoolean,
  moneroLightwalletServer: asString
})
type MoneroUserSettings = ReturnType<typeof asMoneroUserSettings>

type Props = CurrencySettingProps<MoneroUserSettings, undefined>

function MoneroUserSettingsComponent(props: Props) {
  const { defaultSetting, onUpdate, setting } = props
  const { enableCustomServers, moneroLightwalletServer } = setting
  const isEmpty = moneroLightwalletServer === '' || moneroLightwalletServer === defaultSetting.moneroLightwalletServer

  const handleMyMonero = useHandler(async (): Promise<void> => {
    await onUpdate({
      enableCustomServers: false,
      moneroLightwalletServer
    })
    logActivity(`Disable Monero Node`)
  })

  const handleCustomServer = useHandler(async (): Promise<void> => {
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
    if (isEmpty && server == null) return

    await onUpdate({
      enableCustomServers: true,
      moneroLightwalletServer: server ?? moneroLightwalletServer
    })
    logActivity(`Enable Monero Node: "${server ?? moneroLightwalletServer}"`)
  })

  const customLabel = lstrings.settings_monero_custom + (isEmpty ? '' : `:\n${moneroLightwalletServer}`)

  return (
    <>
      <SettingsHeaderRow label={lstrings.settings_monero} />
      <SettingsSubHeader label={lstrings.settings_monero_info} />
      <SettingsRadioRow label={lstrings.settings_monero_default} value={!enableCustomServers} onPress={handleMyMonero} />
      <SettingsRadioRow label={customLabel} value={enableCustomServers} onPress={handleCustomServer} />
    </>
  )
}

export const MaybeMoneroUserSettings = maybeCurrencySetting(MoneroUserSettingsComponent, asMoneroUserSettings, undefined)
