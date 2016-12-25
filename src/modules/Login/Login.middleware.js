import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcctx from '../../lib/abcContext'
import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { openLoading, closeLoading } from '../Loader/Loader.action'

import { userLogin } from './Login.action'

import t from '../../lib/LocaleStrings'

export const loginWithPassword = (username, password) => {
  return dispatch => {
    dispatch(openLoading(t('string_loading')))
    abcctx(context => {
      console.log('context called')
      context.loginWithPassword(username, password, null, null, (error, account) => {
        console.log('login processed')
        dispatch(closeLoading())
        if (error) {
          console.log(error)
          var mess
          try {
            mess = error.message
          } catch (e) {
            mess = error
          }
          dispatch(openErrorModal(mess))
        }
        if (!error) {
          global.localStorage.setItem('lastUser', username)
          console.log('username set', username)
          dispatch(userLogin(results.loginWithPassword))
          console.log('userlogin dispatched with', results.loginWithPassword)
          Actions.home()
        }
      })
    })
  }
}

export const loginWithPin = (username, pin) => {
  return dispatch => {
    dispatch(openLoading(t('string_loading')))
    abcctx(context => {
      try {
        context.loginWithPIN(username, pin, (error, account) => {
          dispatch(closeLoading())
          if (error) {
            console.log(error)
            var mess
            try {
              mess = error.message
            } catch (e) {
              mess = error
            }
            dispatch(openErrorModal(mess))
          }

          if (!error) {
           global.localStorage.setItem('lastUser', username)
            Actions.home()
          }
        })
      } catch (e) {
        console.log(e)
      }
    })
  }
}
