// @flow
const PREFIX = 'UI/components/ErrorAlert/'
export const DISPLAY_ERROR_ALERT = PREFIX + 'DISPLAY_ERROR_ALERT'
export const DISMISS_ERROR_ALERT = PREFIX + 'DISMISS_ERROR_ALERT'

export const displayErrorAlert = (message: string) => ({
  type: DISPLAY_ERROR_ALERT,
  data: {message}
})

export const dismissErrorAlert = () => ({
  type: DISMISS_ERROR_ALERT,
  data: {message: ''}
})
