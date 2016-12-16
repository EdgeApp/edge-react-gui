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
        setTimeout(() => {
          abcctx(context => {
            context.loginWithPassword(username, password, null, null, (error, account) => {
              if (error) {
                console.log(error)
                var mess
                try {
                  mess = error.message
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
        },200)

      }

    }, function (err, results) {
      dispatch(closeLoading())

      if (err) {
        dispatch(openErrorModal(err))
      }
      if (!err) {
        global.localStorage.setItem('lastUser', username)
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
        abcctx(context => {
          try {
            context.loginWithPIN(username, pin, (error, account) => {
              if (error) {
                console.log(error)
                var mess
                try {
                  mess = error.message
                } catch (e) {
                  mess = error
                }
                return callback(mess, null)
              }

              if (!error) {
                return callback(null, null)
              }
            })
          } catch(e) {
            console.log(e)
          }
        })
      }

    }, function (err, results) {
      dispatch(closeLoading())
      if (err) {
        dispatch(openErrorModal(err))
      }
      if (!err) {
        global.localStorage.setItem('lastUser', username)
        Actions.home()
      }
    })
  }
}
