import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'
import { getDetails } from '../ReviewDetails/ReviewDetails.action'

import { checkCameraPermission, checkReadContactPermission } from '../../lib/permissions'

import abcctx from '../../lib/abcContext'
import t from '../../lib/LocaleStrings'

export const signupUser = (username, password, pin) => {
  return dispatch => {
    dispatch(
      getDetails({
        username  : username,
        password  : password,
        pin       : pin
      })
    )
    return dispatch(checkPermissions())
    // / all of this code is unreachable until we solve the crypto randomBytes thing
    dispatch(openLoading(t('fragment_signup_creating_account')))
    abcctx(ctx => {
      ctx.createAccount(username, password, pin, (err, result) => {
        if (err) {
          console.log(err)
          var mess
          try {
            mess = err.message
          } catch (e) {
            mess = err
          }
          dispatch(closeLoading())
          return dispatch(openErrorModal(t('activity_signup_failed')))
        }

        if (!err) {
          global.localStorage.setItem('lastUser', username)
          dispatch(
            getDetails({
              username  : username,
              password  : password,
              pin       : pin
            })
          )
          return dispatch(checkPermissions())
        }
      })
    })
  }
}

checkPermissions = () => {
  return dispatch => {
    asyncAuto({
      camera: function (callback) {
        checkCameraPermission((error, permission) => {
          if (error) {
            return callback(error, null)
          }
          if (!error) {
            console.log(permission)
            return callback(null, permission)
          }
        })
      },
      contact: function (callback) {
        checkReadContactPermission((error, permission) => {
          if (error) {
            return callback(error, null)
          }
          if (!error) {
            console.log(permission)
            return callback(null, permission)
          }
        })
      }
    }, function (err, result) {
      dispatch(closeLoading())
      if (err) {
        console.log(err)
      }
      if (!result.camera) {
        Actions.cameraNotification()
      }
      if (result.camera && !result.contact) {
        Actions.contactNotification()
      }
      if (result.camera && result.contact) {
        Actions.review()
      }
    })
  }
}
