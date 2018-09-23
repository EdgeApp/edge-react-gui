// @flow

import type { DiskletFolder, EdgeContext } from 'edge-core-js'

export type AddContextAction = {
  type: 'CORE/CONTEXT/ADD_CONTEXT',
  data: { context: EdgeContext, folder: DiskletFolder }
}

export type AddUsernamesAction = {
  type: 'CORE/CONTEXT/ADD_USERNAMES',
  data: { usernames: Array<string> }
}

export type DeleteLocalAccountRequestAction = {
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_REQUEST',
  data: { username: string }
}

export type DeleteLocalAccountSuccessAction = {
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_SUCCESS',
  data: { usernames: Array<string> }
}

export type DeleteLocalAccountErrorAction = {
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_ERROR',
  data: { username: string }
}

export type CoreContextAction =
  | AddContextAction
  | AddUsernamesAction
  | DeleteLocalAccountRequestAction
  | DeleteLocalAccountSuccessAction
  | DeleteLocalAccountErrorAction

export const addContext = (context: EdgeContext, folder: DiskletFolder): AddContextAction => ({
  type: 'CORE/CONTEXT/ADD_CONTEXT',
  data: { context, folder }
})

export const addUsernames = (usernames: Array<string>): AddUsernamesAction => ({
  type: 'CORE/CONTEXT/ADD_USERNAMES',
  data: { usernames }
})

export const deleteLocalAccountRequest = (username: string): DeleteLocalAccountRequestAction => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_REQUEST',
  data: { username }
})

export const deleteLocalAccountSuccess = (allUsernames: Array<string>): DeleteLocalAccountSuccessAction => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_SUCCESS',
  data: { usernames: allUsernames }
})

export const deleteLocalAccountError = (username: string): DeleteLocalAccountErrorAction => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_ERROR',
  data: { username }
})
