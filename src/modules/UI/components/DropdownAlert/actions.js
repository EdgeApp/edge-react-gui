// @flow

type DropdownInfo = { type?: string, title?: string, message?: string }
export const displayDropdownAlert = ({ type = 'custom', title = '', message = '' }: DropdownInfo) => ({
  type: 'UI/COMPONENTS/DROPDOWN_ALERT/DISPLAY_DROPDOWN_ALERT',
  data: {
    type,
    title,
    message
  }
})

export const dismissDropdownAlert = () => ({
  type: 'UI/COMPONENTS/DROPDOWN_ALERT/DISMISS_DROPDOWN_ALERT',
  data: {}
})
