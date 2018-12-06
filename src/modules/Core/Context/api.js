// @flow

import type { EdgeContext } from 'edge-core-js'

export const deleteLocalAccount = (context: EdgeContext, username: string) => {
  return context.deleteLocalAccount(username)
}

export const listUsernames = (context: EdgeContext) => {
  return context.listUsernames()
}

// TODO Allen: Function that returns exchange rate.
