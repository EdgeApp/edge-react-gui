// @flow

import React from 'react'
import { AppState } from 'react-native'
import RNPermissions from 'react-native-permissions'
import { connect } from 'react-redux'

import { type Permission, type PermissionsState, type PermissionStatus } from '../../reducers/PermissionsReducer.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'
import { showError } from './AirshipInstance.js'

const PERMISSION_LIST: Permission[] = ['camera', 'contacts']

type PermissionsManagerStateProps = {
  camera: string,
  contacts: string
}

type PermissionsManagerDispatchProps = {
  updatePermissions(permissions: PermissionsState): void
}

type Props = PermissionsManagerStateProps & PermissionsManagerDispatchProps

class PermissionsManagerComponent extends React.Component<Props> {
  render () {
    return null
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.checkPermissions()
  }

  handleAppStateChange = (nextAppState: string) => {
    console.log('State Change => ', nextAppState)

    if (nextAppState === 'active') {
      this.checkPermissions()
    }
  }

  checkPermissions = () => {
    RNPermissions.checkMultiple(PERMISSION_LIST)
      .then(response => {
        // response is an object mapping type to permission
        const permissions = {}

        if (this.props.camera !== response.camera) {
          permissions.camera = response.camera
        }

        if (this.props.contacts !== response.contacts) {
          permissions.contacts = response.contacts
        }

        if (Object.keys(permissions).length > 0) {
          console.log('Permissions updated')
          this.props.updatePermissions(permissions)
        } else {
          console.log('Permissions unchanged')
        }
      })
      .catch(showError)
  }
}

export const requestPermission = (permission: Permission): Promise<PermissionStatus> => {
  return RNPermissions.check(permission).then((status: PermissionStatus) => {
    if (status === 'undetermined') {
      return RNPermissions.request(permission)
    }

    return status
  })
}

const mapStateToProps = (state: State): PermissionsManagerStateProps => ({
  camera: state.permissions.camera,
  contacts: state.permissions.contacts
})

const mapDispatchToProps = (dispatch: Dispatch): PermissionsManagerDispatchProps => ({
  updatePermissions (permissions: PermissionsState) {
    dispatch({ type: 'PERMISSIONS/UPDATE', data: permissions })
  }
})

export const PermissionsManager = connect(
  mapStateToProps,
  mapDispatchToProps
)(PermissionsManagerComponent)
