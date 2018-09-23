// @flow

import type { DiskletFolder, EdgeContext } from 'edge-core-js'

import type { Action } from '../../ReduxTypes'

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
  switch (action.type) {
    case 'CORE/CONTEXT/ADD_CONTEXT': {
      if (!action.data) throw new Error('Invalid action')
      const context: EdgeContext = action.data.context
      const folder: DiskletFolder = action.data.folder
      return {
        ...state,
        context,
        folder
      }
    }

    case 'CORE/CONTEXT/ADD_USERNAMES': {
      if (!action.data) throw new Error('Invalid action')
      const { usernames } = action.data
      return {
        ...state,
        usernames
      }
    }

    case 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_REQUEST': {
      if (!action.data) throw new Error('Invalid action')
      // $FlowFixMe
      const { usernames } = action.data
      return {
        ...state,
        usernames
      }
    }

    case 'DEEP_LINK_RECEIVED':
    case 'LOGOUT': {
      if (!action.data) {
        return state
      }
      const { username } = action.data
      return {
        ...state,
        nextUsername: username || ''
      }
    }

    default:
      return state
  }
}
