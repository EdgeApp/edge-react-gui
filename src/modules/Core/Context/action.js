// @flow

import type { DiskletFolder, EdgeContext } from 'edge-core-js'

import type { Dispatch, GetState } from '../../ReduxTypes.js'

const PREFIX = 'Core/Context/'

export const ADD_CONTEXT = PREFIX + 'ADD_CONTEXT'
export const addContext = (context: EdgeContext, folder: DiskletFolder) => ({
  type: ADD_CONTEXT,
  data: { context, folder }
})

export const ADD_USERNAMES = PREFIX + 'ADD_USERNAMES'
export const addUsernames = (usernames: Array<string>) => ({
  type: ADD_USERNAMES,
  data: { usernames }
})

export const DELETE_LOCAL_ACCOUNT_REQUEST = PREFIX + 'DELETE_LOCAL_ACCOUNT_REQUEST'
export const deleteLocalAccountRequest = (username: string) => ({
  type: DELETE_LOCAL_ACCOUNT_REQUEST,
  data: { username }
})

export const DELETE_LOCAL_ACCOUNT_SUCCESS = PREFIX + 'DELETE_LOCAL_ACCOUNT_SUCCESS'
export const deleteLocalAccountSuccess = (allUsernames: Array<string>) => ({
  type: DELETE_LOCAL_ACCOUNT_SUCCESS,
  data: { usernames: allUsernames }
})

export const DELETE_LOCAL_ACCOUNT_ERROR = PREFIX + 'DELETE_LOCAL_ACCOUNT_ERROR'
export const deleteLocalAccountError = (username: string) => ({
  type: DELETE_LOCAL_ACCOUNT_ERROR,
  data: { username }
})

export const fetchLoginMessages = (context: EdgeContext) => async (dispatch: Dispatch, getState: GetState) => {
  try {
    const accounts = await context.fetchLoginMessages()
    console.log(accounts)
    /* for (const key in accounts) {
      if (key === account.username) {
        otpResetPending = accounts[key].otpResetPending
      }
    } */
  } catch (e) {
    console.log(e)
  }
}
