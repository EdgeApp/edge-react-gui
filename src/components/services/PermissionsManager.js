// @flow

import AsyncStorage from '@react-native-community/async-storage'
import * as React from 'react'
import { AppState, Platform } from 'react-native'
import { check, checkMultiple, PERMISSIONS, request, RESULTS } from 'react-native-permissions'

import { type Permission, type PermissionsState, type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import { connect } from '../../types/reactRedux.js'
import { type ContactsPermissionResult, ContactsPermissionModal } from '../modals/ContactsPermissionModal.js'
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

type StateProps = {
  permissions: PermissionsState
}

type DispatchProps = {
  updatePermissions: (permissions: PermissionsState) => void
}

type Props = StateProps & DispatchProps

class PermissionsManagerComponent extends React.Component<Props> {
  render() {
    return null
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.checkPermissions().catch(showError)
  }

  handleAppStateChange = (nextAppState: string) => {
    console.log('State Change => ', nextAppState)

    if (nextAppState === 'active') {
      this.checkPermissions().catch(showError)
    }
  }

  async checkPermissions() {
    const statePermissions = this.props.permissions
    const names = Object.keys(statePermissions)
    const permissions = names.map(name => PERMISSIONS[OS][PERMISSIONS_ITEM[name]])
    const response: PermissionsState = await checkMultiple(permissions)

    // Figure out which ones have changed to avoid a pointless dispatch:
    const newPermissions: PermissionsState = {}
    for (const name of names) {
      const responsePermission = PERMISSIONS[OS][PERMISSIONS_ITEM[name]]
      if (response[responsePermission] !== statePermissions[name]) {
        newPermissions[name] = response[responsePermission]
      }
    }

    if (Object.keys(newPermissions).length > 0) {
      console.log('Permissions updated')
      this.props.updatePermissions(newPermissions)
    } else {
      console.log('Permissions unchanged')
    }
  }
}

export async function requestPermission(data: Permission): Promise<PermissionStatus> {
  const status: PermissionStatus = await check(PERMISSIONS[OS][PERMISSIONS_ITEM[data]])

  if (status === RESULTS.DENIED) {
    if (data === 'contacts') {
      const isContactsPermissionShownBefore: string = await AsyncStorage.getItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE).catch(showError)

      if (isContactsPermissionShownBefore === 'true') return

      const result: ContactsPermissionResult = await Airship.show(bridge => <ContactsPermissionModal bridge={bridge} />)
      AsyncStorage.setItem(IS_CONTACTS_PERMISSION_SHOWN_BEFORE, 'true').catch(showError)

      if (result === 'deny') return
    }
    return request(PERMISSIONS[OS][PERMISSIONS_ITEM[data]])
  }
  return status
}

export const PermissionsManager = connect<StateProps, DispatchProps, {}>(
  state => ({
    permissions: state.permissions
  }),
  dispatch => ({
    updatePermissions(permissions: PermissionsState) {
      dispatch({ type: 'PERMISSIONS/UPDATE', data: permissions })
    }
  })
)(PermissionsManagerComponent)
