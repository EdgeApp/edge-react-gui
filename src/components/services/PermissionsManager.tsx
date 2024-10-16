import { Disklet } from 'disklet'
import * as React from 'react'
import { check, checkMultiple, openSettings, PermissionStatus, request } from 'react-native-permissions'
import { sprintf } from 'sprintf-js'

import { SETTINGS_PERMISSION_LIMITS, SETTINGS_PERMISSION_QUANTITY } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useIsAppForeground } from '../../hooks/useIsAppForeground'
import { lstrings } from '../../locales/strings'
import { Permission, permissionNames, PermissionsState } from '../../reducers/PermissionsReducer'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ThunkAction } from '../../types/reduxTypes'
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

/**
 * If toggled on, will request permissions if system-level contacts permissions
 * are not granted. If toggled off, will open system settings.
 */
export async function requestContactsPermission(contactsPermissionOn: boolean): Promise<boolean> {
  const currentContactsPermissionOn = (await check(permissionNames.contacts)) === 'granted'

  if (contactsPermissionOn && !currentContactsPermissionOn) {
    // Initial prompt to inform the reason of the permissions request.
    // Denying this prompt will cause permissionStatus to be 'blocked',
    // regardless of the prior permissions state.
    await request(permissionNames.contacts, {
      title: lstrings.contacts_permission_modal_title,
      message: sprintf(lstrings.contacts_permission_modal_body_1, config.appName),
      buttonPositive: lstrings.string_allow,
      buttonNegative: lstrings.string_deny
    })
      .then(async (permissionStatus: PermissionStatus) => {
        // Can't request permission from within the app if previously blocked
        if (permissionStatus === 'blocked') await openSettings()
      })
      // Handle any other potential failure in enabling the permission
      // progmatically from within Edge by redirecting to the system settings
      // instead. Any manual change in system settings causes an app restart.
      .catch(async _e => await openSettings())
  } else if (!contactsPermissionOn && currentContactsPermissionOn) {
    // Can't deny permission from within the app if previously allowed
    await openSettings()
  }

  // Return the current permission state
  return (await check(permissionNames.contacts)) === 'granted'
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
      .catch(error => showError(error))

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
