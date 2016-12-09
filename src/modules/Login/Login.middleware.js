import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcContext from '../../lib/abcContext'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'

export const loginWithPassword = (username, password) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading('Logging-in'))
        callback(null, null)
      },
      getUsernameAvailability: function (callback) {
        setTimeout(() => {
          // if (username === 'user' && password === 'fam') {
          //   callback(null, null)
          // } else {
          //   callback('Error on login sample', null)
          // }
          abcContext.loginWithPassword(username, password, null, null, (error, account) => {
            if (error) {
              callback('Error on login sample', null)
            }
            if (!error) {
              callback(null, null)
            }
          })
        }, 3000)
      }
    }, function (err, results) {
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
