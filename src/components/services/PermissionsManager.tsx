import AsyncStorage from '@react-native-async-storage/async-storage'
import { Disklet } from 'disklet'
import * as React from 'react'
import { Platform } from 'react-native'
import { check, checkMultiple, PERMISSIONS, request, RESULTS } from 'react-native-permissions'

import { SETTINGS_PERMISSION_LIMITS, SETTINGS_PERMISSION_QUANTITY } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { Permission, PermissionsState, PermissionStatus } from '../../reducers/PermissionsReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Dispatch, GetState } from '../../types/reduxTypes'
import { ContactsPermissionModal, ContactsPermissionResult } from '../modals/ContactsPermissionModal'
import { PermissionsSettingModal } from '../modals/PermissionsSettingModal'
import { Airship, showError } from './AirshipInstance'

const IS_CONTACTS_PERMISSION_SHOWN_BEFORE = 'IS_CONTACTS_PERMISSION_SHOWN_BEFORE'

const PLATFORM = {
  ios: 'IOS',
  android: 'ANDROID'
}

// @ts-expect-error
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
  // @ts-expect-error
  contacts: CONTACTS[OS],
  // @ts-expect-error
  location: LOCATION[OS]
}

export const PermissionsManager = () => {
  const dispatch = useDispatch()
  const statePermissions = useSelector(state => state.permissions)
  const isAppForeground = useIsAppForeground()

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (!isAppForeground) return
    await dispatch(setNewPermissions(statePermissions))
  }, [isAppForeground, statePermissions])

  return null
}

export async function requestPermission(data: Permission): Promise<PermissionStatus> {
  // @ts-expect-error
  const status: PermissionStatus = await check(PERMISSIONS[OS][PERMISSIONS_ITEM[data]])

  if (status === RESULTS.DENIED) {
    if (data === 'contacts') {
      // @ts-expect-error
      const isContactsPermissionShownBefore: string = await AsyncStorage.getItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE).catch(showError)

      // @ts-expect-error
      if (isContactsPermissionShownBefore === 'true') return

      const result = await Airship.show<ContactsPermissionResult | undefined>(bridge => <ContactsPermissionModal bridge={bridge} />)
      AsyncStorage.setItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE, 'true').catch(showError)

      if (result === 'deny') return status
    }
    // @ts-expect-error
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

  // @ts-expect-error
  const fullPermision: string = PERMISSIONS[OS][PERMISSIONS_ITEM[data]]
  // @ts-expect-error
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
    const isDenied = await Airship.show<boolean>(bridge => (
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
  // @ts-expect-error
  const permissionNames = names.map(name => PERMISSIONS[OS][PERMISSIONS_ITEM[name]])
  const devicePermissions = await checkMultiple(permissionNames)
  // Figure out which ones have changed to avoid a pointless dispatch:
  const newPermissions: PermissionsState = {}
  for (const name of names) {
    // @ts-expect-error
    const devicePermissionName = PERMISSIONS[OS][PERMISSIONS_ITEM[name]]
    const devicePermission = devicePermissions[devicePermissionName]
    // Only add changed permissions
    // @ts-expect-error
    if (devicePermission !== currentPermissions[name]) {
      // @ts-expect-error
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
