// @flow

import messaging from '@react-native-firebase/messaging'
import { Platform } from 'react-native'
import { getBuildNumber, getUniqueId, getUserAgent, getVersion } from 'react-native-device-info'

import ENV from '../../env.json'
import { notif1 } from '../modules/notifServer.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'

export const registerDevice = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { context } = state.core
  const { appId } = context

  try {
    if (!ENV.USE_FIREBASE) return

    const deviceId = getUniqueId()
    const deviceIdEncoded = encodeURIComponent(deviceId)
    const tokenId = await messaging()
      .getToken()
      .catch(() => console.log('Failed to fetch firebase device token.'))
    const deviceDescription = await getUserAgent()
    const osType = Platform.OS
    const edgeVersion = getVersion()
    const edgeBuildNumber = parseInt(getBuildNumber())

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

  // Ask for notification permissions:
  // (skipped, since this already exists natively in AppDelegate.m):
  // import messaging from '@react-native-firebase/messaging'
  // await messaging().requestPermission()

  const encodedUserId = encodeURIComponent(account.rootLoginId)
  const deviceId = getUniqueId()
  const deviceIdEncoded = encodeURIComponent(deviceId)
  try {
    await notif1.post(`user/device/attach?userId=${encodedUserId}&deviceId=${deviceIdEncoded}`)
  } catch (err) {
    console.log('Failed to attach user to device.')
  }
}
