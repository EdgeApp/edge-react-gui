import Permissions from 'react-native-permissions'

export const request = request => {
  // console.log('Requesting permission')
  switch (request) {
    case 'camera':
      return requestCameraPermission()
    default:
  }
}

export const requestCameraPermission = () => Permissions.request('camera').then(permission => permission === 'authorized')
