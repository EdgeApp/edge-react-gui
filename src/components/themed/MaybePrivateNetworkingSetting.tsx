import { asObject, asValue } from 'cleaners'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { logActivity } from '../../util/logger'
import {
  type CurrencySettingProps,
  maybeCurrencySetting
} from '../hoc/MaybeCurrencySetting'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'

export const asPrivateNetworkingSetting = asObject({
  networkPrivacy: asValue('none', 'nym')
})
export type PrivateNetworkingSetting = ReturnType<
  typeof asPrivateNetworkingSetting
>

type Props = CurrencySettingProps<PrivateNetworkingSetting, undefined>

const PrivateNetworkingSettingComponent: React.FC<Props> = props => {
  const { onUpdate, pluginId, setting } = props
  const { networkPrivacy } = setting

  const handleSelectNone = useHandler(async (): Promise<void> => {
    await onUpdate({ networkPrivacy: 'none' })
    logActivity(`Network privacy: none for ${pluginId}`)
  })

  const handleSelectNym = useHandler(async (): Promise<void> => {
    await onUpdate({ networkPrivacy: 'nym' })
    logActivity(`Network privacy: nym for ${pluginId}`)
  })

  return (
    <>
      <SettingsHeaderRow label={lstrings.settings_network_privacy_title} />
      <SettingsRadioRow
        label={lstrings.settings_network_privacy_default}
        value={networkPrivacy === 'none'}
        onPress={handleSelectNone}
      />
      <SettingsRadioRow
        label={lstrings.settings_network_privacy_nym_mixnet}
        value={networkPrivacy === 'nym'}
        onPress={handleSelectNym}
      />
    </>
  )
}

export const MaybePrivateNetworkingSetting = maybeCurrencySetting(
  PrivateNetworkingSettingComponent,
  asPrivateNetworkingSetting,
  undefined
)
