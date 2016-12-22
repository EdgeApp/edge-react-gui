
import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { passwordNotificationHide, changePasswordValue } from './Password.action'
import { signupUser } from '../Signup/Signup.middleware'

import t from '../../lib/LocaleStrings'

export const checkPassword = (password, passwordRepeat, validation, username, pinNumber) => {
  return dispatch => {
    if (!validation.upperCaseChar || !validation.lowerCaseChar || !validation.number || !validation.characterLength) {
      return dispatch(openErrorModal(t('activity_signup_insufficient_password')))
    }

    if (password !== passwordRepeat) {
      return dispatch(openErrorModal(t('activity_signup_passwords_dont_match')))
    }

    if (validation.upperCaseChar && validation.lowerCaseChar && validation.number && validation.characterLength && password === passwordRepeat) {
      return dispatch(signupUser(username, password, pinNumber))
    } else {
      return dispatch(openErrorModal(t('activity_signup_insufficient_password')))
    }
  }
}

export const skipPassword = (username, pinNumber) => {
  return dispatch => {
    dispatch(changePasswordValue(''))
    dispatch(passwordNotificationHide())
    return dispatch(signupUser(username, null, pinNumber))
  }
}
