import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { newPriceChangeEvent, serverSettingsToNotificationSettings, setDeviceSettings } from '../../actions/NotificationActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { RootState } from '../../reducers/RootReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'

interface Props extends EdgeSceneProps<'currencyNotificationSettings'> {}

export const CurrencyNotificationScene = (props: Props) => {
  const { route } = props
  const { currencyInfo } = route.params
  const { pluginId } = currencyInfo
  const dispatch = useDispatch()

  const defaultIsoFiat = useSelector((state: RootState) => state.ui.settings.defaultIsoFiat)
  const settings = useSelector((state: RootState) => state.notificationSettings)

  const updateSettings = (settingChange: 'hourly' | 'daily') => async () => {
    const hourly = settingChange === 'hourly' ? !settings.plugins[pluginId].hourlyChange : !!settings.plugins[pluginId].hourlyChange
    const daily = settingChange === 'daily' ? !settings.plugins[pluginId].dailyChange : !!settings.plugins[pluginId].dailyChange
    const event = newPriceChangeEvent(currencyInfo, defaultIsoFiat, hourly, daily)
    try {
      const newSettings = await dispatch(setDeviceSettings({ createEvents: [event] }))
      dispatch({
        type: 'NOTIFICATION_SETTINGS_UPDATE',
        data: serverSettingsToNotificationSettings(newSettings)
      })
    } catch (e: any) {
      showError(`Failed to reach notification server: ${e}`)
    }
  }

  const handleHourlyPress = useHandler(updateSettings('hourly'))
  const handleDailyPress = useHandler(updateSettings('daily'))

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>
        <SettingsSwitchRow
          key="hourly"
          label={sprintf(lstrings.settings_currency_notifications_percent_change_hour, 3)}
          value={settings.plugins[pluginId].hourlyChange != null}
          onPress={handleHourlyPress}
        />
        <SettingsSwitchRow
          key="daily"
          label={sprintf(lstrings.settings_currency_notifications_percent_change_hours, 10, 24)}
          value={settings.plugins[pluginId].dailyChange != null}
          onPress={handleDailyPress}
        />
      </ScrollView>
    </SceneWrapper>
  )
}
