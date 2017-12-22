// @flow

import type {AbcContext} from 'airbitz-core-types'

import type {Action} from '../../ReduxTypes'
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
  const {type, data = {} } = action

  switch (type) {
  case ACTION.ADD_CONTEXT: {
    const context: AbcContext = data.context
    return {
      ...state,
      context
    }
  }

  case ACTION.ADD_USERNAMES: {
    const {usernames} = data
    return {
      ...state,
      usernames
    }
  }

  case 'LOGOUT': {
    const {username} = data
    return {
      ...state,
      nextUsername: username || ''
    }
  }

  default:
    return state
  }
}
