// @flow

import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { enableNotifications, fetchSettings } from '../../actions/NotificationActions.js'
import s from '../../locales/strings.js'
import { useEffect, useMemo, useState } from '../../types/reactHooks.js'
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
  const { navigation, route } = props
  const { currencyCode } = route.params.currencyInfo

  const [hoursMap, setHoursMap] = useState<{ [hours: string]: boolean }>({})
  const dispatch = useDispatch()

  const userId = useSelector(state => state.core.account.rootLoginId)

  useEffect(() => {
    if (Object.keys(hoursMap).length > 0) return

    fetchSettings(userId, currencyCode)
      .then(settings => {
        if (settings != null) {
          setHoursMap(settings)
        }
      })
      .catch(err => {
        showError(err)
        navigation.goBack()
      })
  })

  const rows = useMemo(() => {
    const out = []
    for (const hours of Object.keys(hoursMap)) {
      const enabled: boolean = hoursMap[hours]
      const num = Number(hours)
      const percent = num === 1 ? 3 : 10
      const label =
        num === 1
          ? sprintf(s.strings.settings_currency_notifications_percent_change_hour, percent)
          : sprintf(s.strings.settings_currency_notifications_percent_change_hours, percent, hours)

      out.push(
        <SettingsSwitchRow
          key={hours}
          label={label}
          value={enabled}
          onPress={() => {
            setHoursMap({ ...hoursMap, [hours]: !enabled })
            dispatch(enableNotifications(currencyCode, hours, !enabled))
          }}
        />
      )
    }
    return out
  }, [currencyCode, dispatch, hoursMap])

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>{rows}</ScrollView>
    </SceneWrapper>
  )
}
