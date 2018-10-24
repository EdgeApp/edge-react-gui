// @flow

import React from 'react'
import { AppState } from 'react-native'
import RNPermissions from 'react-native-permissions'
import { connect } from 'react-redux'

export const AppStates = {
  ACTIVE: 'active',
  BACKGROUND: 'background',
  INACTIVE: 'inactive'
}
export const Permissions = {
  CAMERA: 'camera',
  CONTACTS: 'contacts',
  PHOTOS: 'photo'
}

export const PermissionStatus = {
  AUTHORIZED: 'authorized',
  DENIED: 'denied',
  RESTRICTED: 'restricted',
  UNDETERMINED: 'undetermined'
}

type Props = {
  updatePermissions: (permissions: { [string]: string }) => void
}

export class AppStateManager extends React.Component<Props> {
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
    RNPermissions.checkMultiple(Object.values(Permissions))
      .then(response => {
        // response is an object mapping type to permission
        const permissions = {
          camera: response.camera,
          contacts: response.contacts,
          photo: response.photo
        }

        this.props.updatePermissions(permissions)
        console.log('Permissions updated')
      })
      .catch(error => {
        console.log(error)
      })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updatePermissions: permissions =>
    dispatch({
      type: 'PERMISSIONS/UPDATE',
      data: { ...permissions }
    })
})

export default connect(
  null,
  mapDispatchToProps
)(AppStateManager)
