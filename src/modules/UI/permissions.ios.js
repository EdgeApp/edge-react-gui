import Permissions from 'react-native-permissions'

export const request = (request) => {
  console.log('Requesting permission')
  switch (request) {
  case 'camera':
    return requestCameraPermission()
  default:
    return
  }
}

export const requestCameraPermission = () => {
  return Permissions.request('camera')
  .then(permission => {
    return permission === 'authorized'
  })
}
