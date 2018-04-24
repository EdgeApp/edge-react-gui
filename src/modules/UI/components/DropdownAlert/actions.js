// @flow

const PREFIX = 'UI/components/DropdownAlert/'
export const DISPLAY_DROPDOWN_ALERT = PREFIX + 'DISPLAY_DROPDOWN_ALERT'
export const DISMISS_DROPDOWN_ALERT = PREFIX + 'DISMISS_DROPDOWN_ALERT'

type DropdownInfo = { type?: string, title?: string, message?: string }
export const displayDropdownAlert = ({ type = 'custom', title = '', message = '' }: DropdownInfo) => ({
  type: DISPLAY_DROPDOWN_ALERT,
  data: {
    type,
    title,
    message
  }
})

export const dismissDropdownAlert = () => ({
  type: DISMISS_DROPDOWN_ALERT,
  data: {}
})
