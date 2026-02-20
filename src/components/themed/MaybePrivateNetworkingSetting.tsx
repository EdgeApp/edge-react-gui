import { asMaybe, asObject, asValue } from 'cleaners'
import * as React from 'react'

import {
  getLocalAccountSettings,
  writeNymWarningShown
} from '../../actions/LocalSettingsActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { logActivity } from '../../util/logger'
import {
  type CurrencySettingProps,
  maybeCurrencySetting
} from '../hoc/MaybeCurrencySetting'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { Airship } from '../services/AirshipInstance'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'

export const asPrivateNetworkingSetting = asObject({
  networkPrivacy: asValue('none', 'nym')
})
export type PrivateNetworkingSetting = ReturnType<
  typeof asPrivateNetworkingSetting
>

type Props = CurrencySettingProps<PrivateNetworkingSetting, undefined>

const asMaybePrivateNetworkingSetting = asMaybe(asPrivateNetworkingSetting)

const PrivateNetworkingSettingComponent: React.FC<Props> = props => {
  const { onUpdate, pluginId, setting } = props
  const { networkPrivacy } = setting
  const account = useSelector(state => state.core.account)

  const handleSelectNone = useHandler(async (): Promise<void> => {
    await onUpdate({ networkPrivacy: 'none' })
    logActivity(`Network privacy: none for ${pluginId}`)
  })

  const handleSelectNym = useHandler(async (): Promise<void> => {
    const otherNymCount = Object.keys(account.currencyConfig).filter(pid => {
      if (pid === pluginId) return false
      const cfg = account.currencyConfig[pid]
      const userSettings = asMaybePrivateNetworkingSetting(cfg.userSettings)
      const ds = asMaybePrivateNetworkingSetting(
        cfg.currencyInfo.defaultSettings
      )
      return (userSettings ?? ds)?.networkPrivacy === 'nym'
    }).length

    if (otherNymCount > 0) {
      const { isNymWarningShown } = await getLocalAccountSettings(account)
      if (!isNymWarningShown) {
        const confirmed = await Airship.show<boolean>(bridge => (
          <ConfirmContinueModal
            bridge={bridge}
            title={lstrings.settings_nym_multi_asset_warning_title}
            body={lstrings.settings_nym_multi_asset_warning_body}
            warning
            isSkippable
          />
        ))
        if (!confirmed) return
        await writeNymWarningShown(account)
      }
    }

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
