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
        username: username,
        password: password,
        pin: pin
      })
    )
    return dispatch(checkPermissions())
    // / all of this code is unreachable until we solve the crypto randomBytes thing
    
      setTimeout(() => {
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
                username: username,
                password: password,
                pin: pin
              })
            )
            return dispatch(checkPermissions())
          }
        })
    })
      },300)
  }
}

const checkPermissions = () => {
  return dispatch => {
    checkCameraPermission((error, camera) => {
      if (error) {
        console.log(err)
      }
      if (!error) {
        console.log(camera)

        checkReadContactPermission((error, contact) => {
          if (error) {
            console.log(err)
          }
          if (!error) {
            console.log(contact)
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
