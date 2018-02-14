// @flow

import type { AbcContext } from 'edge-login'

import * as Constants from '../../../constants/indexConstants.js'
import type { Action } from '../../ReduxTypes'
import * as ACTION from './action.js'

const initialState = {
  context: {},
  usernames: [],
  nextUsername: ''
}
export type State = {
  context: AbcContext | {},
  usernames: Array<string>,
  nextUsername: string
}
export const context = (state: State = initialState, action: Action) => {
  const { type, data = {} } = action

  switch (type) {
    case ACTION.ADD_CONTEXT: {
      const context: AbcContext = data.context
      return {
        ...state,
        context
      }
    }

    case ACTION.ADD_USERNAMES: {
      const { usernames } = data
      return {
        ...state,
        usernames
      }
    }

    case ACTION.DELETE_LOCAL_ACCOUNT_SUCCESS: {
      const { usernames } = data
      return {
        ...state,
        usernames
      }
    }
    case Constants.DEEP_LINK_RECEIVED:
    case Constants.LOGOUT: {
      if (!data) {
        return state
      }
      const { username } = data
      return {
        ...state,
        nextUsername: username || ''
      }
    }

    default:
      return state
  }
}
