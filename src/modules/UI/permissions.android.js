import {PermissionsAndroid} from 'react-native'

export const request = (request) => {
  // console.log('Requesting permission')
  switch (request) {
  case 'camera':
    return requestCameraPermission()
  default:
    return
  }
}

export const requestCameraPermission = () => {
  const permission = PermissionsAndroid.PERMISSIONS.CAMERA
  const granted = PermissionsAndroid.RESULTS.GRANTED
  return PermissionsAndroid.request(permission)
  .then((permission) => permission === granted)
}
