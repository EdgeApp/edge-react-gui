import { Actions } from 'react-native-router-flux'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { passwordNotificationHide, changePasswordValue } from './Password.action'

import abcContext from '../../lib/abcContext'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'
const timeoutTimer = setTimeout(() => {}, 0)
export const checkPassword = (password, passwordRepeat, validation, username, pinNumber) => {
  return dispatch => {
    if (!validation.upperCaseChar || !validation.lowerCaseChar || !validation.number || !validation.characterLength) {
      return dispatch(openErrorModal(t('activity_signup_insufficient_password')))
    }

    if (password !== passwordRepeat) {
      return dispatch(openErrorModal(t('activity_signup_passwords_dont_match')))
    }

    if (validation.upperCaseChar && validation.lowerCaseChar && validation.number && validation.characterLength && password === passwordRepeat) {
      dispatch(openLoading(t('fragment_signup_creating_account')))
      abcContext.createAccount(username, password, pinNumber, (err, result) => {
        dispatch(closeLoading())
        clearTimeout(timeoutTimer)
        if (err) {
          console.log('account creation error', err)
          var mess
          try {
            mess = JSON.parse(err.message).message
          } catch (e) {
            mess = err
          }
          return dispatch(openErrorModal(t('activity_signup_failed')))
        }
        Actions.review()
      })
      timeoutTimer = setTimeout(() => {
        dispatch(closeLoading())
        dispatch(openErrorModal(t('string_no_connection_response')))
      }, 10000)
    } else {
      // this really should never happen
      return dispatch(openErrorModal(t('activity_signup_insufficient_password')))
    }
  }
}

export const skipPassword = (username, pinNumber) => {
  return dispatch => {
    dispatch(changePasswordValue(''))
    dispatch(passwordNotificationHide())
    abcContext.createAccount(username, null, pinNumber, (err, result) => {
      dispatch(closeLoading())
      clearTimeout(timeoutTimer)
      if (err) {
        console.log('account creation error', err)
        var mess
        try {
          mess = JSON.parse(error.message).message
        } catch (e) {
          mess = error
        }
        return dispatch(openErrorModal(t('activity_signup_failed')))
      }
      Actions.review()
    })
    timeoutTimer = setTimeout(() => {
      dispatch(closeLoading())
      dispatch(openErrorModal(t('string_no_connection_response')))
    }, 10000)
  }
}
