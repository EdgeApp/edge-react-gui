// @flow

import type { DiskletFolder, EdgeContext } from 'edge-core-js'

export const addContext = (context: EdgeContext, folder: DiskletFolder) => ({
  type: 'CORE/CONTEXT/ADD_CONTEXT',
  data: { context, folder }
})

export const addUsernames = (usernames: Array<string>) => ({
  type: 'CORE/CONTEXT/ADD_USERNAMES',
  data: { usernames }
})

export const deleteLocalAccountRequest = (username: string) => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_REQUEST',
  data: { username }
})

export const deleteLocalAccountSuccess = (allUsernames: Array<string>) => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_SUCCESS',
  data: { usernames: allUsernames }
})

export const deleteLocalAccountError = (username: string) => ({
  type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT_ERROR',
  data: { username }
})
