// @flow

import * as React from 'react'
import { ScrollView } from 'react-native'

import { serverSettingsToState, setDeviceSettings } from '../../actions/NotificationActions.js'
import { CryptoIcon } from '../../components/icons/CryptoIcon.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatch } from '../../hooks/useWatch.js'
import s from '../../locales/strings'
import { useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type OwnProps = {
  navigation: NavigationProp<'notificationSettings'>
}

type Props = OwnProps

export const NotificationScene = (props: Props) => {
  const { navigation } = props
  const dispatch = useDispatch()

  const settings = useSelector(state => state.priceChangeNotifications)
  const account = useSelector(state => state.core.account)

  const currencyConfigs = useWatch(account, 'currencyConfig')

  const toggleNotifications = useHandler(async () => {
    try {
      const newSettings = await dispatch(setDeviceSettings({ ignorePriceChanges: !settings.ignorePriceChanges }))
      dispatch({
        type: 'PRICE_CHANGE_NOTIFICATIONS_UPDATE',
        data: serverSettingsToState(newSettings)
      })
    } catch (e) {
      showError(`Failed to reach notification server: ${e}`)
    }
  })

  const rows = useMemo(
    () => [
      <SettingsSwitchRow key="all" label={s.strings.settings_notifications_switch} value={!settings.ignorePriceChanges} onPress={toggleNotifications} />,
      ...Object.keys(currencyConfigs)
        .filter(pluginId => settings[pluginId] != null)
        .sort((a, b) => a.localeCompare(b))
        .map(pluginId => {
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
        })
    ],
    [currencyConfigs, navigation, settings, toggleNotifications]
  )

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>{rows}</ScrollView>
    </SceneWrapper>
  )
}
