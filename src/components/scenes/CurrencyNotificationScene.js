// @flow

import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { newPriceChangeEvent, serverSettingsToState, setDeviceSettings } from '../../actions/NotificationActions.js'
import { type NewPushEvent } from '../../controllers/action-queue/types/pushTypes.js'
import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { useCallback, useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'

type OwnProps = {
  navigation: NavigationProp<'currencyNotificationSettings'>,
  route: RouteProp<'currencyNotificationSettings'>
}

type Props = OwnProps

export const CurrencyNotificationScene = (props: Props) => {
  const { route } = props
  const { currencyInfo } = route.params
  const { pluginId } = currencyInfo
  const dispatch = useDispatch()

  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const settings = useSelector(state => state.priceChangeNotifications)

  const toggleHourlySetting = useHandler(async () => {
    const newEvent = newPriceChangeEvent(currencyInfo, defaultIsoFiat, !settings[pluginId].hourlyChange, !!settings[pluginId].dailyChange)
    await updateSettings(newEvent)
  })

  const toggleDailySetting = useHandler(async () => {
    const newEvent = newPriceChangeEvent(currencyInfo, defaultIsoFiat, !!settings[pluginId].hourlyChange, !settings[pluginId].dailyChange)
    await updateSettings(newEvent)
  })

  const updateSettings = useCallback(
    async (event: NewPushEvent) => {
      try {
        const newSettings = await dispatch(setDeviceSettings({ createEvents: [event] }))
        dispatch({
          type: 'PRICE_CHANGE_NOTIFICATIONS_UPDATE',
          data: serverSettingsToState(newSettings)
        })
      } catch (e) {
        showError(`Failed to reach notification server: ${e}`)
      }
    },
    [dispatch]
  )

  const rows = useMemo(
    () => [
      <SettingsSwitchRow
        key="hourly"
        label={sprintf(s.strings.settings_currency_notifications_percent_change_hour, 3)}
        value={settings[pluginId].hourlyChange != null}
        onPress={toggleHourlySetting}
      />,
      <SettingsSwitchRow
        key="daily"
        label={sprintf(s.strings.settings_currency_notifications_percent_change_hours, 10, 24)}
        value={settings[pluginId].dailyChange != null}
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
