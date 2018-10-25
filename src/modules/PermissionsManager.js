// @flow

import React from 'react'
import { AppState } from 'react-native'
import RNPermissions from 'react-native-permissions'
import { connect } from 'react-redux'

import type { Dispatch, State } from './ReduxTypes.js'

export const AppStates = {
  ACTIVE: 'active',
  BACKGROUND: 'background',
  INACTIVE: 'inactive'
}
export const PermissionStrings = {
  CAMERA: 'camera',
  CONTACTS: 'contacts'
}

export const PermissionStatusStrings = {
  AUTHORIZED: 'authorized',
  DENIED: 'denied',
  RESTRICTED: 'restricted',
  UNDETERMINED: 'undetermined'
}

export type Permission = 'camera' | 'contacts'

export type PermissionStatus = 'authorized' | 'denied' | 'restricted' | 'undetermined'

type PermissionsManagerStateProps = {
  camera: string,
  contacts: string
}

type PermissionsManagerDispatchProps = {
  updatePermissions: (permissions: { [string]: string }) => any
}

type Props = PermissionsManagerStateProps & PermissionsManagerDispatchProps

export class PermissionsManager extends React.Component<Props> {
  render () {
    return null
  }

  componentDidMount () {
    AppState.addEventListener('change', this.handleAppStateChange)

    this.checkPermissions()
  }

  handleAppStateChange = (nextAppState: string) => {
    console.log('State Change => ', nextAppState)

    if (nextAppState === AppStates.ACTIVE) {
      this.checkPermissions()
    }
  }

  checkPermissions = () => {
    RNPermissions.checkMultiple(Object.values(PermissionStrings))
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
      .catch(error => {
        console.log(error)
      })
  }
}

export const requestPermission = (permission: Permission): Promise<PermissionStatus> => {
  return RNPermissions.check(permission).then(status => {
    if (status === PermissionStatusStrings.UNDETERMINED) {
      return RNPermissions.request(permission)
    }

    return Promise.resolve(status)
  })
}

const mapStateToProps = (state: State): PermissionsManagerStateProps => ({
  camera: state.permissions.camera,
  contacts: state.permissions.contacts
})

const mapDispatchToProps = (dispatch: Dispatch): PermissionsManagerDispatchProps => ({
  updatePermissions: permissions =>
    dispatch({
      type: 'PERMISSIONS/UPDATE',
      data: { ...permissions }
    })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PermissionsManager)
