import * as React from 'react'
import { ScrollView } from 'react-native'

import { NotificationSettings, serverSettingsToNotificationSettings, setDeviceSettings } from '../../actions/NotificationActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
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
      const newSettings = await dispatch(setDeviceSettings({ [toggleSetting]: !settings[toggleSetting] }))
      dispatch({
        type: 'NOTIFICATION_SETTINGS_UPDATE',
        data: serverSettingsToNotificationSettings(newSettings)
      })
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
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>
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

          const onPress = () =>
            !settings.ignorePriceChanges
              ? navigation.navigate('currencyNotificationSettings', {
                  currencyInfo
                })
              : undefined

          return (
            <SettingsTappableRow disabled={settings.ignorePriceChanges} key={pluginId} label={currencyInfo.displayName} onPress={onPress}>
              <CryptoIcon pluginId={pluginId} />
            </SettingsTappableRow>
          )
        })}
      </ScrollView>
    </SceneWrapper>
  )
}
