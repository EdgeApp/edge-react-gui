import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcctx from '../../lib/abcContext'
import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'

export const loginWithPassword = (username, password) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading(t('string_loading')))
        callback(null, null)
      },
      loginWithPassword: function (callback) {
        abcctx(context => {
          context.loginWithPassword(username, password, null, null, (error, account) => {
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
        })

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

export const loginWithPin = (username, pin) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading(t('string_loading')))
        callback(null, null)
      },
      loginWithPin: function (callback) {

        abcctx( context => {
          context.loginWithPIN(username, pin, (error, account) => {
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
        })

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
