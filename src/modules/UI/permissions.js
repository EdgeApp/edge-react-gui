import { Platform, PermissionsAndroid } from 'react-native'
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
  if (Platform.OS === 'ios') {
    return Permissions.requestPermission('camera')
    .then(permission => {
      return permission === 'authorized'
    })
  }
  if (Platform.OS === 'android') {
    const permission = PermissionsAndroid.PERMISSIONS.CAMERA
    const granted = PermissionsAndroid.RESULTS.GRANTED
    return PermissionsAndroid.request(permission)
    .then(permission => {
      return permission === granted
    })
  }
}
