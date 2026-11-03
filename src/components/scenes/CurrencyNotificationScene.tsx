import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import {
  newPriceChangeEvent,
  updateNotificationSettings
} from '../../actions/NotificationActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { RootState } from '../../reducers/RootReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'

export interface CurrencyNotificationParams {
  currencyInfo: EdgeCurrencyInfo
}

interface Props extends EdgeAppSceneProps<'currencyNotificationSettings'> {}

export const CurrencyNotificationScene: React.FC<Props> = props => {
  const { route } = props
  const { currencyInfo } = route.params
  const { pluginId } = currencyInfo
  const dispatch = useDispatch()

  const defaultIsoFiat = useSelector(
    (state: RootState) => state.ui.settings.defaultIsoFiat
  )
  const settings = useSelector((state: RootState) => state.notificationSettings)

  const updateSettings = (settingChange: 'hourly' | 'daily') => async () => {
    const { hourlyChange, dailyChange } = settings.plugins[pluginId]
    const hourly =
      settingChange === 'hourly'
        ? hourlyChange == null || hourlyChange === 0
        : hourlyChange != null && hourlyChange !== 0
    const daily =
      settingChange === 'daily'
        ? dailyChange == null || dailyChange === 0
        : dailyChange != null && dailyChange !== 0
    const event = newPriceChangeEvent(
      currencyInfo,
      defaultIsoFiat,
      hourly,
      daily
    )
    try {
      await dispatch(updateNotificationSettings({ createEvents: [event] }))
    } catch (e: any) {
      showError(`Failed to reach notification server: ${e}`)
    }
  }

  const handleHourlyPress = useHandler(updateSettings('hourly'))
  const handleDailyPress = useHandler(updateSettings('daily'))

  return (
    <SceneWrapper scroll>
      <SettingsSwitchRow
        key="hourly"
        label={sprintf(
          lstrings.settings_currency_notifications_percent_change_hour,
          3
        )}
        value={settings.plugins[pluginId].hourlyChange != null}
        onPress={handleHourlyPress}
      />
      <SettingsSwitchRow
        key="daily"
        label={sprintf(
          lstrings.settings_currency_notifications_percent_change_hours,
          10,
          24
        )}
        value={settings.plugins[pluginId].dailyChange != null}
        onPress={handleDailyPress}
      />
    </SceneWrapper>
  )
}
