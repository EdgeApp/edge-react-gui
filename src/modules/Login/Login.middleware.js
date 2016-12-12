import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcContext from '../../lib/abcContext'
import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'
const timeoutTimer = setTimeout(() => {}, 0)
export const loginWithPassword = (username, password) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading(t('string_loading')))
        callback(null, null)
      },
      loginWithPassword: function (callback) {
        abcContext.loginWithPassword('david horton3', 'L44m201212', null, null, (error, account) => {
          if (error) {
            var mess
            try {
              mess = JSON.parse(error.message).message
            } catch (e) {
              mess = error
            }
            return callback(mess, null)
          }
          if (!error) {
            return callback(null, null)
          }
        })
        timeoutTimer = setTimeout(() => {
          callback(t('string_no_connection_response'))
        }, 10000)
      }
    }, function (err, results) {
      clearTimeout(timeoutTimer)
      dispatch(closeLoading())

      if (err) {
        dispatch(openErrorModal(err))
      }
      if (!err) {
        Actions.home()
      }
    })
  }
}
