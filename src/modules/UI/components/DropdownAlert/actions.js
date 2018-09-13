// @flow

type DropdownInfo = { type?: string, title?: string, message?: string }
export const displayDropdownAlert = ({ type = 'custom', title = '', message = '' }: DropdownInfo) => ({
  type: 'UI/components/DropdownAlert/DISPLAY_DROPDOWN_ALERT',
  data: {
    type,
    title,
    message
  }
})

export const dismissDropdownAlert = () => ({
  type: 'UI/components/DropdownAlert/DISMISS_DROPDOWN_ALERT',
  data: {}
})
