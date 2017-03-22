
import { Actions } from 'react-native-router-flux'

import abcContext from '../../lib/abcContext'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'
export const checkUsername = username => {
  return dispatch => {
    if (username.length < 3) {
      return dispatch(openErrorModal(t('activity_signup_insufficient_username_message')))
    }

    dispatch(openLoading(t('activity_signup_checking_username')))
    setTimeout(() => {
      abcContext(context => {
        context.usernameAvailable(username, function (err, available) {
          dispatch(closeLoading())
          if (err) {
            return dispatch(openErrorModal(t('activity_signup_username_unavailable')))
          }
          Actions.pin()
        })
      })
    }, 300)
  }
}
