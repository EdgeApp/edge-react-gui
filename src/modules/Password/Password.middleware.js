import { Actions } from 'react-native-router-flux'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { passwordNotificationHide, changePasswordValue } from './Password.action'

import t from '../../lib/LocaleStrings'

export const checkPassword = (password, passwordRepeat, validation) => {
  return dispatch => {
    if (!validation.upperCaseChar || !validation.lowerCaseChar || !validation.number || !validation.characterLength) {
      return dispatch(openErrorModal(t('activity_signup_insufficient_password')))
    }

    if (password !== passwordRepeat) {
      return dispatch(openErrorModal(t('activity_signup_passwords_dont_match')))
    }

    if (validation.upperCaseChar && validation.lowerCaseChar && validation.number && validation.characterLength && password === passwordRepeat) {
      Actions.review()
    }
  }
}

export const skipPassword = () => {
  return dispatch => {
    dispatch(changePasswordValue(''))
    dispatch(passwordNotificationHide())
    Actions.review()
  }
}
