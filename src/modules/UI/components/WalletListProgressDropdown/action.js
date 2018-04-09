// @flow

export const DISPLAY_WALLET_PROGRESS_DROPDOWN = 'DISPLAY_WALLET_PROGRESS_DROPDOWN'
export const DISMISS_WALLET_PROGRESS_DROPDOWN = 'DISMISS_WALLET_PROGRESS_DROPDOWN'

export const displayWalletProgressDropdown = (message: string) => ({
  type: DISPLAY_WALLET_PROGRESS_DROPDOWN,
  data: { message: 'This is just a testestest' }
})

export const dismissWalletProgressDropdown = () => ({
  type: DISMISS_WALLET_PROGRESS_DROPDOWN,
  data: { message: 'No longer a test' }
})
