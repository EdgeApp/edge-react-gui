import asyncAuto from 'async/auto'
import { Actions } from 'react-native-router-flux'

import abcctx from '../../lib/abcContext'

import { closeWarningModal } from '../WarningModal/WarningModal.action'
import { deleteUserFromUserCache } from './CachedUsers.action'

import t from '../../lib/LocaleStrings'

export const deleteUserToCache = username => {
  return dispatch => {
    const lastUser = global.localStorage.getItem('lastUser')

    abcctx(ctx => ctx.removeUsername(username))
    if (lastUser === username) global.localStorage.removeItem('lastUser')
    dispatch(deleteUserFromUserCache(username))
    dispatch(closeWarningModal())
  }
}
