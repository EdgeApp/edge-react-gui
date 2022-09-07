// @flow

import { type EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import { serverSettingsToState, setDeviceSettings } from '../../actions/NotificationActions.js'
import { CryptoIcon } from '../../components/icons/CryptoIcon.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatch } from '../../hooks/useWatch.js'
import s from '../../locales/strings'
import { getActiveWalletCurrencyInfos } from '../../selectors/WalletSelectors.js'
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
  const deviceId = useSelector(state => state.core.context.clientId)
  const account = useSelector(state => state.core.account)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const currencyInfos = getActiveWalletCurrencyInfos(currencyWallets)

  const toggleNotifications = useHandler(async () => {
    try {
      const newSettings = await setDeviceSettings(deviceId, { ignorePriceChanges: !settings.ignorePriceChanges })
      dispatch({
        type: 'PRICE_CHANGE_NOTIFICATIONS_UPDATE',
        data: serverSettingsToState(newSettings)
      })
    } catch (e) {
      showError(e)
    }
  })

  const rows = useMemo(
    () => [
      <SettingsSwitchRow key="all" label={s.strings.settings_notifications_switch} value={!settings.ignorePriceChanges} onPress={toggleNotifications} />,
      ...currencyInfos.map((currencyInfo: EdgeCurrencyInfo) => {
        const { displayName, pluginId } = currencyInfo
        const onPress = () =>
          !settings.ignorePriceChanges
            ? navigation.navigate('currencyNotificationSettings', {
                currencyInfo
              })
            : undefined

        return (
          <SettingsTappableRow disabled={settings.ignorePriceChanges} key={pluginId} label={displayName} onPress={onPress}>
            <CryptoIcon pluginId={pluginId} />
          </SettingsTappableRow>
        )
      })
    ],
    [currencyInfos, navigation, settings, toggleNotifications]
  )

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>{rows}</ScrollView>
    </SceneWrapper>
  )
}
