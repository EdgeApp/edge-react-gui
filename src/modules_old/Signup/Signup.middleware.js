
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
        username: username,
        password: password,
        pin: pin
      })
    )
    global.localStorage.setItem('lastUser', username)
    dispatch(checkPermissions())
    if (username) { return }
    dispatch(openLoading(t('fragment_signup_creating_account')))
    setTimeout(() => {
      abcctx(ctx => {
        ctx.createAccount(username, password, pin, (err, result) => {
          dispatch(closeLoading())
          if (err) {
            return dispatch(openErrorModal(t('activity_signup_failed') + ': ' + err.message))
          }

          if (!err) {
            global.localStorage.setItem('lastUser', username)
            dispatch(
              getDetails({
                username: username,
                password: password,
                pin: pin
              })
            )
            return dispatch(checkPermissions())
          }
        })
      })
    }, 300)
  }
}

const checkPermissions = () => {
  return dispatch => {
    checkCameraPermission((errorCamera, camera) => {
      if (errorCamera) {
        console.log(errorCamera)
      }
      if (!errorCamera) {
        console.log('camera permissions', camera)

        checkReadContactPermission((errorContact, contact) => {
          if (errorContact) {
            console.log(errorContact)
          }
          if (!errorContact) {
            console.log('contact permissions', contact)
          }
          dispatch(closeLoading())
          if (!camera) {
            Actions.cameraNotification()
          }
          if (camera && !contact) {
            Actions.contactNotification()
          }
          if (camera && contact) {
            Actions.review()
          }
        })
      }
    })
  }
}
