/* eslint-disable flowtype/require-valid-file-annotation */

export const OPEN_HELP_MODAL = 'OPEN_HELP_MODAL'
export const CLOSE_HELP_MODAL = 'CLOSE_HELP_MODAL'

export const openHelpModal = () => ({
  type: OPEN_HELP_MODAL
})

export const closeHelpModal = () => ({
  type: CLOSE_HELP_MODAL
})
