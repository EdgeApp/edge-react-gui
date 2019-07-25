// @flow

import { type DiskletFolder } from 'disklet'
import type { EdgeContext } from 'edge-core-js'
import { type Reducer } from 'redux'

import { type Action } from '../../ReduxTypes.js'

export type ContextState = {
  context: EdgeContext | Object,
  folder: DiskletFolder | Object,
  usernames: Array<string>,
  nextUsername: string
}

const initialState = {
  context: {},
  folder: {},
  nextUsername: '',
  usernames: []
}

export const context: Reducer<ContextState, Action> = (state = initialState, action: Action) => {
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

    case 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT': {
      const { username } = action.data
      return {
        ...state,
        usernames: state.usernames.filter(name => name !== username)
      }
    }

    case 'DEEP_LINK_RECEIVED':
    case 'LOGOUT': {
      if (!action.data) throw new TypeError('Invalid action')
      const { username } = action.data
      return {
        ...state,
        nextUsername: username || ''
      }
    }

    default:
      // $FlowFixMe
      return state
  }
}
