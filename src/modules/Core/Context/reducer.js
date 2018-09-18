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
  const { type, data = {} } = action

  switch (type) {
    case 'Core/Context/ADD_CONTEXT': {
      const context: EdgeContext = data.context
      const folder: DiskletFolder = data.folder
      return {
        ...state,
        context,
        folder
      }
    }

    case 'Core/Context/ADD_USERNAMES': {
      const { usernames } = data
      return {
        ...state,
        usernames
      }
    }

    case 'Core/Context/DELETE_LOCAL_ACCOUNT_REQUEST': {
      const { usernames } = data
      return {
        ...state,
        usernames
      }
    }

    case 'deepLinkReceived':
    case 'LOGOUT': {
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
