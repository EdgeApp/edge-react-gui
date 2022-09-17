import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { newPriceChangeEvent, serverSettingsToState, setDeviceSettings } from '../../actions/NotificationActions'
import { NewPushEvent } from '../../controllers/action-queue/types/pushTypes'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { RootState } from '../../reducers/RootReducer'
import { useCallback, useMemo } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow'

type OwnProps = {
  route: RouteProp<'currencyNotificationSettings'>
}

type Props = OwnProps

export const CurrencyNotificationScene = (props: Props) => {
  const { route } = props
  const { currencyInfo } = route.params
  const { pluginId } = currencyInfo
  const dispatch = useDispatch()

  const defaultIsoFiat = useSelector((state: RootState) => state.ui.settings.defaultIsoFiat)
  const deviceId = useSelector((state: RootState) => state.core.context.clientId)
  const settings = useSelector((state: RootState) => state.priceChangeNotifications)

  const toggleHourlySetting = useHandler(async () => {
    const newEvent = newPriceChangeEvent(currencyInfo, defaultIsoFiat, !settings.plugins[pluginId].hourlyChange, !!settings.plugins[pluginId].dailyChange)
    await updateSettings(newEvent)
  })

  const toggleDailySetting = useHandler(async () => {
    const newEvent = newPriceChangeEvent(currencyInfo, defaultIsoFiat, !!settings.plugins[pluginId].hourlyChange, !settings.plugins[pluginId].dailyChange)
    await updateSettings(newEvent)
  })

  const updateSettings = useCallback(
    async (event: NewPushEvent) => {
      try {
        const newSettings = await setDeviceSettings(deviceId, { createEvents: [event] })
        dispatch({
          type: 'PRICE_CHANGE_NOTIFICATIONS_UPDATE',
          data: serverSettingsToState(newSettings)
        })
      } catch (e: any) {
        showError(`Failed to reach notification server: ${e}`)
      }
    },
    [deviceId, dispatch]
  )

  const rows = useMemo(
    () => [
      <SettingsSwitchRow
        key="hourly"
        label={sprintf(s.strings.settings_currency_notifications_percent_change_hour, 3)}
        value={settings.plugins[pluginId].hourlyChange != null}
        onPress={toggleHourlySetting}
      />,
      <SettingsSwitchRow
        key="daily"
        label={sprintf(s.strings.settings_currency_notifications_percent_change_hours, 10, 24)}
        value={settings.plugins[pluginId].dailyChange != null}
        onPress={toggleDailySetting}
      />
    ],
    [pluginId, settings, toggleDailySetting, toggleHourlySetting]
  )

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>{rows}</ScrollView>
    </SceneWrapper>
  )
}
