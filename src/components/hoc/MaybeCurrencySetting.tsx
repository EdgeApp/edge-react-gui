import { asMaybe, Cleaner, uncleaner } from 'cleaners'
import { EdgeCurrencyConfig } from 'edge-core-js'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'

/**
 * Specific settings sections will receive these cleaned props.
 */
export interface CurrencySettingProps<T, X> {
  // The starting value, taken from the plugin's currency info:
  defaultSetting: T

  // The current value, taken from disk:
  setting: T

  // Extra information passed to the component at creation time,
  // to customize its appearance or such:
  extraInfo: X

  // Called when the user tries to update the setting:
  onUpdate: (setting: T) => Promise<void>
}

interface Props {
  currencyConfig: EdgeCurrencyConfig
}

/**
 * Renders a settings section, but only if the cleaner passes.
 */
export function maybeCurrencySetting<T, X>(
  Component: React.FunctionComponent<CurrencySettingProps<T, X>>,
  cleaner: Cleaner<T>,
  extraInfo: X
): React.FunctionComponent<Props> {
  const asMaybeSetting = asMaybe(cleaner)
  const wasSetting = uncleaner(cleaner)

  return function CurrencySettingsSection(props: Props) {
    const { currencyConfig } = props

    const defaultSetting = React.useMemo(() => asMaybeSetting(currencyConfig.currencyInfo.defaultSettings), [currencyConfig])

    const userSettings = useWatch(currencyConfig, 'userSettings')
    const setting = React.useMemo(() => asMaybeSetting(userSettings), [userSettings])

    const handleUpdate = useHandler(
      async settings =>
        await currencyConfig.changeUserSettings({
          ...currencyConfig.userSettings,
          ...wasSetting(settings)
        })
    )

    return defaultSetting == null ? null : (
      <Component defaultSetting={defaultSetting} extraInfo={extraInfo} setting={setting ?? defaultSetting} onUpdate={handleUpdate} />
    )
  }
}
