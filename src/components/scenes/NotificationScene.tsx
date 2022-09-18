import * as React from 'react'
import { ScrollView } from 'react-native'

import { serverSettingsToState, setDeviceSettings } from '../../actions/NotificationActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useMemo } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow'
import { SettingsTappableRow } from '../themed/SettingsTappableRow'

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
    } catch (e: any) {
      showError(`Failed to reach notification server: ${e}`)
    }
  })

  const rows = useMemo(
    () => [
      <SettingsSwitchRow key="all" label={s.strings.settings_notifications_switch} value={!settings.ignorePriceChanges} onPress={toggleNotifications} />,
      ...Object.keys(currencyConfigs)
        .filter(pluginId => settings.plugins[pluginId] != null)
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
