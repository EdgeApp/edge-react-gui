// @flow

import { getUniqueId } from 'react-native-device-info'

import { notif1 } from '../modules/notifServer.js'
import { getActiveWalletCurrencyCodes } from '../selectors/WalletSelectors.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

export const fetchSettings = async (userId: string, currencyCode: string) => {
  const deviceId = getUniqueId()
  const deviceIdEncoded = encodeURIComponent(deviceId)
  const encodedUserId = encodeURIComponent(userId)
  return notif1.get(`user/notifications/${currencyCode}?userId=${encodedUserId}&deviceId=${deviceIdEncoded}`)
}

export const registerNotifications = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const encodedUserId = encodeURIComponent(account.rootLoginId)
  const currencyCodes = getActiveWalletCurrencyCodes(state)
  try {
    await notif1.post(`user/notifications?userId=${encodedUserId}`, { currencyCodes })
  } catch (err) {
    console.log('Failed to register user for notifications.')
  }
}

export const enableNotifications = (currencyCode: string, hours: string, enabled: boolean) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const encodedUserId = encodeURIComponent(account.rootLoginId)
  const deviceId = getUniqueId()
  const deviceIdEncoded = encodeURIComponent(deviceId)
  try {
    await notif1.put(`user/notifications/${currencyCode}?userId=${encodedUserId}&deviceId=${deviceIdEncoded}`, { hours, enabled })
  } catch (err) {
    console.log('Failed to enable notifications for user.')
  }
}
