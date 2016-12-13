import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcctx from '../../lib/abcContext'

import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { closeWarningModal } from '../WarningModal/WarningModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import t from '../../lib/LocaleStrings'
const timeoutTimer = setTimeout(() => { }, 0)

let isError = false

export const deleteUserToCache = username => {
  return dispatch => {
    asyncAuto({
      closeWarningModal: function (callback) {
        dispatch(closeWarningModal())
        callback(null, null)
      },
      openLoadingModal: function (callback) {
        dispatch(openLoading('Delete User'))
        callback(null, null)
      },
      removeUserToCache: function (callback) {
        isError = false

        // abcctx(context => {
        //   context.loginWithPassword(username, password, null, null, (error, account) => {
        //     if(isError) {
        //       isError = false
        //       return false;
        //     }
        //     if (error) {
        //       var mess
        //       try {
        //         mess = JSON.parse(error.message).message
        //       } catch (e) {
        //         mess = error
        //       }
        //       return callback(mess, null)
        //     }
        //
        //     if (!error) {
        //       return callback(null, null)
        //     }
        //   })
        // })

        // timeoutTimer = setTimeout(() => {
        //   isError = true
        //   return callback(t('string_no_connection_response'), null)
        // }, 10000)

        return callback(null, null)
      }

    }, function (err, results) {
      clearTimeout(timeoutTimer)
      dispatch(closeLoading())

      if (err) {
        dispatch(openErrorModal(err))
      }
      if (!err) {
        dispatch(openErrorModal('Successfully remove the user ' + username + ' from the cached'))
      }
    })
  }
}
