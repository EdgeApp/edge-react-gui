export const OPEN_HELP_MODAL = 'OPEN_HELP_MODAL'
export const CLOSE_HELP_MODAL = 'CLOSE_HELP_MODAL'

export const openHelpModal = () => {
  console.log('the help modal opening should be triggerd')
  return {
    type: OPEN_HELP_MODAL
  }
}

export const closeHelpModal = () => ({
  type: CLOSE_HELP_MODAL
})
