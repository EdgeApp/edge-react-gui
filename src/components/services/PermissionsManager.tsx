import AsyncStorage from '@react-native-async-storage/async-storage'
import { Disklet } from 'disklet'
import * as React from 'react'
import { check, checkMultiple, PermissionStatus, request } from 'react-native-permissions'

import { SETTINGS_PERMISSION_LIMITS, SETTINGS_PERMISSION_QUANTITY } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { Permission, permissionNames, PermissionsState } from '../../reducers/PermissionsReducer'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ThunkAction } from '../../types/reduxTypes'
import { ContactsPermissionModal, ContactsPermissionResult } from '../modals/ContactsPermissionModal'
import { PermissionsSettingModal } from '../modals/PermissionsSettingModal'
import { Airship, showError } from './AirshipInstance'

const IS_CONTACTS_PERMISSION_SHOWN_BEFORE = 'IS_CONTACTS_PERMISSION_SHOWN_BEFORE'

export const PermissionsManager = () => {
  const dispatch = useDispatch()
  const statePermissions = useSelector(state => state.permissions)
  const isAppForeground = useIsAppForeground()

  useAsyncEffect(
    async () => {
      if (!isAppForeground) return
      await dispatch(setNewPermissions(statePermissions))
    },
    [isAppForeground, statePermissions],
    'PermissionsManager'
  )

  return null
}

export async function edgeRequestPermission(data: Permission): Promise<PermissionStatus> {
  const status: PermissionStatus = await check(permissionNames[data])

  if (status === 'denied') {
    if (data === 'contacts') {
      const isContactsPermissionShownBefore = await AsyncStorage.getItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE).catch(showError)

      // @ts-expect-error: Undefined is not a valid return value
      if (isContactsPermissionShownBefore === 'true') return

      const result = await Airship.show<ContactsPermissionResult | undefined>(bridge => <ContactsPermissionModal bridge={bridge} />)
      AsyncStorage.setItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE, 'true').catch(showError)
      if (result === 'deny') return status
    }
    return await request(permissionNames[data])
  }
  return status
}

export const checkIfDenied = (status: PermissionStatus) => status === 'blocked' || status === 'denied' || status === 'unavailable'

// Returns true if denied, false if accepted
export async function requestPermissionOnSettings(disklet: Disklet, data: Permission, name: string, mandatory: boolean): Promise<boolean> {
  const permissionLimits = await disklet
    .getText(SETTINGS_PERMISSION_LIMITS)
    .then(text => JSON.parse(text))
    .catch(() => ({})) // Ignore and don't throw error when file not found
  const permissionLimit = permissionLimits[data] ?? 0

  // Check to ignore the permission checks if not mandatory and already past the limit
  if (!mandatory && permissionLimit >= SETTINGS_PERMISSION_QUANTITY) return false

  const status: PermissionStatus = await check(permissionNames[data])

  // If permission is unavailable. ie: if there is no camera for the device
  if (mandatory && status === 'unavailable') return true

  // User first time check. If mandatory, it needs to be checked if denied or accepted
  if (status === 'denied') {
    const result = await edgeRequestPermission(data)
    return mandatory && checkIfDenied(result)
  }

  // User not accepting the permission prior
  if (status === 'blocked') {
    const isDenied = await Airship.show<boolean>(bridge => <PermissionsSettingModal bridge={bridge} mandatory={mandatory} permission={data} name={name} />)

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

export function setNewPermissions(currentPermissions: PermissionsState): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const names: Permission[] = Object.keys(permissionNames) as any[]
    const devicePermissions = await checkMultiple(names.map(name => permissionNames[name]))

    // Figure out which ones have changed to avoid a pointless dispatch:
    const newPermissions: Partial<PermissionsState> = {}
    for (const name of names) {
      const devicePermission = devicePermissions[permissionNames[name]]

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
}
