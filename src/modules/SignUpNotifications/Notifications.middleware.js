import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcContext from '../../lib/abcContext'
import { requestCameraPermission, checkReadContactPermission, requestReadContacPermission } from '../../lib/permissions'
import t from '../../lib/LocaleStrings'

export const cameraPermissions = () => {
  return dispatch => {
    asyncAuto({
      requestCameraPermissionCall: function (callback) {
        requestCameraPermission((error, granted) => {
          if (error) {
            return callback(error, null)
          }
          if (!error) {
            return callback(null, null)
          }
        })
      },
      checkReadContactPermissionCall: function (callback) {
        checkReadContactPermission((error, permission) => {
          if (error) {
            return callback(error, null)
          }
          if (!error) {
            return callback(null, permission)
          }
        })
      }
    }, function (err, result) {
      if (err) {
        console.log(err)
      }
      if (result.checkReadContactPermissionCall) {
        Actions.review()
      }
      if (!result.checkReadContactPermissionCall) {
        Actions.contactNotification()
      }
    })
  }
}

export const readContactPermissions = () => {
  return dispatch => {
    requestCameraPermission((error, granted) => {
      if (error) {
        console.log(error)
      }

      if (!error) {
        return Actions.review()
      }
    })
  }
}
