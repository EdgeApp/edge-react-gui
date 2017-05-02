export const OPEN_HELP_MODAL = 'OPEN_HELP_MODAL'
export const CLOSE_HELP_MODAL = 'CLOSE_HELP_MODAL'

export const openHelpModal = () => {
  return {
    type: OPEN_HELP_MODAL
  }
}

export const closeHelpModal = () => {
  return {
    type: CLOSE_HELP_MODAL
  }
}
