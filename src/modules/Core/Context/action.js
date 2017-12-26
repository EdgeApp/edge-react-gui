// @flow

import type {AbcContext} from 'airbitz-core-types'

const PREFIX = 'Core/Context/'

export const ADD_CONTEXT = PREFIX + 'ADD_CONTEXT'
export const addContext = (context: AbcContext) => ({
  type: ADD_CONTEXT,
  data: {context}
})

export const ADD_USERNAMES = PREFIX + 'ADD_USERNAMES'
export const addUsernames = (usernames: Array<string>) => ({
  type: ADD_USERNAMES,
  data: {usernames}
})
