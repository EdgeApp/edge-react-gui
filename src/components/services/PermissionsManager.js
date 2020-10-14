// @flow

import * as React from 'react'
import { AppState } from 'react-native'
import RNPermissions from 'react-native-permissions'
import { connect } from 'react-redux'

import { type Permission, type PermissionsState, type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { showError } from './AirshipInstance.js'

type StateProps = {
  permissions: PermissionsState
}

type DispatchProps = {
  updatePermissions(permissions: PermissionsState): void
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
    const { permissions } = this.props
    const names = Object.keys(permissions)
    const response: PermissionsState = await RNPermissions.checkMultiple(names)

    // Figure out which ones have changed to avoid a pointless dispatch:
    const newPermissions: PermissionsState = {}
    for (const name of names) {
      if (response[name] !== permissions[name]) {
        newPermissions[name] = response[name]
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

export async function requestPermission(permission: Permission): Promise<PermissionStatus> {
  const status: PermissionStatus = await RNPermissions.check(permission)
  if (status === 'undetermined') {
    return RNPermissions.request(permission)
  }
  return status
}

export const PermissionsManager = connect(
  (state: RootState): StateProps => ({
    permissions: state.permissions
  }),
  (dispatch: Dispatch): DispatchProps => ({
    updatePermissions(permissions: PermissionsState) {
      dispatch({ type: 'PERMISSIONS/UPDATE', data: permissions })
    }
  })
)(PermissionsManagerComponent)
