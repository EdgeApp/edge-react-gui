import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcctx from '../../lib/abcContext'
import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'
const timeoutTimer = setTimeout(() => { }, 0)
let isError = false
export const loginWithPassword = (username, password) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading(t('string_loading')))
        callback(null, null)
      },
      loginWithPassword: function (callback) {
        isError = false
        abcctx(context => {
          context.loginWithPassword(username, password, null, null, (error, account) => {
            if (isError) {
              isError = false
              return false
            }
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

        timeoutTimer = setTimeout(() => {
          isError = true
          return callback(t('string_no_connection_response'), null)
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

export const loginWithPin = (username, pin) => {
  return dispatch => {
    asyncAuto({
      openLoading: function (callback) {
        dispatch(openLoading(t('string_loading')))
        callback(null, null)
      },
      loginWithPin: function (callback) {
        isError = false
        abcctx(context => {
          context.loginWithPIN(username, pin, (error, account) => {
            if (isError) {
              isError = false
              return false
            }

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
            isError = true
            return callback(t('string_no_connection_response'), null)
          }, 10000)
        })
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
