import * as React from 'react'

import { NotificationSettings, updateNotificationSettings } from '../../actions/NotificationActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface Props extends EdgeSceneProps<'notificationSettings'> {}

type NotificationSettingToggleSetting = keyof NotificationSettings

export const NotificationScene = (props: Props) => {
  const { navigation } = props
  const dispatch = useDispatch()

  const settings = useSelector(state => state.notificationSettings)
  const account = useSelector(state => state.core.account)

  const currencyConfigs = useWatch(account, 'currencyConfig')

  const handlePressToggleSetting = async (toggleSetting: NotificationSettingToggleSetting) => {
    try {
      await dispatch(updateNotificationSettings({ [toggleSetting]: !settings[toggleSetting] }))
    } catch (e: any) {
      showError(`Failed to reach notification server: ${e}`)
    }
  }

  const pluginIds = React.useMemo(
    () =>
      Object.keys(currencyConfigs)
        .filter(pluginId => settings.plugins[pluginId] != null)
        .sort((a, b) => a.localeCompare(b)),
    [currencyConfigs, settings.plugins]
  )

  return (
    <SceneWrapper scroll>
      <SettingsSwitchRow
        key="marketing-notifications"
        label={lstrings.settings_marketing_notifications_switch}
        value={!settings.ignoreMarketing}
        onPress={async () => await handlePressToggleSetting('ignoreMarketing')}
      />
      <SettingsSwitchRow
        key="price-notifications"
        label={lstrings.settings_price_notifications_switch}
        value={!settings.ignorePriceChanges}
        onPress={async () => await handlePressToggleSetting('ignorePriceChanges')}
      />
      {pluginIds.map(pluginId => {
        const { currencyInfo } = currencyConfigs[pluginId]
        const { keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

        const handlePress = () => {
          if (!settings.ignorePriceChanges) {
            navigation.navigate('currencyNotificationSettings', {
              currencyInfo
            })
          }
        }

        if (keysOnlyMode) return null

        return (
          <SettingsTappableRow disabled={settings.ignorePriceChanges} key={pluginId} label={currencyInfo.displayName} onPress={handlePress}>
            <CryptoIcon pluginId={pluginId} tokenId={null} />
          </SettingsTappableRow>
        )
      })}
    </SceneWrapper>
  )
}
