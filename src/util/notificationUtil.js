// @flow

import { AsyncStorage, Platform } from 'react-native'

import { version } from '../../package.json'
import { LOCAL_STORAGE_PREVIOUS_NOTIFICATIONS } from '../constants/indexConstants'

export async function checkForNotifications () {
  try {
    const url = 'https://info1.edgesecure.co:8444/v1/notifications'
    const notifications = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    const validNotifications = []
    const pn = await AsyncStorage.getItem(LOCAL_STORAGE_PREVIOUS_NOTIFICATIONS)
    const previousNotifications = pn ? JSON.parse(pn) : {}
    for (let i = 0; i < notifications.length; i++) {
      const notif = notifications[i]
      const versionCompareMin = compareVersion(version, notif.minVersion)
      const versionCompareMax = compareVersion(version, notif.maxVersion)
      if (Number(versionCompareMin) >= 0 && Number(versionCompareMax) <= 0) {
        // check to see if we have seen it before and it is not an upgrade. All upgrades get seen.
        if (!previousNotifications[notif.subject] || notif.isUpgrade) {
          // final filter, is this for this os?
          if (Platform.OS === 'ios') {
            if (notif.ios) {
              validNotifications.push(notif)
            }
          } else {
            if (notif.android) {
              validNotifications.push(notif)
            }
          }
        }
      }
    }
    // if we have any valid notifications send back the first one
    if (validNotifications.length > 0) {
      const key = validNotifications[0].subject
      previousNotifications[key] = 'sent'
      // record the subject of what we sent so we don't send again.
      await AsyncStorage.setItem(LOCAL_STORAGE_PREVIOUS_NOTIFICATIONS, JSON.stringify(previousNotifications))
      return validNotifications[0]
    }
    return null
  } catch (error) {
    return null
  }
}

const compareVersion = (v1: string, v2: string) => {
  const v1Array = v1.split('.')
  const v2Array = v2.split('.')
  const k = Math.min(v1Array.length, v2Array.length)
  for (let i = 0; i < k; ++i) {
    v1Array[i] = parseInt(v1Array[i], 10).toString()
    v2Array[i] = parseInt(v2Array[i], 10).toString()
    if (v1Array[i] > v2Array[i]) return 1
    if (v1Array[i] < v2Array[i]) return -1
  }
  return v1Array.length === v2Array.length ? 0 : v1Array.length < v2Array.length ? -1 : 1
}
