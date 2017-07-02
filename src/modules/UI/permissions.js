import { Platform, PermissionsAndroid } from 'react-native'
// import Permissions from 'react-native-permissions'

export const request = (request) => {
  switch (request) {
    case 'camera':
      return requestCameraPermission()
    default:
      return
  }
}

export const requestCameraPermission = () => {
  if (Platform.OS === 'ios') {
    const result = Promise.resolve(true)
    return result
  }
  if (Platform.OS === 'android') {
    const title = 'Edge uses your camera to scan QR codes and Edge Login'
    const message = 'Edge uses your camera to scan QR codes and Edge Login'
    const modal = { title, message }
    const permission = PermissionsAndroid.PERMISSIONS.CAMERA
    const granted = PermissionsAndroid.RESULTS.GRANTED
    return PermissionsAndroid.request(permission, modal)
    .then(permission => {
      return permission === granted
    })
  }
}
