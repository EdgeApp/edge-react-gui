// @flow
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import firebase from 'react-native-firebase'

import ENV from '../../../env.json'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import { notif1 } from '../notifServer'

export const registerDevice = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { context } = state.core
  const { appId } = context

  try {
    if (!ENV.USE_FIREBASE) return

    const deviceId = DeviceInfo.getUniqueID()
    const deviceIdEncoded = encodeURIComponent(deviceId)
    const tokenId = await firebase
      .iid()
      .getToken()
      .catch(() => console.log('Failed to fetch firebase device token.'))
    const deviceDescription = DeviceInfo.getUserAgent()
    const osType = Platform.OS
    const edgeVersion = DeviceInfo.getVersion()
    const edgeBuildNumber = parseInt(DeviceInfo.getBuildNumber())

    await notif1.post(`device?deviceId=${deviceIdEncoded}`, {
      appId,
      tokenId,
      deviceDescription,
      osType,
      edgeVersion,
      edgeBuildNumber
    })
  } catch (err) {
    console.log('Failed to register device for notifications.')
  }
}

export const attachToUser = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core

  const encodedUserId = encodeURIComponent(account.id)
  const deviceId = DeviceInfo.getUniqueID()
  const deviceIdEncoded = encodeURIComponent(deviceId)
  try {
    await notif1.post(`user/device/attach?userId=${encodedUserId}&deviceId=${deviceIdEncoded}`)
  } catch (err) {
    console.log('Failed to attach user to device.')
  }
}
