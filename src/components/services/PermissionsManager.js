// @flow

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Disklet } from 'disklet'
import * as React from 'react'
import { Platform } from 'react-native'
import { check, checkMultiple, PERMISSIONS, request, RESULTS } from 'react-native-permissions'

import { SETTINGS_PERMISSION_LIMITS, SETTINGS_PERMISSION_QUANTITY } from '../../constants/constantSettings.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useIsAppForeground } from '../../hooks/useIsAppForeground.js'
import { type Permission, type PermissionsState, type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type Dispatch, type GetState } from '../../types/reduxTypes.js'
import { type ContactsPermissionResult, ContactsPermissionModal } from '../modals/ContactsPermissionModal.js'
import { PermissionsSettingModal } from '../modals/PermissionsSettingModal.js'
import { Airship, showError } from './AirshipInstance.js'

const IS_CONTACTS_PERMISSION_SHOWN_BEFORE = 'IS_CONTACTS_PERMISSION_SHOWN_BEFORE'

const PLATFORM = {
  ios: 'IOS',
  android: 'ANDROID'
}

const OS = PLATFORM[Platform.OS]

const LOCATION = {
  IOS: 'LOCATION_WHEN_IN_USE',
  ANDROID: 'ACCESS_FINE_LOCATION'
}

const CONTACTS = {
  IOS: 'CONTACTS',
  ANDROID: 'READ_CONTACTS'
}

const PERMISSIONS_ITEM = {
  camera: 'CAMERA',
  contacts: CONTACTS[OS],
  location: LOCATION[OS]
}

export const PermissionsManager = () => {
  const dispatch = useDispatch()
  const statePermissions = useSelector(state => state.permissions)
  const isAppForeground = useIsAppForeground()

  useAsyncEffect(async () => {
    if (!isAppForeground) return
    await dispatch(setNewPermissions(statePermissions))
  }, [isAppForeground, statePermissions])

  return null
}

export async function requestPermission(data: Permission): Promise<PermissionStatus> {
  const status: PermissionStatus = await check(PERMISSIONS[OS][PERMISSIONS_ITEM[data]])

  if (status === RESULTS.DENIED) {
    if (data === 'contacts') {
      const isContactsPermissionShownBefore: string = await AsyncStorage.getItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE).catch(showError)

      if (isContactsPermissionShownBefore === 'true') return

      const result: ContactsPermissionResult = await Airship.show(bridge => <ContactsPermissionModal bridge={bridge} />)
      AsyncStorage.setItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE, 'true').catch(showError)

      if (result === 'deny') return status
    }
    return request(PERMISSIONS[OS][PERMISSIONS_ITEM[data]])
  }
  return status
}

export const checkIfDenied = (status: PermissionStatus) => status === RESULTS.BLOCKED || status === RESULTS.DENIED || status === RESULTS.UNAVAILABLE

// Returns true if denied, false if accepted
export async function requestPermissionOnSettings(disklet: Disklet, data: Permission, name: string, mandatory: boolean): Promise<boolean> {
  const permissionLimits = await disklet
    .getText(SETTINGS_PERMISSION_LIMITS)
    .then(text => JSON.parse(text))
    .catch(() => ({})) // Ignore and don't throw error when file not found
  const permissionLimit = permissionLimits[data] ?? 0

  // Check to ignore the permission checks if not mandatory and already past the limit
  if (!mandatory && permissionLimit >= SETTINGS_PERMISSION_QUANTITY) return false

  const fullPermision: string = PERMISSIONS[OS][PERMISSIONS_ITEM[data]]
  const status: PermissionStatus = await check(fullPermision)

  // If permission is unavailable. ie: if there is no camera for the device
  if (mandatory && status === RESULTS.UNAVAILABLE) return true

  // User first time check. If mandatory, it needs to be checked if denied or accepted
  if (status === RESULTS.DENIED) {
    const result = await requestPermission(data)
    return mandatory && checkIfDenied(result)
  }

  // User not accepting the permission prior
  if (status === RESULTS.BLOCKED) {
    const isDenied = await Airship.show(bridge => (
      <PermissionsSettingModal bridge={bridge} mandatory={mandatory} fullPermision={fullPermision} permission={data.toLowerCase()} name={name} />
    ))

    if (isDenied) return true

    disklet
      .setText(
        SETTINGS_PERMISSION_LIMITS,
        JSON.stringify({
          ...permissionLimits,
          [data]: permissionLimit + 1
        })
      )
      .catch(showError)

    return false
  }

  return false
}

export const setNewPermissions = (currentPermissions: PermissionsState) => async (dispatch: Dispatch, getState: GetState) => {
  const names = Object.keys(currentPermissions)
  const permissionNames = names.map(name => PERMISSIONS[OS][PERMISSIONS_ITEM[name]])
  const devicePermissions = await checkMultiple(permissionNames)
  // Figure out which ones have changed to avoid a pointless dispatch:
  const newPermissions: PermissionsState = {}
  for (const name of names) {
    const devicePermissionName = PERMISSIONS[OS][PERMISSIONS_ITEM[name]]
    const devicePermission = devicePermissions[devicePermissionName]
    // Only add changed permissions
    if (devicePermission !== currentPermissions[name]) {
      newPermissions[name] = devicePermission
    }
  }

  if (Object.keys(newPermissions).length > 0) {
    console.log('Permissions updated')
    dispatch({ type: 'PERMISSIONS/UPDATE', data: newPermissions })
  } else {
    console.log('Permissions unchanged')
  }
}
