import messaging from '@react-native-firebase/messaging'
import { asMaybe } from 'cleaners'
import { EdgeCurrencyInfo } from 'edge-core-js'
import { getUniqueId } from 'react-native-device-info'
import { sprintf } from 'sprintf-js'

import ENV from '../../env.json'
import { asDevicePayload, DeviceUpdatePayload } from '../controllers/action-queue/types/pushApiTypes'
import { asPriceChangeTrigger } from '../controllers/action-queue/types/pushCleaners'
import { NewPushEvent, PushEventStatus } from '../controllers/action-queue/types/pushTypes'
import s from '../locales/strings'
import { notif1 } from '../modules/notifServer'
import { getActiveWalletCurrencyInfos } from '../selectors/WalletSelectors'
import { Dispatch, GetState } from '../types/reduxTypes'
import { fetchPush } from '../util/network'
import { getDenomFromIsoCode } from '../util/utils'

export const fetchSettings = async (userId: string, currencyCode: string) => {
  const deviceId = getUniqueId()
  const deviceIdEncoded = encodeURIComponent(deviceId)
  const encodedUserId = encodeURIComponent(userId)
  return await notif1.get(`user/notifications/${currencyCode}?userId=${encodedUserId}&deviceId=${deviceIdEncoded}`)
}

export type PriceChangeNotificationSettings = {
  ignorePriceChanges: boolean
  [pluginId: string]: {
    eventId: string
    currencyPair: string
    dailyChange?: number
    hourlyChange?: number
  }
}

export const registerNotificationsV2 = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const deviceId = state.core.context.clientId
  const { defaultIsoFiat } = state.ui.settings
  let v2Settings = {
    loginIds: [],
    events: [],
    ignorePriceChanges: false
  }
  try {
    v2Settings = await getDeviceSettings(deviceId)

    const currencyWallets = state.core.account.currencyWallets
    const activeCurrencyInfos = getActiveWalletCurrencyInfos(currencyWallets)
    const currencyCodes = activeCurrencyInfos.map(info => info.currencyCode)

    const createEvents: NewPushEvent[] = []

    if (v2Settings.events.length !== 0) {
      // v2 settings exist already, see if we need to add new ones
      const missingInfos: { [pluginId: string]: EdgeCurrencyInfo } = {}
      for (const [i, code] of currencyCodes.entries()) {
        const currencyPair = `${code}_${defaultIsoFiat}`
        if (
          v2Settings.events.find(event => {
            const trigger = asMaybe(asPriceChangeTrigger)(event.trigger)
            if (trigger == null) return false
            if (trigger?.currencyPair !== currencyPair) return false
            return true
          }) == null
        ) {
          if (missingInfos[activeCurrencyInfos[i].pluginId] == null) missingInfos[activeCurrencyInfos[i].pluginId] = activeCurrencyInfos[i]
        }
      }
      Object.keys(missingInfos).forEach(pluginId => createEvents.push(newPriceChangeEvent(missingInfos[pluginId], defaultIsoFiat, true, true)))
    } else {
      // No v2 settings exist so let's check v1
      const userId = state.core.account.rootLoginId
      const encodedUserId = encodeURIComponent(userId)

      let v1Settings = {
        notifications: {
          currencyCodes: {}
        }
      }

      try {
        v1Settings = await notif1.get(`/user?userId=${encodedUserId}`)
      } catch (e) {
        // Failure is ok we'll just create new settings
      }

      if (Object.keys(v1Settings.notifications.currencyCodes).length === 0) {
        // v1 settings don't exist either so let's create them
        for (const currencyInfo of activeCurrencyInfos) {
          createEvents.push(newPriceChangeEvent(currencyInfo, defaultIsoFiat, true, true))
        }
      } else {
        // v1 settings do exist let's migrate them to v2
        const currencySettings: Array<{ '1': boolean; '24': boolean; fallbackSettings?: boolean }> = await Promise.all(
          activeCurrencyInfos.map(async info => await fetchSettings(userId, info.currencyCode))
        )

        for (const [i, setting] of currencySettings.entries()) {
          if (setting.fallbackSettings) {
            // Settings didn't exist for that currency code so we'll create them using default options
            createEvents.push(newPriceChangeEvent(activeCurrencyInfos[i], defaultIsoFiat, true, true))
          } else {
            // Settings did exist for that currency code so we'll use them
            createEvents.push(newPriceChangeEvent(activeCurrencyInfos[i], defaultIsoFiat, setting[1], setting[24]))
          }
        }
      }
    }

    if (createEvents.length > 0) {
      v2Settings = await setDeviceSettings(deviceId, { createEvents })
    }
  } catch (e) {
    // If this fails we don't need to bother the user just log and move on.
    console.log('registerNotificationsV2 error:', e.message)
  }

  dispatch({
    type: 'PRICE_CHANGE_NOTIFICATIONS_UPDATE',
    data: serverSettingsToState(v2Settings)
  })
}

export const serverSettingsToState = (settings: ReturnType<typeof asDevicePayload>): PriceChangeNotificationSettings => {
  const data: PriceChangeNotificationSettings = { ignorePriceChanges: settings.ignorePriceChanges }

  for (const event: PushEventStatus of settings.events) {
    if (event.state !== 'waiting') continue
    const trigger = asMaybe(asPriceChangeTrigger)(event.trigger)
    if (trigger == null) continue

    data[trigger.pluginId] = {
      eventId: event.eventId,
      currencyPair: trigger.currencyPair,
      dailyChange: trigger.dailyChange,
      hourlyChange: trigger.hourlyChange
    }
  }

  return data
}

export const getDeviceSettings = async (deviceId: string): Promise<ReturnType<typeof asDevicePayload>> => {
  const body = {
    apiKey: ENV.AIRBITZ_API_KEY,
    deviceId
  }
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  const response = await fetchPush('v2/device/', opts)

  return asDevicePayload(await response.json())
}

export const setDeviceSettings = async (deviceId: string, data: DeviceUpdatePayload): Promise<ReturnType<typeof asDevicePayload>> => {
  const deviceToken = await messaging()
    .getToken()
    .catch(e => console.log('Failed to fetch firebase device token.', e.message))

  const body = {
    apiKey: ENV.AIRBITZ_API_KEY,
    deviceId,
    deviceToken,
    data
  }
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }

  const response = await fetchPush('v2/device/update/', opts)

  return asDevicePayload(await response.json())
}

export const newPriceChangeEvent = (
  currencyInfo: EdgeCurrencyInfo,
  isoFiatCurrencyCode: string,
  hourlyChangeEnabled: boolean,
  dailyChangeEnabled: boolean
): NewPushEvent => {
  const { currencyCode, displayName } = currencyInfo

  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode.replace('iso:', ''))
  const fiatSymbol = fiatDenomination.symbol ?? ''

  const fiatSymbolString = `${fiatSymbol}#to_price#`
  const changeUpString = '+#change#%%'
  const changeDownString = '-#change#%%'

  const pushMessage = {
    title: s.strings.price_alert,
    body: '#direction#'
  }

  const event = {
    eventId: currencyInfo.currencyCode,
    pushMessage,
    trigger: {
      type: 'price-change',
      currencyPair: `${currencyInfo.currencyCode}_${isoFiatCurrencyCode}`,

      directions: [
        // [hourUp, hourDown, dayUp, dayDown]
        `${sprintf(s.strings.notification_hourly_price_change_up, String.fromCodePoint(0x1f4c8), displayName, currencyCode, changeUpString, fiatSymbolString)}`,
        `${sprintf(
          s.strings.notification_hourly_price_change_down,
          String.fromCodePoint(0x1f4c9),
          displayName,
          currencyCode,
          changeDownString,
          fiatSymbolString
        )}`,
        `${sprintf(s.strings.notification_daily_price_change_up, String.fromCodePoint(0x1f4c8), displayName, currencyCode, changeUpString, fiatSymbolString)}`,
        `${sprintf(
          s.strings.notification_daily_price_change_down,
          String.fromCodePoint(0x1f4c9),
          displayName,
          currencyCode,
          changeDownString,
          fiatSymbolString
        )}`
      ],
      pluginId: currencyInfo.pluginId,
      dailyChange: dailyChangeEnabled ? 10 : undefined,
      hourlyChange: hourlyChangeEnabled ? 3 : undefined
    }
  }

  return event
}
