// @flow

export const SHOW_DELETE_TOKEN_MODAL = 'SHOW_DELETE_TOKEN_MODAL'
export const HIDE_DELETE_TOKEN_MODAL = 'HIDE_DELETE_TOKEN_MODAL'

export const showDeleteTokenModal = () => ({
  type: SHOW_DELETE_TOKEN_MODAL
})

export const hideDeleteTokenModal = () => ({
  type: HIDE_DELETE_TOKEN_MODAL
})
