// @flow

import type { DiskletFolder, EdgeContext } from 'edge-core-js'

import * as Constants from '../../../constants/indexConstants.js'
import type { Action } from '../../ReduxTypes'
import * as ACTION from './action.js'

const initialState = {
  context: {},
  usernames: [],
  nextUsername: ''
}
export type State = {
  context: EdgeContext | {},
  usernames: Array<string>,
  nextUsername: string
}
export const context = (state: State = initialState, action: Action) => {
  const { type, data = {} } = action

  switch (type) {
    case ACTION.ADD_CONTEXT: {
      const context: EdgeContext = data.context
      const folder: DiskletFolder = data.folder
      return {
        ...state,
        context,
        folder
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
