import t from './LocaleStrings'
import { PermissionsAndroid } from 'react-native'

export async function checkCameraPermission (callback) {
  try {
    const permission = await PermissionsAndroid.checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA)

    callback(null, permission)
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function requestCameraPermission (callback) {
  try {
    const granted = await PermissionsAndroid.requestPermission(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        'title': t('activity_signup_camera_permission_1'),
        'message': t('activity_signup_camera_permission_2')
      }
    )
    callback(null, granted)
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function checkReadContactPermission (callback) {
  try {
    const permission = await PermissionsAndroid.checkPermission(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)

    callback(null, permission)
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function requestReadContacPermission (callback) {
  try {
    const granted = await PermissionsAndroid.requestPermission(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        'title': t('activity_signup_camera_permission_1'),
        'message': t('activity_signup_camera_permission_2')
      }
    )
    callback(null, granted)
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}
