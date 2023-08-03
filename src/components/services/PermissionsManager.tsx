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

let showModalPromise: Promise<ContactsPermissionResult | undefined>
/**
 * Show the contacts permission modal if we enabled the Edge Contacts Access
 * setting, but the corresponding system permission is not granted. Only shows
 * modal once for simultaneous callers.
 *
 * Responding 'Deny' to the modal will disable the Edge Contacts Access setting.
 *
 * @param contactsAccessSettingOn - Edge Local Contact Access setting
 * @returns Result of Contacts Access modal or undefined if no modal shown or
 * the modal was dismissed somehow.
 */
export async function showContactsPermissionModal(contactsAccessSettingOn: boolean): Promise<ContactsPermissionResult | undefined> {
  // We requested to show the modal when the setting was off already or another
  // caller to this fn is already handling it. Ignore this call.
  if (!contactsAccessSettingOn || showModalPromise != null) return undefined

  showModalPromise = (async () => {
    if (contactsAccessSettingOn && (await check(permissionNames.contacts)) !== 'granted') {
      return await Airship.show<ContactsPermissionResult | undefined>(bridge => <ContactsPermissionModal bridge={bridge} />)
    }
  })()

  return await showModalPromise
}

/**
 * Checks permission and attempts to request permissions (only if checked
 * permission was 'denied')
 */
export async function checkAndRequestPermission(data: Permission): Promise<PermissionStatus> {
  const status: PermissionStatus = await check(permissionNames[data])

  if (status === 'denied') return await request(permissionNames[data])
  else return status
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
    const result = await checkAndRequestPermission(data)
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
